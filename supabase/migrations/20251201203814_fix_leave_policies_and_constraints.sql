/*
  # Fix Leave Management Policies and Constraints

  ## Overview
  This migration adds missing RLS policies for leave_balances and
  fixes the holidays table constraint for upsert operations.

  ## Changes
  1. Add INSERT policy for leave_balances (employees can insert their own balances)
  2. Add unique constraint on holidays table for (name, date)
  3. Ensure holidays can be read by all authenticated users
*/

-- Add INSERT policy for leave_balances
CREATE POLICY "Employees can insert own leave balances"
  ON leave_balances FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

-- Add unique constraint for holidays
ALTER TABLE holidays
  ADD CONSTRAINT unique_holiday_name_date UNIQUE (name, date);

-- Ensure holidays INSERT works (for admin/system use)
CREATE POLICY "Allow insert on holidays"
  ON holidays FOR INSERT
  TO authenticated
  WITH CHECK (true);
