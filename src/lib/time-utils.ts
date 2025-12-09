import { format, parseISO, differenceInMinutes, differenceInHours } from 'date-fns';
import { TimeEntry, TodayStatus, AttendanceRow } from '@/types';

export function calculateTotalHours(timeIn: string, timeOut: string): number {
  const start = parseISO(timeIn);
  const end = parseISO(timeOut);
  const minutes = differenceInMinutes(end, start);
  return Math.round((minutes / 60) * 100) / 100;
}

export function calculateOvertimeHours(totalHours: number, standardHours: number): number {
  return Math.max(0, totalHours - standardHours);
}

export function isEmployeeLate(timeIn: string, standardShiftStart: string): boolean {
  const actualTime = parseISO(timeIn);
  const actualMinutes = actualTime.getHours() * 60 + actualTime.getMinutes();

  const [hours, minutes] = standardShiftStart.split(':').map(Number);
  const standardMinutes = hours * 60 + minutes;

  return actualMinutes > standardMinutes;
}

export function calculateLateMinutes(timeIn: string, standardShiftStart: string): number {
  if (!isEmployeeLate(timeIn, standardShiftStart)) return 0;

  const actualTime = parseISO(timeIn);
  const actualMinutes = actualTime.getHours() * 60 + actualTime.getMinutes();

  const [hours, minutes] = standardShiftStart.split(':').map(Number);
  const standardMinutes = hours * 60 + minutes;

  return actualMinutes - standardMinutes;
}

export function isEarlyLeave(timeOut: string, standardShiftEnd: string): boolean {
  const actualTime = parseISO(timeOut);
  const actualMinutes = actualTime.getHours() * 60 + actualTime.getMinutes();

  const [hours, minutes] = standardShiftEnd.split(':').map(Number);
  const standardMinutes = hours * 60 + minutes;

  return actualMinutes < standardMinutes;
}

export function formatTime(timestamp: string): string {
  return format(parseISO(timestamp), 'h:mm a');
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'EEE, MMM d');
}

export function formatDateFull(date: string): string {
  return format(parseISO(date), 'EEEE, MMMM d, yyyy');
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function calculateElapsedHours(timeIn: string): number {
  const start = parseISO(timeIn);
  const now = new Date();
  const minutes = differenceInMinutes(now, start);
  return Math.round((minutes / 60) * 100) / 100;
}

export function mapTimeEntryToTodayStatus(
  entry: TimeEntry | null,
  standardHours: number,
  standardShiftStart: string
): TodayStatus {
  if (!entry) {
    return {
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'not_clocked_in',
      timeIn: null,
      timeOut: null,
      elapsedHours: null,
      totalHours: null,
      overtimeHours: 0,
      isLate: false,
      lateByMinutes: null,
    };
  }

  const isLate = isEmployeeLate(entry.time_in, standardShiftStart);
  const lateByMinutes = isLate ? calculateLateMinutes(entry.time_in, standardShiftStart) : null;

  if (!entry.time_out) {
    return {
      date: entry.date,
      status: 'clocked_in',
      timeIn: entry.time_in,
      timeOut: null,
      elapsedHours: calculateElapsedHours(entry.time_in),
      totalHours: null,
      overtimeHours: 0,
      isLate,
      lateByMinutes,
    };
  }

  const totalHours = entry.total_hours || 0;
  const overtimeHours = calculateOvertimeHours(totalHours, standardHours);

  return {
    date: entry.date,
    status: 'completed',
    timeIn: entry.time_in,
    timeOut: entry.time_out,
    elapsedHours: null,
    totalHours,
    overtimeHours,
    isLate,
    lateByMinutes,
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
