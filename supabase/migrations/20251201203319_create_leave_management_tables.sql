/*
  # Leave Management System

  ## Overview
  This migration creates the tables necessary for managing employee leave requests,
  leave balances, and company holidays.

  ## New Tables

  ### `leave_balances`
  Stores each employee's leave balance by type.
  - `id` (uuid, primary key) - Unique balance record identifier
  - `employee_id` (uuid, foreign key) - References employees table
  - `leave_type` (text) - Type of leave (paid, sick, unpaid)
  - `total_days` (numeric) - Total allocated days for this leave type
  - `used_days` (numeric) - Days already used/approved
  - `remaining_days` (numeric) - Days remaining (calculated)
  - `year` (integer) - Year this balance applies to
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `holidays`
  Stores company-wide holidays.
  - `id` (uuid, primary key) - Unique holiday identifier
  - `name` (text) - Holiday name (e.g., "New Year's Day")
  - `date` (date) - Holiday date
  - `is_recurring` (boolean) - Whether holiday recurs yearly
  - `description` (text, nullable) - Optional description
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `leave_requests`
  Stores employee leave requests and their approval status.
  - `id` (uuid, primary key) - Unique request identifier
  - `employee_id` (uuid, foreign key) - References employees table
  - `leave_type` (text) - Type of leave (paid, sick, unpaid)
  - `start_date` (date) - Leave start date
  - `end_date` (date) - Leave end date
  - `is_half_day` (boolean) - Whether this is a half-day leave
  - `total_days` (numeric) - Total days requested (0.5 for half day)
  - `reason` (text, nullable) - Optional reason for leave
  - `status` (text) - Status: pending, approved, rejected
  - `approver_id` (uuid, nullable) - References employees table (admin who approved/rejected)
  - `approver_comment` (text, nullable) - Optional comment from approver
  - `approved_at` (timestamptz, nullable) - Timestamp of approval/rejection
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security

  ### Row Level Security (RLS)
  - RLS enabled on all tables
  - Employees can read their own leave balances and requests
  - Employees can insert their own leave requests
  - Employees can update their pending leave requests (for cancellation)
  - All employees can read holidays
  - Admins can read/update all records (policies to be added)

  ## Indexes
  - Index on leave_balances.employee_id for efficient queries
  - Index on leave_requests.employee_id for efficient queries
  - Index on leave_requests.status for filtering
  - Index on holidays.date for date-based queries

  ## Important Notes
  1. Leave types are stored as text for flexibility
  2. Status values are enforced at application level
  3. Remaining days in leave_balances is calculated field
  4. Half-day leaves count as 0.5 days
  5. Holidays are company-wide and readable by all authenticated users
*/

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  total_days numeric(5,1) NOT NULL DEFAULT 0,
  used_days numeric(5,1) NOT NULL DEFAULT 0,
  remaining_days numeric(5,1) GENERATED ALWAYS AS (total_days - used_days) STORED,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, leave_type, year)
);

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_half_day boolean NOT NULL DEFAULT false,
  total_days numeric(5,1) NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approver_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  approver_comment text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK (status IN ('pending', 'approved', 'rejected')),
  CHECK (leave_type IN ('paid', 'sick', 'unpaid'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_id ON leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Enable Row Level Security
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_balances
CREATE POLICY "Employees can view own leave balances"
  ON leave_balances FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- RLS Policies for holidays (all authenticated users can read)
CREATE POLICY "All authenticated users can view holidays"
  ON holidays FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for leave_requests
CREATE POLICY "Employees can view own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own pending leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending')
  WITH CHECK (employee_id = auth.uid());

-- Triggers to automatically update updated_at
CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update leave balance after leave approval
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE leave_balances
    SET used_days = used_days + NEW.total_days
    WHERE employee_id = NEW.employee_id
      AND leave_type = NEW.leave_type
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leave balance when request is approved
CREATE TRIGGER update_balance_on_leave_approval
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION update_leave_balance_on_approval();
