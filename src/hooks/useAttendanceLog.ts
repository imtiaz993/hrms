import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TimeEntry } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isBefore } from 'date-fns';

export interface DailyLogEntry {
  date: string;
  dayName: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHours: number | null;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'incomplete' | 'not_applicable';
  isLate: boolean;
  isEarlyLeave: boolean;
  overtimeHours: number;
}

export interface AttendanceLogSummary {
  totalPresentDays: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  totalAbsentDays: number;
  totalIncompletePunches: number;
}

function getDailyStatus(
  entry: TimeEntry | null,
  isFuture: boolean,
  isBeforeJoinDate: boolean
): DailyLogEntry['status'] {
  if (isBeforeJoinDate) return 'not_applicable';
  if (isFuture) return 'not_applicable';
  if (!entry) return 'absent';
  if (!entry.time_out) return 'incomplete';
  if (entry.is_late && entry.is_early_leave) return 'late';
  if (entry.is_late) return 'late';
  if (entry.is_early_leave) return 'early_leave';
  return 'present';
}

export function useGetAttendanceLog(employeeId: string, month: number, year: number) {
  return useQuery({
    queryKey: ['attendanceLog', employeeId, month, year],
    queryFn: async (): Promise<{ logs: DailyLogEntry[]; summary: AttendanceLogSummary }> => {
      const monthDate = new Date(year, month - 1, 1);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const today = new Date();

      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const [timeEntriesResult, employeeResult] = await Promise.all([
        supabase
          .from('time_entries')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('date', startStr)
          .lte('date', endStr)
          .order('date'),
        supabase
          .from('employees')
          .select('join_date')
          .eq('id', employeeId)
          .single(),
      ]);

      if (timeEntriesResult.error) throw timeEntriesResult.error;
      if (employeeResult.error) throw employeeResult.error;

      const joinDate = parseISO(employeeResult.data.join_date);
      const allDaysInMonth = eachDayOfInterval({ start, end });
      const entriesMap = new Map<string, TimeEntry>();

      (timeEntriesResult.data || []).forEach((entry) => {
        entriesMap.set(entry.date, entry);
      });

      let totalPresentDays = 0;
      let totalHoursWorked = 0;
      let totalOvertimeHours = 0;
      let totalAbsentDays = 0;
      let totalIncompletePunches = 0;

      const logs: DailyLogEntry[] = allDaysInMonth.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayName = format(day, 'EEE, dd MMM yyyy');
        const entry = entriesMap.get(dateStr) || null;
        const isFuture = day > today;
        const isBeforeJoinDate = isBefore(day, joinDate);

        const status = getDailyStatus(entry, isFuture, isBeforeJoinDate);

        if (status === 'present' || status === 'late' || status === 'early_leave') {
          totalPresentDays++;
          if (entry?.total_hours) totalHoursWorked += entry.total_hours;
          if (entry?.overtime_hours) totalOvertimeHours += entry.overtime_hours;
        } else if (status === 'absent') {
          totalAbsentDays++;
        } else if (status === 'incomplete') {
          totalIncompletePunches++;
        }

        return {
          date: dateStr,
          dayName,
          timeIn: entry?.time_in || null,
          timeOut: entry?.time_out || null,
          totalHours: entry?.total_hours || null,
          status,
          isLate: entry?.is_late || false,
          isEarlyLeave: entry?.is_early_leave || false,
          overtimeHours: entry?.overtime_hours || 0,
        };
      });

      const summary: AttendanceLogSummary = {
        totalPresentDays,
        totalHoursWorked,
        totalOvertimeHours,
        totalAbsentDays,
        totalIncompletePunches,
      };

      return { logs, summary };
    },
    enabled: month > 0 && year > 0,
    staleTime: 60000,
  });
}
