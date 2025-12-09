import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TimeEntry } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';

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
  return useQuery({
    queryKey: ['attendanceAnalytics', employeeId, month, year],
    queryFn: async (): Promise<AttendanceAnalytics> => {
      const monthDate = new Date(year, month - 1, 1);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const today = new Date();

      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const { data: timeEntries, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date');

      if (error) throw error;

      const allDaysInMonth = eachDayOfInterval({ start, end });
      const entriesMap = new Map<string, TimeEntry>();

      (timeEntries || []).forEach((entry) => {
        entriesMap.set(entry.date, entry);
      });

      let presentDays = 0;
      let absentDays = 0;
      let lateArrivals = 0;
      let earlyLeaves = 0;
      let totalHoursWorked = 0;

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
    },
    enabled: month > 0 && year > 0,
    staleTime: 60000,
  });
}

export function useGetAvailableMonths(employeeId: string) {
  return useQuery({
    queryKey: ['attendanceMonths', employeeId],
    queryFn: async (): Promise<Array<{ month: number; year: number; label: string }>> => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('date')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        const now = new Date();
        return [
          {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            label: format(now, 'MMMM yyyy'),
          },
        ];
      }

      const monthsSet = new Set<string>();
      data.forEach((entry) => {
        const date = parseISO(entry.date);
        const key = format(date, 'yyyy-MM');
        monthsSet.add(key);
      });

      const months = Array.from(monthsSet)
        .sort()
        .reverse()
        .slice(0, 12)
        .map((key) => {
          const [yearStr, monthStr] = key.split('-');
          const year = parseInt(yearStr);
          const month = parseInt(monthStr);
          return {
            month,
            year,
            label: format(new Date(year, month - 1), 'MMMM yyyy'),
          };
        });

      return months;
    },
    staleTime: 300000,
  });
}
