import {
  Employee,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  SalaryConfig,
  SalaryRecord,
  TimeEntry,
  PayrollSettings,
  ExtraWork,
} from "@/types";
import { format } from "date-fns";

// Set reference date to December 10, 2025 so all data is visible
const now = new Date(2025, 11, 10); // December 10, 2025 (month is 0-indexed, so 11 = December)
const iso = (date: Date) => date.toISOString();

export const initialEmployees: Employee[] = [
  {
    id: "emp-1",
    email: "admin@hrms.dev",
    first_name: "Alex",
    last_name: "Admin",
    designation: "HR Manager",
    department: "HR",
    join_date: "2024-01-05",
    date_of_birth: "1990-12-10", // Birthday on December 10
    phone_number: "555-111-2222",
    address: "123 Main St",
    gender: "male",
    employee_id: "HR-001",
    employment_type: "full_time",
    emergency_contact_name: "Jamie Admin",
    emergency_contact_relation: "Partner",
    emergency_contact_phone: "555-333-4444",
    standard_shift_start: "09:00",
    standard_shift_end: "17:00",
    standard_hours_per_day: 8,
    is_admin: true,
    is_deleted: false,
    is_active: true,
    created_at: iso(new Date(now.getFullYear(), 0, 5)),
    updated_at: iso(new Date(now.getFullYear(), 10, 1)),
  },
  {
    id: "emp-2",
    email: "jordan@hrms.dev",
    first_name: "Jordan",
    last_name: "Employee",
    designation: "Product Designer",
    department: "Design",
    join_date: "2024-12-10", // Work anniversary on December 10, 2025 (1 year)
    date_of_birth: "1994-08-22",
    phone_number: "555-222-3333",
    address: "456 Market St",
    gender: "female",
    employee_id: "DS-010",
    employment_type: "full_time",
    emergency_contact_name: "Taylor Employee",
    emergency_contact_relation: "Sibling",
    emergency_contact_phone: "555-444-5555",
    standard_shift_start: "09:30",
    standard_shift_end: "17:30",
    standard_hours_per_day: 8,
    is_admin: false,
    is_deleted: false,
    is_active: true,
    created_at: iso(new Date(now.getFullYear(), 1, 10)),
    updated_at: iso(new Date(now.getFullYear(), 9, 15)),
  },
  {
    id: "emp-3",
    email: "sam@hrms.dev",
    first_name: "Sam",
    last_name: "Developer",
    designation: "Software Engineer",
    department: "Engineering",
    join_date: "2023-12-08", // Work anniversary on December 8, 2025 (2 years)
    date_of_birth: "1992-12-12", // Birthday on December 12
    phone_number: "555-333-4444",
    address: "789 Tech Ave",
    gender: "male",
    employee_id: "ENG-020",
    employment_type: "full_time",
    emergency_contact_name: "Pat Developer",
    emergency_contact_relation: "Spouse",
    emergency_contact_phone: "555-555-6666",
    standard_shift_start: "09:00",
    standard_shift_end: "18:00",
    standard_hours_per_day: 8,
    is_admin: false,
    is_active: true,
    created_at: iso(new Date(2023, 5, 15)),
    is_deleted: false,
    updated_at: iso(new Date(now.getFullYear(), 8, 20)),
  },
  {
    id: "emp-4",
    email: "taylor@hrms.dev",
    first_name: "Taylor",
    last_name: "Manager",
    designation: "Project Manager",
    department: "Operations",
    join_date: "2022-12-15", // Work anniversary on December 15, 2025 (3 years)
    date_of_birth: "1988-12-09", // Birthday on December 9
    phone_number: "555-444-5555",
    address: "321 Business Blvd",
    gender: "non-binary",
    employee_id: "OPS-030",
    employment_type: "full_time",
    emergency_contact_name: "Casey Manager",
    emergency_contact_relation: "Friend",
    emergency_contact_phone: "555-666-7777",
    standard_shift_start: "08:30",
    standard_shift_end: "17:30",
    standard_hours_per_day: 8,
    is_admin: false,
    is_active: true,
    created_at: iso(new Date(2022, 2, 20)),
    updated_at: iso(new Date(now.getFullYear(), 7, 10)),
    is_deleted: false,
  },
];

