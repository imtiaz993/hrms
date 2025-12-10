import { TimeEntry } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isBefore } from 'date-fns';
import { useLocalData } from '@/lib/local-data';
import { useMemo } from 'react';

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
  const { timeEntries, employees } = useLocalData();

  const result = useMemo(() => {
    if (!employeeId || month <= 0 || year <= 0) {
      return { logs: [], summary: { totalPresentDays: 0, totalHoursWorked: 0, totalOvertimeHours: 0, totalAbsentDays: 0, totalIncompletePunches: 0 } };
    }

      const monthDate = new Date(year, month - 1, 1);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      // Use December 10, 2025 as reference date for mock data
      const today = new Date(2025, 11, 10);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

    const employee = employees.find((emp) => emp.id === employeeId);
    const joinDate = employee ? parseISO(employee.join_date) : start;

      const entriesMap = new Map<string, TimeEntry>();
    timeEntries
      .filter((entry) => entry.employee_id === employeeId && entry.date >= startStr && entry.date <= endStr)
      .forEach((entry) => entriesMap.set(entry.date, entry));

      let totalPresentDays = 0;
      let totalHoursWorked = 0;
      let totalOvertimeHours = 0;
      let totalAbsentDays = 0;
      let totalIncompletePunches = 0;

    const allDaysInMonth = eachDayOfInterval({ start, end });

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
  }, [employeeId, employees, month, timeEntries, year]);

  return { data: result, isLoading: false, error: null as unknown };
}
