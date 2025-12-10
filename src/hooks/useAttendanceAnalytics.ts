import { TimeEntry } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { useLocalData } from '@/lib/local-data';
import { useMemo } from 'react';

export interface DailyAttendance {
  date: string;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'future';
  timeIn?: string;
  timeOut?: string;
  totalHours?: number;
  isLate: boolean;
  isEarlyLeave: boolean;
  lateByMinutes?: number;
}

export interface AttendanceAnalytics {
  presentDays: number;
  absentDays: number;
  lateArrivals: number;
  earlyLeaves: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
  dailyAttendance: DailyAttendance[];
}

export function useGetAttendanceAnalytics(employeeId: string, month: number, year: number) {
  const { timeEntries } = useLocalData();

  const data = useMemo(() => {
    if (!employeeId || month <= 0 || year <= 0) {
      return {
        presentDays: 0,
        absentDays: 0,
        lateArrivals: 0,
        earlyLeaves: 0,
        totalHoursWorked: 0,
        averageHoursPerDay: 0,
        dailyAttendance: [],
      };
    }

      const monthDate = new Date(year, month - 1, 1);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      // Use December 10, 2025 as reference date for mock data
      const today = new Date(2025, 11, 10);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const entriesMap = new Map<string, TimeEntry>();
    timeEntries
      .filter((entry) => entry.employee_id === employeeId && entry.date >= startStr && entry.date <= endStr)
      .forEach((entry) => entriesMap.set(entry.date, entry));

      let presentDays = 0;
      let absentDays = 0;
      let lateArrivals = 0;
      let earlyLeaves = 0;
      let totalHoursWorked = 0;

    const allDaysInMonth = eachDayOfInterval({ start, end });

      const dailyAttendance: DailyAttendance[] = allDaysInMonth.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const entry = entriesMap.get(dateStr);
        const isFuture = day > today;

        if (isFuture) {
          return {
            date: dateStr,
            status: 'future' as const,
            isLate: false,
            isEarlyLeave: false,
          };
        }

        if (!entry) {
          absentDays++;
          return {
            date: dateStr,
            status: 'absent' as const,
            isLate: false,
            isEarlyLeave: false,
          };
        }

        presentDays++;
        if (entry.is_late) lateArrivals++;
        if (entry.is_early_leave) earlyLeaves++;
        if (entry.total_hours) totalHoursWorked += entry.total_hours;

        let status: DailyAttendance['status'] = 'present';
        if (entry.is_late && entry.is_early_leave) {
          status = 'late';
        } else if (entry.is_late) {
          status = 'late';
        } else if (entry.is_early_leave) {
          status = 'early_leave';
        }

        return {
          date: dateStr,
          status,
          timeIn: entry.time_in,
          timeOut: entry.time_out || undefined,
          totalHours: entry.total_hours || undefined,
          isLate: entry.is_late,
          isEarlyLeave: entry.is_early_leave,
        };
      });

      const averageHoursPerDay = presentDays > 0 ? totalHoursWorked / presentDays : 0;

      return {
        presentDays,
        absentDays,
        lateArrivals,
        earlyLeaves,
        totalHoursWorked,
        averageHoursPerDay,
        dailyAttendance,
      };
  }, [employeeId, month, timeEntries, year]);

  return { data, isLoading: false, error: null as unknown };
}

export function useGetAvailableMonths(employeeId: string) {
  const { timeEntries } = useLocalData();

  const data = useMemo(() => {
    const entries = timeEntries.filter((entry) => entry.employee_id === employeeId);
    if (!entries.length) {
        // Use December 10, 2025 as reference date for mock data
        const now = new Date(2025, 11, 10);
        return [
        { month: now.getMonth() + 1, year: now.getFullYear(), label: format(now, 'MMMM yyyy') },
        ];
      }

      const monthsSet = new Set<string>();
    entries.forEach((entry) => {
        const date = parseISO(entry.date);
      monthsSet.add(format(date, 'yyyy-MM'));
      });

    return Array.from(monthsSet)
        .sort()
        .reverse()
        .slice(0, 12)
        .map((key) => {
          const [yearStr, monthStr] = key.split('-');
          const year = parseInt(yearStr);
          const month = parseInt(monthStr);
        return { month, year, label: format(new Date(year, month - 1), 'MMMM yyyy') };
        });
  }, [employeeId, timeEntries]);

  return { data, isLoading: false, error: null as unknown };
}
