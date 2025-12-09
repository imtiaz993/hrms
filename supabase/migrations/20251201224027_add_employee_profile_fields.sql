/*
  # Add employee profile fields

  ## Overview
  This migration adds additional profile fields to the employees table
  to support comprehensive employee profiles including personal information
  and emergency contacts.

  ## Changes
  1. Add phone number field
  2. Add address field
  3. Add gender field
  4. Add employment type field
  5. Add employee ID field
  6. Add emergency contact fields (name, relation, phone)

  ## Important Notes
  - All new fields are nullable for existing records
  - Fields can be updated through profile management interface
*/

-- Add personal information fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE employees ADD COLUMN phone_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'address'
  ) THEN
    ALTER TABLE employees ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'gender'
  ) THEN
    ALTER TABLE employees ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN employee_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'employment_type'
  ) THEN
    ALTER TABLE employees ADD COLUMN employment_type text DEFAULT 'full-time';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_contact_name'
  ) THEN
    ALTER TABLE employees ADD COLUMN emergency_contact_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_contact_relation'
  ) THEN
    ALTER TABLE employees ADD COLUMN emergency_contact_relation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_contact_phone'
  ) THEN
    ALTER TABLE employees ADD COLUMN emergency_contact_phone text;
  END IF;
END $$;

-- Create index for employee_id lookups
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
