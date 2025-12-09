/*
  # Add date of birth to employees table

  ## Overview
  This migration adds a date_of_birth field to the employees table
  to support birthday tracking and events functionality.

  ## Changes
  1. Add date_of_birth column (nullable for existing records)
  2. Add index for efficient birthday queries
*/

-- Add date_of_birth column to employees table
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Create index for efficient birthday queries
CREATE INDEX IF NOT EXISTS idx_employees_date_of_birth ON employees(date_of_birth);
