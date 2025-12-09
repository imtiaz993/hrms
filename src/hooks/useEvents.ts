import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/types';
import { parseISO, differenceInDays, format, addYears, isBefore, isAfter } from 'date-fns';

export interface UpcomingEvent {
  id: string;
  employeeName: string;
  department: string;
  eventDate: string;
  daysUntil: number;
  yearsCompleted?: number;
}

function getUpcomingBirthdaysFromEmployees(employees: Employee[], daysAhead: number = 30): UpcomingEvent[] {
  const today = new Date();
  const events: UpcomingEvent[] = [];

  employees.forEach((emp) => {
    if (!emp.date_of_birth || !emp.is_active) return;

    const birthDate = parseISO(emp.date_of_birth);
    const currentYear = today.getFullYear();

    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());

    if (isBefore(nextBirthday, today)) {
      nextBirthday = addYears(nextBirthday, 1);
    }

    const daysUntil = differenceInDays(nextBirthday, today);

    if (daysUntil >= 0 && daysUntil <= daysAhead) {
      events.push({
        id: emp.id,
        employeeName: `${emp.first_name} ${emp.last_name}`,
        department: emp.department,
        eventDate: format(nextBirthday, 'yyyy-MM-dd'),
        daysUntil,
      });
    }
  });

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}

function getUpcomingAnniversariesFromEmployees(employees: Employee[], daysAhead: number = 30): UpcomingEvent[] {
  const today = new Date();
  const events: UpcomingEvent[] = [];

  employees.forEach((emp) => {
    if (!emp.join_date || !emp.is_active) return;

    const joinDate = parseISO(emp.join_date);
    const currentYear = today.getFullYear();

    let nextAnniversary = new Date(currentYear, joinDate.getMonth(), joinDate.getDate());

    if (isBefore(nextAnniversary, today)) {
      nextAnniversary = addYears(nextAnniversary, 1);
    }

    const daysUntil = differenceInDays(nextAnniversary, today);
    const yearsCompleted = differenceInYears(nextAnniversary, joinDate);

    if (daysUntil >= 0 && daysUntil <= daysAhead && yearsCompleted > 0) {
      events.push({
        id: emp.id,
        employeeName: `${emp.first_name} ${emp.last_name}`,
        department: emp.department,
        eventDate: format(nextAnniversary, 'yyyy-MM-dd'),
        daysUntil,
        yearsCompleted,
      });
    }
  });

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}

function differenceInYears(date1: Date, date2: Date): number {
  let years = date1.getFullYear() - date2.getFullYear();
  const monthDiff = date1.getMonth() - date2.getMonth();
  const dayDiff = date1.getDate() - date2.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years--;
  }

  return years;
}

export function useGetUpcomingBirthdays(daysAhead: number = 30) {
  return useQuery({
    queryKey: ['upcomingBirthdays', daysAhead],
    queryFn: async (): Promise<UpcomingEvent[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .not('date_of_birth', 'is', null);

      if (error) throw error;

      return getUpcomingBirthdaysFromEmployees(data || [], daysAhead);
    },
    staleTime: 3600000,
  });
}

export function useGetUpcomingAnniversaries(daysAhead: number = 30) {
  return useQuery({
    queryKey: ['upcomingAnniversaries', daysAhead],
    queryFn: async (): Promise<UpcomingEvent[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .not('join_date', 'is', null);

      if (error) throw error;

      return getUpcomingAnniversariesFromEmployees(data || [], daysAhead);
    },
    staleTime: 3600000,
  });
}
