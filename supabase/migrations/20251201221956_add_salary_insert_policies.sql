/*
  # Add INSERT policies for salary tables

  ## Overview
  This migration adds INSERT policies for salary_config and salary_records
  to allow authenticated users to insert their own data during seeding.

  ## Changes
  1. Add INSERT policy for salary_config
  2. Add INSERT policy for salary_records
*/

-- Allow authenticated users to insert their own salary config
CREATE POLICY "Employees can insert own salary config"
  ON salary_config FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

-- Allow authenticated users to insert their own salary records
CREATE POLICY "Employees can insert own salary records"
  ON salary_records FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());
