/*
  # Add unique constraint for salary_config

  ## Overview
  Adds unique constraint on employee_id for active salary configurations.

  ## Changes
  1. Add unique constraint on employee_id where effective_to is null
*/

-- Add unique partial index for active configurations
CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_config_active_employee
  ON salary_config(employee_id)
  WHERE effective_to IS NULL;
