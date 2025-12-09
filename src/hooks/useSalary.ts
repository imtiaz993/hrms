import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SalaryConfig, SalaryRecord, SalaryPeriod } from '@/types';
import { format } from 'date-fns';

export function useGetSalaryConfig(employeeId: string) {
  return useQuery({
    queryKey: ['salaryConfig', employeeId],
    queryFn: async (): Promise<SalaryConfig | null> => {
      const { data, error } = await supabase
        .from('salary_config')
        .select('*')
        .eq('employee_id', employeeId)
        .is('effective_to', null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 600000,
  });
}

export function useGetAvailablePeriods(employeeId: string) {
  return useQuery({
    queryKey: ['salaryPeriods', employeeId],
    queryFn: async (): Promise<SalaryPeriod[]> => {
      const { data, error } = await supabase
        .from('salary_records')
        .select('period_month, period_year')
        .eq('employee_id', employeeId)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      return data.map((record) => ({
        month: record.period_month,
        year: record.period_year,
        label: format(new Date(record.period_year, record.period_month - 1), 'MMMM yyyy'),
      }));
    },
    staleTime: 300000,
  });
}

export function useGetSalaryRecord(employeeId: string, month: number, year: number) {
  return useQuery({
    queryKey: ['salaryRecord', employeeId, month, year],
    queryFn: async (): Promise<SalaryRecord | null> => {
      const { data, error } = await supabase
        .from('salary_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('period_month', month)
        .eq('period_year', year)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: month > 0 && year > 0,
    staleTime: 60000,
  });
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function calculateHourlyRate(baseSalary: number, standardHoursPerDay: number): number {
  const workingDaysPerMonth = 22;
  const monthlyHours = workingDaysPerMonth * standardHoursPerDay;
  return baseSalary / monthlyHours;
}
