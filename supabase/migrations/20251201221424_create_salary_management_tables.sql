/*
  # Salary Management System

  ## Overview
  This migration creates tables for managing employee salary configurations
  and monthly salary records with detailed breakdowns.

  ## New Tables

  ### `salary_config`
  Stores salary configuration for each employee.
  - `id` (uuid, primary key) - Unique config identifier
  - `employee_id` (uuid, foreign key) - References employees table
  - `salary_type` (text) - Type: 'monthly' or 'hourly'
  - `base_amount` (numeric) - Base salary per month or hourly rate
  - `overtime_multiplier` (numeric) - Overtime rate multiplier (default 1.5)
  - `currency` (text) - Currency code (default 'USD')
  - `effective_from` (date) - When this config becomes effective
  - `effective_to` (date, nullable) - When this config expires
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `salary_records`
  Stores calculated monthly salary records for employees.
  - `id` (uuid, primary key) - Unique record identifier
  - `employee_id` (uuid, foreign key) - References employees table
  - `period_month` (integer) - Month (1-12)
  - `period_year` (integer) - Year
  - `working_days` (integer) - Total working days in period
  - `days_present` (integer) - Days employee was present
  - `days_absent` (integer) - Days employee was absent
  - `paid_leave_days` (numeric) - Paid leave days taken
  - `unpaid_leave_days` (numeric) - Unpaid leave days taken
  - `total_hours_worked` (numeric) - Total hours worked
  - `overtime_hours` (numeric) - Overtime hours worked
  - `late_arrivals` (integer) - Count of late arrivals
  - `early_leaves` (integer) - Count of early departures
  - `base_pay` (numeric) - Base salary component
  - `overtime_pay` (numeric) - Overtime payment
  - `allowances` (numeric) - Additional allowances
  - `unpaid_leave_deduction` (numeric) - Deduction for unpaid leave
  - `other_deductions` (numeric) - Other deductions (tax, etc)
  - `net_pay` (numeric) - Final net salary
  - `is_provisional` (boolean) - Whether this is provisional/in-progress
  - `notes` (text, nullable) - Optional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security

  ### Row Level Security (RLS)
  - RLS enabled on all tables
  - Employees can read their own salary config and records
  - Only admins can insert/update records (to be implemented)

  ## Indexes
  - Index on salary_config.employee_id
  - Index on salary_records.employee_id
  - Composite index on salary_records (employee_id, period_year, period_month)

  ## Important Notes
  1. Salary calculations are stored, not computed on-the-fly
  2. Records are created by payroll processing (admin function)
  3. is_provisional flag indicates in-progress periods
  4. All monetary values use numeric type for precision
  5. One active salary config per employee at any time
*/

-- Create salary_config table
CREATE TABLE IF NOT EXISTS salary_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  salary_type text NOT NULL DEFAULT 'monthly',
  base_amount numeric(12,2) NOT NULL,
  overtime_multiplier numeric(3,2) NOT NULL DEFAULT 1.5,
  currency text NOT NULL DEFAULT 'USD',
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (salary_type IN ('monthly', 'hourly')),
  CHECK (base_amount > 0),
  CHECK (overtime_multiplier > 0)
);

-- Create salary_records table
CREATE TABLE IF NOT EXISTS salary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_month integer NOT NULL,
  period_year integer NOT NULL,
  working_days integer NOT NULL DEFAULT 0,
  days_present integer NOT NULL DEFAULT 0,
  days_absent integer NOT NULL DEFAULT 0,
  paid_leave_days numeric(4,1) NOT NULL DEFAULT 0,
  unpaid_leave_days numeric(4,1) NOT NULL DEFAULT 0,
  total_hours_worked numeric(6,2) NOT NULL DEFAULT 0,
  overtime_hours numeric(6,2) NOT NULL DEFAULT 0,
  late_arrivals integer NOT NULL DEFAULT 0,
  early_leaves integer NOT NULL DEFAULT 0,
  base_pay numeric(12,2) NOT NULL DEFAULT 0,
  overtime_pay numeric(12,2) NOT NULL DEFAULT 0,
  allowances numeric(12,2) NOT NULL DEFAULT 0,
  unpaid_leave_deduction numeric(12,2) NOT NULL DEFAULT 0,
  other_deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_pay numeric(12,2) NOT NULL DEFAULT 0,
  is_provisional boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, period_year, period_month),
  CHECK (period_month BETWEEN 1 AND 12),
  CHECK (period_year >= 2000),
  CHECK (days_present >= 0),
  CHECK (days_absent >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_salary_config_employee_id ON salary_config(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_employee_id ON salary_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_period ON salary_records(employee_id, period_year, period_month);

-- Enable Row Level Security
ALTER TABLE salary_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salary_config
CREATE POLICY "Employees can view own salary config"
  ON salary_config FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- RLS Policies for salary_records
CREATE POLICY "Employees can view own salary records"
  ON salary_records FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Triggers to automatically update updated_at
CREATE TRIGGER update_salary_config_updated_at BEFORE UPDATE ON salary_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_records_updated_at BEFORE UPDATE ON salary_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