export const initialPasswords: Record<string, string> = {
  "admin@hrms.dev": "password",
  "jordan@hrms.dev": "password",
  "sam@hrms.dev": "password",
  "taylor@hrms.dev": "password",
};

function generateTimeEntriesForCurrentMonth(): TimeEntry[] {
  const entries: TimeEntry[] = [];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const today = now.getDate();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  for (let day = 1; day <= Math.min(today, lastDay.getDate()); day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Skip if it's in the future
    if (day > today) continue;

    const dateStr = format(date, "yyyy-MM-dd");
    const isLate = day % 7 === 0;
    const isEarlyLeave = day % 11 === 0;
    const hasOvertime = day % 5 === 0;

    const timeIn = new Date(
      currentYear,
      currentMonth,
      day,
      isLate ? 9 : 9,
      isLate ? 35 : 20
    );
    const timeOut = new Date(
      currentYear,
      currentMonth,
      day,
      isEarlyLeave ? 16 : 17,
      isEarlyLeave ? 30 : hasOvertime ? 30 : 20
    );

    const totalHours =
      (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
    const overtimeHours = hasOvertime ? Math.max(0, totalHours - 8) : 0;

    entries.push({
      id: `time-${currentYear}-${currentMonth}-${day}`,
      employee_id: "emp-2",
      date: dateStr,
      clock_in: iso(timeIn),
      clock_out: iso(timeOut),
      total_hours: Math.round(totalHours * 100) / 100,
      overtime_hours: Math.round(overtimeHours * 100) / 100,
      is_late: isLate,
      is_early_leave: isEarlyLeave,
      notes: "",
      created_at: iso(timeIn),
      updated_at: iso(timeOut),
    });
  }

  return entries;
}

export const initialTimeEntries: TimeEntry[] =
  generateTimeEntriesForCurrentMonth();

export const initialLeaveBalances: LeaveBalance[] = [
  {
    id: "lb-1",
    employee_id: "emp-2",
    leave_type: "paid",
    total_days: 18,
    used_days: 6,
    remaining_days: 12,
    year: now.getFullYear(),
    created_at: iso(new Date(now.getFullYear(), 0, 1)),
    updated_at: iso(new Date(now.getFullYear(), 9, 15)),
  },
  {
    id: "lb-2",
    employee_id: "emp-2",
    leave_type: "sick",
    total_days: 8,
    used_days: 2,
    remaining_days: 6,
    year: now.getFullYear(),
    created_at: iso(new Date(now.getFullYear(), 0, 1)),
    updated_at: iso(new Date(now.getFullYear(), 8, 1)),
  },
  {
    id: "lb-3",
    employee_id: "emp-2",
    leave_type: "unpaid",
    total_days: 0,
    used_days: 1,
    remaining_days: 0,
    year: now.getFullYear(),
    created_at: iso(new Date(now.getFullYear(), 0, 1)),
    updated_at: iso(new Date(now.getFullYear(), 9, 1)),
  },
];

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: "lr-1",
    employee_id: "emp-2",
    leave_type: "paid",
    start_date: format(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      "yyyy-MM-dd"
    ),
    end_date: format(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6),
      "yyyy-MM-dd"
    ),
    is_half_day: false,
    total_days: 2,
    reason: "Family event",
    status: "approved",
    approver_id: "emp-1",
    approver_comment: "Enjoy!",
    approved_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)
    ),
    created_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5)
    ),
    updated_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)
    ),
  },
  {
    id: "lr-2",
    employee_id: "emp-2",
    leave_type: "sick",
    start_date: format(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
      "yyyy-MM-dd"
    ),
    end_date: format(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
      "yyyy-MM-dd"
    ),
    is_half_day: true,
    total_days: 0.5,
    reason: "Doctor appointment",
    status: "approved",
    approver_id: "emp-1",
    approver_comment: "",
    approved_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8)
    ),
    created_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12)
    ),
    updated_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8)
    ),
  },
  {
    id: "lr-3",
    employee_id: "emp-2",
    leave_type: "paid",
    start_date: format(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
      "yyyy-MM-dd"
    ),
    end_date: format(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
      "yyyy-MM-dd"
    ),
    is_half_day: true,
    total_days: 0.5,
    reason: "Personal work",
    status: "pending",
    approver_id: undefined,
    approver_comment: undefined,
    approved_at: undefined,
    created_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)
    ),
    updated_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)
    ),
  },
];

