/*
  # Create Payroll Settings Table

  1. New Tables
    - `payroll_settings`
      - `id` (uuid, primary key)
      - `hourly_rate` (numeric) - Base hourly rate for calculations
      - `overtime_multiplier` (numeric) - Multiplier for overtime pay (e.g., 1.5)
      - `standard_working_days_per_month` (integer) - Expected working days per month
      - `deduction_type` (text) - 'hourly' or 'daily'
      - `daily_deduction_rate` (numeric) - Fixed daily deduction amount
      - `currency` (text) - Currency code (e.g., 'USD', 'PKR')
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `payroll_settings` table
    - Add policy for authenticated admin users to read payroll settings
    - Add policy for authenticated admin users to update payroll settings

  3. Notes
    - Only one row should exist in this table (global settings)
    - Insert default settings on creation
*/

CREATE TABLE IF NOT EXISTS payroll_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hourly_rate numeric NOT NULL DEFAULT 10 CHECK (hourly_rate > 0),
  overtime_multiplier numeric NOT NULL DEFAULT 1.5 CHECK (overtime_multiplier >= 1),
  standard_working_days_per_month integer NOT NULL DEFAULT 22 CHECK (standard_working_days_per_month BETWEEN 1 AND 31),
  deduction_type text NOT NULL DEFAULT 'hourly' CHECK (deduction_type IN ('hourly', 'daily')),
  daily_deduction_rate numeric DEFAULT 0 CHECK (daily_deduction_rate >= 0),
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read payroll settings"
  ON payroll_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can update payroll settings"
  ON payroll_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.is_admin = true
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payroll_settings) THEN
    INSERT INTO payroll_settings (
      hourly_rate,
      overtime_multiplier,
      standard_working_days_per_month,
      deduction_type,
      daily_deduction_rate,
      currency
    ) VALUES (
      10,
      1.5,
      22,
      'hourly',
      0,
      'USD'
    );
  END IF;
END $$;
