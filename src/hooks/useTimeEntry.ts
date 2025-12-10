import { TimeEntry, TodayStatus, AttendanceRow } from '@/types';
import {
  mapTimeEntryToTodayStatus,
  mapTimeEntryToAttendanceRow,
  calculateTotalHours,
  calculateOvertimeHours,
  isEmployeeLate,
  isEarlyLeave,
} from '@/lib/time-utils';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useLocalData } from '@/lib/local-data';

export function useGetTodayStatus(
  employeeId: string,
  standardHours: number,
  standardShiftStart: string
) {
  const { timeEntries } = useLocalData();
  const [data, setData] = useState<TodayStatus | null>(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const entry = timeEntries.find(
      (item) => item.employee_id === employeeId && item.date === today
    );
    setData(mapTimeEntryToTodayStatus(entry || null, standardHours, standardShiftStart));
  }, [employeeId, standardHours, standardShiftStart, timeEntries]);

  return { data, isLoading: false, error: null as unknown };
}

export function useGetRecentAttendance(employeeId: string, days: number = 7) {
  const { timeEntries } = useLocalData();

  const data = useMemo(() => {
    return timeEntries
      .filter((entry) => entry.employee_id === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days)
      .map(mapTimeEntryToAttendanceRow);
  }, [days, employeeId, timeEntries]);

  return { data, isLoading: false, error: null as unknown };
}

export function useClockIn() {
  const { clockIn } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({
    employeeId,
    standardHours,
    standardShiftStart,
  }: {
    employeeId: string;
    standardHours: number;
    standardShiftStart: string;
  }) => {
    setIsPending(true);
    try {
      return clockIn({ employeeId, standardHours, standardShiftStart });
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useClockOut() {
  const { clockOut, timeEntries } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({
    timeEntryId,
    employeeId,
    standardHours,
    standardShiftEnd,
  }: {
    timeEntryId: string;
    employeeId: string;
    standardHours: number;
    standardShiftEnd: string;
  }) => {
    setIsPending(true);
    try {
      const existing = timeEntries.find((entry) => entry.id === timeEntryId);
      if (!existing) throw new Error('Time entry not found');

      return clockOut({ timeEntryId, employeeId, standardHours, standardShiftEnd });
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
