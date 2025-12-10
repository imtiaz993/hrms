import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useLocalData } from '@/lib/local-data';
import { useMemo, useState } from 'react';
import { EmployeeSalaryCalculation, PayrollSettings } from '@/types';

export function useGetPayrollSettings() {
  const { payrollSettings } = useLocalData();
  return { data: payrollSettings, isLoading: false, error: null as unknown };
}

export function useUpdatePayrollSettings() {
  const { updatePayrollSettings } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (settings: Partial<PayrollSettings>) => {
    setIsPending(true);
    try {
      return updatePayrollSettings(settings);
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useCalculateSalary(employeeId: string, month: number, year: number) {
  const { employees, timeEntries, leaveRequests, payrollSettings } = useLocalData();

  const data = useMemo(() => {
    if (!employeeId || month < 1 || month > 12 || year < 2000) {
      return null;
    }

    const monthDate = new Date(year, month - 1, 1);
    const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) return null;

    const empTimeEntries = timeEntries.filter(
      (entry) => entry.employee_id === employeeId && entry.date >= startDate && entry.date <= endDate
    );
    const unpaidLeaves = leaveRequests.filter(
      (leave) =>
        leave.employee_id === employeeId &&
        leave.status === 'approved' &&
        leave.leave_type === 'unpaid' &&
        leave.start_date >= startDate &&
        leave.end_date <= endDate
    );

    let totalHoursWorked = 0;
    let overtimeHours = 0;

    empTimeEntries.forEach((entry) => {
      if (entry.total_hours) {
        totalHoursWorked += Number(entry.total_hours);
      }
      if (entry.overtime_hours) {
        overtimeHours += Number(entry.overtime_hours);
      }
    });

    let unpaidLeaveDays = 0;
    unpaidLeaves.forEach((leave) => {
      unpaidLeaveDays += Number(leave.total_days);
    });

    const unpaidLeaveHours = unpaidLeaveDays * employee.standard_hours_per_day;
    const basePay = totalHoursWorked * payrollSettings.hourly_rate;
    const overtimePay = overtimeHours * payrollSettings.hourly_rate * payrollSettings.overtime_multiplier;
    const grossSalary = basePay + overtimePay;

    let unpaidLeaveDeduction = 0;
    if (payrollSettings.deduction_type === 'hourly') {
      unpaidLeaveDeduction = unpaidLeaveHours * payrollSettings.hourly_rate;
    } else if (payrollSettings.deduction_type === 'daily') {
      unpaidLeaveDeduction = unpaidLeaveDays * payrollSettings.daily_deduction_rate;
    }

    const netSalary = grossSalary - unpaidLeaveDeduction;

    return {
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      department: employee.department,
      employee_id_number: employee.employee_id,
      month,
      year,
      total_hours_worked: totalHoursWorked,
      overtime_hours: overtimeHours,
      unpaid_leave_days: unpaidLeaveDays,
      unpaid_leave_hours: unpaidLeaveHours,
      base_pay: basePay,
      overtime_pay: overtimePay,
      gross_salary: grossSalary,
      unpaid_leave_deduction: unpaidLeaveDeduction,
      net_salary: netSalary,
    };
  }, [employeeId, employees, leaveRequests, month, payrollSettings, timeEntries, year]);

  return { data, isLoading: false, error: null as unknown };
}

export function useCalculateAllEmployeesSalary(month: number, year: number) {
  const { employees, timeEntries, leaveRequests, payrollSettings } = useLocalData();

  const data = useMemo(() => {
    if (month < 1 || month > 12 || year < 2000) {
      return [];
    }

    const monthDate = new Date(year, month - 1, 1);
    const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

    const activeEmployees = employees.filter((emp) => emp.is_active);

    return activeEmployees.map((employee) => {
      const empTimeEntries = timeEntries.filter(
        (entry) => entry.employee_id === employee.id && entry.date >= startDate && entry.date <= endDate
      );
      const empUnpaidLeaves = leaveRequests.filter(
        (leave) =>
          leave.employee_id === employee.id &&
          leave.status === 'approved' &&
          leave.leave_type === 'unpaid' &&
          leave.start_date >= startDate &&
          leave.end_date <= endDate
      );

      let totalHoursWorked = 0;
      let overtimeHours = 0;

      empTimeEntries.forEach((entry) => {
        if (entry.total_hours) {
          totalHoursWorked += Number(entry.total_hours);
        }
        if (entry.overtime_hours) {
          overtimeHours += Number(entry.overtime_hours);
        }
      });

      let unpaidLeaveDays = 0;
      empUnpaidLeaves.forEach((leave) => {
        unpaidLeaveDays += Number(leave.total_days);
      });

      const unpaidLeaveHours = unpaidLeaveDays * employee.standard_hours_per_day;
      const basePay = totalHoursWorked * payrollSettings.hourly_rate;
      const overtimePay = overtimeHours * payrollSettings.hourly_rate * payrollSettings.overtime_multiplier;
      const grossSalary = basePay + overtimePay;

      let unpaidLeaveDeduction = 0;
      if (payrollSettings.deduction_type === 'hourly') {
        unpaidLeaveDeduction = unpaidLeaveHours * payrollSettings.hourly_rate;
      } else if (payrollSettings.deduction_type === 'daily') {
        unpaidLeaveDeduction = unpaidLeaveDays * payrollSettings.daily_deduction_rate;
      }

      const netSalary = grossSalary - unpaidLeaveDeduction;

      return {
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        department: employee.department,
        employee_id_number: employee.employee_id,
        month,
        year,
        total_hours_worked: totalHoursWorked,
        overtime_hours: overtimeHours,
        unpaid_leave_days: unpaidLeaveDays,
        unpaid_leave_hours: unpaidLeaveHours,
        base_pay: basePay,
        overtime_pay: overtimePay,
        gross_salary: grossSalary,
        unpaid_leave_deduction: unpaidLeaveDeduction,
        net_salary: netSalary,
      };
    });
  }, [employees, leaveRequests, month, payrollSettings, timeEntries, year]);

  return { data, isLoading: false, error: null as unknown };
}
