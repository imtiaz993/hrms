import { format, parseISO, differenceInMinutes } from 'date-fns';
import { TimeEntry, TodayStatus, AttendanceRow } from '@/types';

export function calculateTotalHours(timeIn?: string | null, timeOut?: string | null): number {
  if (!timeIn || !timeOut) return 0;

  try {
    const start = parseISO(timeIn);
    const end = parseISO(timeOut);
    const minutes = differenceInMinutes(end, start);
    return Math.round((minutes / 60) * 100) / 100;
  } catch (e) {
    console.error('Error in calculateTotalHours:', { timeIn, timeOut, e });
    return 0;
  }
}

export function calculateOvertimeHours(totalHours: number, standardHours: number): number {
  return Math.max(0, totalHours - standardHours);
}

export function isEmployeeLate(timeIn?: string | null, standardShiftStart?: string | null): boolean {
  if (!timeIn || !standardShiftStart) return false;

  try {
    const actualTime = parseISO(timeIn);
    const actualMinutes = actualTime.getHours() * 60 + actualTime.getMinutes();
    const [hours, minutes] = standardShiftStart.split(':').map(Number);
    const standardMinutes = hours * 60 + minutes;
    return actualMinutes > standardMinutes;
  } catch (e) {
    console.error('Error in isEmployeeLate:', { timeIn, standardShiftStart, e });
    return false;
  }
}

export function calculateLateMinutes(timeIn?: string | null, standardShiftStart?: string | null): number {
  if (!timeIn || !standardShiftStart) return 0;

  try {
    if (!isEmployeeLate(timeIn, standardShiftStart)) return 0;
    const actualTime = parseISO(timeIn);
    const actualMinutes = actualTime.getHours() * 60 + actualTime.getMinutes();
    const [hours, minutes] = standardShiftStart.split(':').map(Number);
    const standardMinutes = hours * 60 + minutes;
    return actualMinutes - standardMinutes;
  } catch (e) {
    console.error('Error in calculateLateMinutes:', { timeIn, standardShiftStart, e });
    return 0;
  }
}

export function isEarlyLeave(timeOut?: string | null, standardShiftEnd?: string | null): boolean {
  if (!timeOut || !standardShiftEnd) return false;

  try {
    const actualTime = parseISO(timeOut);
    const actualMinutes = actualTime.getHours() * 60 + actualTime.getMinutes();
    const [hours, minutes] = standardShiftEnd.split(':').map(Number);
    const standardMinutes = hours * 60 + minutes;
    return actualMinutes < standardMinutes;
  } catch (e) {
    console.error('Error in isEarlyLeave:', { timeOut, standardShiftEnd, e });
    return false;
  }
}

export function formatTime(timestamp?: string | null): string {
  if (!timestamp) return '—';
  try {
    return format(parseISO(timestamp), 'h:mm a');
  } catch (e) {
    console.error('Error in formatTime:', timestamp, e);
    return '—';
  }
}

export function formatDate(date?: string | null): string {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'EEE, MMM d');
  } catch (e) {
    console.error('Error in formatDate:', date, e);
    return '—';
  }
}

export function formatDateFull(date?: string | null): string {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'EEEE, MMMM d, yyyy');
  } catch (e) {
    console.error('Error in formatDateFull:', date, e);
    return '—';
  }
}

export function formatHours(hours?: number | null): string {
  if (!hours) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function calculateElapsedHours(timeIn?: string | null): number | null {
  if (!timeIn) return null;

  try {
    const start = parseISO(timeIn);
    const now = new Date();
    const minutes = differenceInMinutes(now, start);
    return Math.round((minutes / 60) * 100) / 100;
  } catch (e) {
    console.error('Error in calculateElapsedHours:', timeIn, e);
    return null;
  }
}

export function mapTimeEntryToTodayStatus(
  entry: any,
  standardHours: number,
  standardShiftStart: string
): TodayStatus {
  if (entry.clock_in && entry.clock_out) {
    return {
      status: "completed",
      timeEntryId: entry.id,
      clockIn: entry.clock_in,
      clockOut: entry.clock_out,
    };
  }

  if (entry.clock_in && !entry.clock_out) {
    return {
      status: "clocked_in",
      timeEntryId: entry.id,
      clockIn: entry.clock_in,
    };
  }


  return {
    status: "not_clocked_in",
  };
}

export function mapTimeEntryToAttendanceRow(entry: TimeEntry): AttendanceRow {
  let status: AttendanceRow['status'] = 'on_time';
  let statusLabel = 'On Time';

  if (!entry.time_out) {
    status = 'incomplete';
    statusLabel = 'Incomplete';
  } else if (entry.is_late) {
    status = 'late';
    statusLabel = 'Late';
  } else if (entry.is_early_leave) {
    status = 'early_leave';
    statusLabel = 'Early Leave';
  }

  return {
    id: entry.id,
    date: formatDate(entry.date),
    timeIn: formatTime(entry.time_in),
    timeOut: entry.time_out ? formatTime(entry.time_out) : null,
    totalHours: entry.total_hours ? formatHours(entry.total_hours) : '—',
    status,
    statusLabel,
  };
}
