/*
  # Add INSERT policy for employees table

  ## Overview
  This migration adds an INSERT policy for the employees table to allow
  new user records to be created during signup.

  ## Changes
  1. Add INSERT policy for authenticated users to insert their own employee record
     - This is needed for the signup/seed process
     - Users can only insert a record with their own auth.uid()
*/

-- Allow authenticated users to insert their own employee record
CREATE POLICY "Users can insert own employee record"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
