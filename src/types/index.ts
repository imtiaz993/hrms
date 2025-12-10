export interface Employee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  designation: string;
  department: string;
  join_date: string;
  date_of_birth?: string;
  phone_number?: string;
  address?: string;
  gender?: string;
  employee_id?: string;
  employment_type?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  standard_shift_start: string;
  standard_shift_end: string;
  standard_hours_per_day: number;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  date: string;
  time_in: string;
  time_out: string | null;
  total_hours: number | null;
  overtime_hours: number;
  is_late: boolean;
  is_early_leave: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TodayStatus {
  date: string;
  status: 'not_clocked_in' | 'clocked_in' | 'completed';
  timeIn: string | null;
  timeOut: string | null;
  elapsedHours: number | null;
  totalHours: number | null;
  overtimeHours: number;
  isLate: boolean;
  lateByMinutes: number | null;
}

export interface AttendanceRow {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
  totalHours: string;
  status: 'on_time' | 'late' | 'early_leave' | 'incomplete';
  statusLabel: string;
}

export interface ClockInRequest {
  employeeId: string;
  timestamp: string;
}

export interface ClockOutRequest {
  employeeId: string;
  timeEntryId: string;
  timestamp: string;
}

export type LeaveType = 'paid' | 'sick' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  is_recurring: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  total_days: number;
  reason?: string;
  status: LeaveStatus;
  approver_id?: string;
  approver_comment?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveRequest {
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  total_days: number;
  reason?: string;
}

export type SalaryType = 'monthly' | 'hourly';

export interface SalaryConfig {
  id: string;
  employee_id: string;
  salary_type: SalaryType;
  base_amount: number;
  overtime_multiplier: number;
  currency: string;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryRecord {
  id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  working_days: number;
  days_present: number;
  days_absent: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  total_hours_worked: number;
  overtime_hours: number;
  late_arrivals: number;
  early_leaves: number;
  base_pay: number;
  overtime_pay: number;
  allowances: number;
  unpaid_leave_deduction: number;
  other_deductions: number;
  net_pay: number;
  is_provisional: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryPeriod {
  month: number;
  year: number;
  label: string;
}

export interface PayrollSettings {
  id: string;
  hourly_rate: number;
  overtime_multiplier: number;
  standard_working_days_per_month: number;
  deduction_type: 'hourly' | 'daily';
  daily_deduction_rate: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSalaryCalculation {
  employee_id: string;
  employee_name: string;
  department: string;
  employee_id_number: string | null;
  month: number;
  year: number;
  total_hours_worked: number;
  overtime_hours: number;
  unpaid_leave_days: number;
  unpaid_leave_hours: number;
  base_pay: number;
  overtime_pay: number;
  gross_salary: number;
  unpaid_leave_deduction: number;
  net_salary: number;
}
