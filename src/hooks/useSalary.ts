import { SalaryConfig, SalaryRecord, SalaryPeriod } from '@/types';
import { format } from 'date-fns';
import { useLocalData } from '@/lib/local-data';
import { useMemo } from 'react';

export function useGetSalaryConfig(employeeId: string) {
  const { salaryConfigs } = useLocalData();

  const data = useMemo(
    () => salaryConfigs.find((config) => config.employee_id === employeeId) || null,
    [employeeId, salaryConfigs]
  );

  return { data, isLoading: false, error: null as unknown };
}

export function useGetAvailablePeriods(employeeId: string) {
  const { salaryRecords } = useLocalData();

  const data = useMemo(() => {
    return salaryRecords
      .filter((record) => record.employee_id === employeeId)
      .sort((a, b) => {
        if (a.period_year === b.period_year) return b.period_month - a.period_month;
        return b.period_year - a.period_year;
      })
      .map((record) => ({
        month: record.period_month,
        year: record.period_year,
        label: format(new Date(record.period_year, record.period_month - 1), 'MMMM yyyy'),
      }));
  }, [employeeId, salaryRecords]);

  return { data, isLoading: false, error: null as unknown };
}

export function useGetSalaryRecord(employeeId: string, month: number, year: number) {
  const { salaryRecords } = useLocalData();

  const data = useMemo(() => {
    if (month <= 0 || year <= 0) return null;
    return (
      salaryRecords.find(
        (record) =>
          record.employee_id === employeeId &&
          record.period_month === month &&
          record.period_year === year
      ) || null
    );
  }, [employeeId, month, salaryRecords, year]);

  return { data, isLoading: false, error: null as unknown };
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
