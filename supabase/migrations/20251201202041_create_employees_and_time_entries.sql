/*
  # Employee Management Platform - Initial Schema

  ## Overview
  This migration creates the foundational tables for the employee management platform,
  including employee records and time entry tracking.

  ## New Tables

  ### `employees`
  Stores employee profile information and configuration.
  - `id` (uuid, primary key) - Unique employee identifier
  - `email` (text, unique) - Employee email for authentication
  - `first_name` (text) - Employee first name
  - `last_name` (text) - Employee last name
  - `designation` (text) - Job title/position
  - `department` (text) - Department assignment
  - `join_date` (date) - Date employee joined company
  - `standard_shift_start` (time) - Standard shift start time (e.g., '09:00')
  - `standard_shift_end` (time) - Standard shift end time (e.g., '17:00')
  - `standard_hours_per_day` (numeric) - Expected work hours per day (default 8)
  - `is_admin` (boolean) - Admin role flag (default false)
  - `is_active` (boolean) - Active status (default true)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `time_entries`
  Stores daily time in/out records for attendance tracking.
  - `id` (uuid, primary key) - Unique time entry identifier
  - `employee_id` (uuid, foreign key) - References employees table
  - `date` (date) - Entry date (unique per employee per day)
  - `time_in` (timestamptz) - Clock in timestamp
  - `time_out` (timestamptz, nullable) - Clock out timestamp
  - `total_hours` (numeric, nullable) - Calculated total hours worked
  - `overtime_hours` (numeric) - Calculated overtime hours (default 0)
  - `is_late` (boolean) - Late arrival flag (default false)
  - `is_early_leave` (boolean) - Early departure flag (default false)
  - `notes` (text, nullable) - Optional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security

  ### Row Level Security (RLS)
  - RLS enabled on both tables
  - Employees can read their own records
  - Employees can read/write their own time entries
  - Admins can read all records (to be implemented via policies)

  ## Indexes
  - Index on `time_entries.employee_id` for efficient queries
  - Index on `time_entries.date` for date-based filtering
  - Composite index on `employee_id, date` for unique constraint

  ## Important Notes
  1. All timestamps use `timestamptz` for timezone awareness
  2. Standard shift times use `time` type for time-only values
  3. Foreign key constraint ensures referential integrity
  4. Unique constraint on `employee_id, date` prevents duplicate entries
  5. `time_out` is nullable to support open shifts (not yet clocked out)
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  designation text NOT NULL,
  department text NOT NULL,
  join_date date NOT NULL DEFAULT CURRENT_DATE,
  standard_shift_start time NOT NULL DEFAULT '09:00',
  standard_shift_end time NOT NULL DEFAULT '17:00',
  standard_hours_per_day numeric(4,2) NOT NULL DEFAULT 8.00,
  is_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time_in timestamptz NOT NULL,
  time_out timestamptz,
  total_hours numeric(5,2),
  overtime_hours numeric(5,2) NOT NULL DEFAULT 0,
  is_late boolean NOT NULL DEFAULT false,
  is_early_leave boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees table
CREATE POLICY "Employees can view own profile"
  ON employees FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Employees can update own profile"
  ON employees FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for time_entries table
CREATE POLICY "Employees can view own time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own time entries"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own time entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
