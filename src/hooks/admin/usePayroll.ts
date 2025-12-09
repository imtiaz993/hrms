import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, differenceInCalendarDays } from 'date-fns';

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

export function useGetPayrollSettings() {
  return useQuery({
    queryKey: ['payroll-settings'],
    queryFn: async (): Promise<PayrollSettings> => {
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 300000,
  });
}

export function useUpdatePayrollSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<PayrollSettings>) => {
      const { data: current } = await supabase
        .from('payroll_settings')
        .select('id')
        .limit(1)
        .single();

      if (!current) throw new Error('No payroll settings found');

      const { data, error } = await supabase
        .from('payroll_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-settings'] });
      queryClient.invalidateQueries({ queryKey: ['salary-calculation'] });
    },
  });
}

export function useCalculateSalary(employeeId: string, month: number, year: number) {
  return useQuery({
    queryKey: ['salary-calculation', employeeId, month, year],
    queryFn: async (): Promise<EmployeeSalaryCalculation | null> => {
      if (!employeeId || month < 1 || month > 12 || year < 2000) {
        return null;
      }

      const monthDate = new Date(year, month - 1, 1);
      const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

      const [employeeResult, timeEntriesResult, leaveRequestsResult, settingsResult] =
        await Promise.all([
          supabase.from('employees').select('*').eq('id', employeeId).single(),
          supabase
            .from('time_entries')
            .select('*')
            .eq('employee_id', employeeId)
            .gte('date', startDate)
            .lte('date', endDate),
          supabase
            .from('leave_requests')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('status', 'approved')
            .eq('leave_type', 'unpaid')
            .gte('start_date', startDate)
            .lte('end_date', endDate),
          supabase.from('payroll_settings').select('*').limit(1).single(),
        ]);

      if (employeeResult.error) throw employeeResult.error;
      if (settingsResult.error) throw settingsResult.error;

      const employee = employeeResult.data;
      const timeEntries = timeEntriesResult.data || [];
      const unpaidLeaves = leaveRequestsResult.data || [];
      const settings = settingsResult.data;

      let totalHoursWorked = 0;
      let overtimeHours = 0;

      timeEntries.forEach((entry) => {
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

      const basePay = totalHoursWorked * settings.hourly_rate;
      const overtimePay = overtimeHours * settings.hourly_rate * settings.overtime_multiplier;
      const grossSalary = basePay + overtimePay;

      let unpaidLeaveDeduction = 0;
      if (settings.deduction_type === 'hourly') {
        unpaidLeaveDeduction = unpaidLeaveHours * settings.hourly_rate;
      } else if (settings.deduction_type === 'daily') {
        unpaidLeaveDeduction = unpaidLeaveDays * settings.daily_deduction_rate;
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
    },
    enabled: !!employeeId && month > 0 && month <= 12 && year >= 2000,
    staleTime: 60000,
  });
}

export function useCalculateAllEmployeesSalary(month: number, year: number) {
  return useQuery({
    queryKey: ['all-employees-salary', month, year],
    queryFn: async (): Promise<EmployeeSalaryCalculation[]> => {
      if (month < 1 || month > 12 || year < 2000) {
        return [];
      }

      const monthDate = new Date(year, month - 1, 1);
      const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

      const [employeesResult, timeEntriesResult, leaveRequestsResult, settingsResult] =
        await Promise.all([
          supabase.from('employees').select('*').eq('is_active', true).order('first_name'),
          supabase
            .from('time_entries')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate),
          supabase
            .from('leave_requests')
            .select('*')
            .eq('status', 'approved')
            .eq('leave_type', 'unpaid')
            .gte('start_date', startDate)
            .lte('end_date', endDate),
          supabase.from('payroll_settings').select('*').limit(1).single(),
        ]);

      if (employeesResult.error) throw employeesResult.error;
      if (settingsResult.error) throw settingsResult.error;

      const employees = employeesResult.data;
      const timeEntries = timeEntriesResult.data || [];
      const unpaidLeaves = leaveRequestsResult.data || [];
      const settings = settingsResult.data;

      const timeEntriesMap = new Map<string, typeof timeEntries>();
      timeEntries.forEach((entry) => {
        if (!timeEntriesMap.has(entry.employee_id)) {
          timeEntriesMap.set(entry.employee_id, []);
        }
        timeEntriesMap.get(entry.employee_id)!.push(entry);
      });

      const unpaidLeavesMap = new Map<string, typeof unpaidLeaves>();
      unpaidLeaves.forEach((leave) => {
        if (!unpaidLeavesMap.has(leave.employee_id)) {
          unpaidLeavesMap.set(leave.employee_id, []);
        }
        unpaidLeavesMap.get(leave.employee_id)!.push(leave);
      });

      const calculations: EmployeeSalaryCalculation[] = employees.map((employee) => {
        const empTimeEntries = timeEntriesMap.get(employee.id) || [];
        const empUnpaidLeaves = unpaidLeavesMap.get(employee.id) || [];

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

        const basePay = totalHoursWorked * settings.hourly_rate;
        const overtimePay = overtimeHours * settings.hourly_rate * settings.overtime_multiplier;
        const grossSalary = basePay + overtimePay;

        let unpaidLeaveDeduction = 0;
        if (settings.deduction_type === 'hourly') {
          unpaidLeaveDeduction = unpaidLeaveHours * settings.hourly_rate;
        } else if (settings.deduction_type === 'daily') {
          unpaidLeaveDeduction = unpaidLeaveDays * settings.daily_deduction_rate;
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

      return calculations;
    },
    enabled: month > 0 && month <= 12 && year >= 2000,
    staleTime: 60000,
  });
}