export const initialHolidays: Holiday[] = [
  {
    id: "holiday-1",
    name: "New Year",
    date: `${now.getFullYear()}-01-01`,
    is_recurring: true,
    description: "Company holiday",
    created_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
    updated_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
  },
  {
    id: "holiday-2",
    name: "Founders Day",
    date: `${now.getFullYear()}-02-15`,
    is_recurring: false,
    description: "Celebration of company founding",
    created_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
    updated_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
  },
  {
    id: "holiday-3",
    name: "Christmas",
    date: `${now.getFullYear()}-12-25`,
    is_recurring: true,
    description: "Christmas holiday",
    created_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
    updated_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
  },
  {
    id: "holiday-4",
    name: "New Year's Eve",
    date: `${now.getFullYear()}-12-31`,
    is_recurring: true,
    description: "New Year's Eve holiday",
    created_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
    updated_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
  },
];

export const initialSalaryConfigs: SalaryConfig[] = [
  {
    id: "salcfg-1",
    employee_id: "emp-2",
    salary_type: "monthly",
    base_amount: 5000,
    overtime_multiplier: 1.5,
    currency: "USD",
    effective_from: `${now.getFullYear()}-01-01`,
    effective_to: undefined,
    created_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
    updated_at: iso(new Date(now.getFullYear(), 9, 10)),
  },
];

export const initialSalaryRecords: SalaryRecord[] = [
  {
    id: "salrec-1",
    employee_id: "emp-2",
    period_month: now.getMonth() + 1,
    period_year: now.getFullYear(),
    working_days: 22,
    days_present: 20,
    days_absent: 2,
    paid_leave_days: 1,
    unpaid_leave_days: 1,
    total_hours_worked: 160,
    overtime_hours: 6,
    late_arrivals: 2,
    early_leaves: 1,
    base_pay: 5000,
    overtime_pay: 300,
    allowances: 200,
    unpaid_leave_deduction: 150,
    other_deductions: 50,
    net_pay: 5300,
    is_provisional: false,
    notes: "Includes project bonus",
    created_at: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    updated_at: iso(new Date(now.getFullYear(), now.getMonth(), 28)),
  },
];

export const initialPayrollSettings: PayrollSettings = {
  id: "payroll-1",
  hourly_rate: 30,
  overtime_multiplier: 1.5,
  standard_working_days_per_month: 22,
  deduction_type: "daily",
  daily_deduction_rate: 120,
  currency: "USD",
  created_at: iso(new Date(now.getFullYear() - 1, 11, 1)),
  updated_at: iso(new Date(now.getFullYear(), 9, 1)),
};

export const initialExtraWork: ExtraWork[] = [
  {
    id: "ew-1",
    employee_id: "emp-2",
    date: format(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
      "yyyy-MM-dd"
    ),
    work_type: "weekend",
    hours_worked: 6,
    reason: "Project deadline",
    status: "approved",
    approver_comment: "Approved",
    created_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8)
    ),
    updated_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    ),
  },
  {
    id: "ew-2",
    employee_id: "emp-2",
    date: format(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      "yyyy-MM-dd"
    ),
    work_type: "holiday",
    hours_worked: 4,
    reason: "Emergency support",
    status: "approved",
    approver_comment: "Approved",
    created_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    ),
    updated_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5)
    ),
  },
  {
    id: "ew-3",
    employee_id: "emp-2",
    date: format(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
      "yyyy-MM-dd"
    ),
    work_type: "overtime",
    hours_worked: 3,
    reason: "Client meeting preparation",
    status: "pending",
    approver_comment: undefined,
    created_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    ),
    updated_at: iso(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    ),
  },
];
