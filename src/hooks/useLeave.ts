import { LeaveBalance, Holiday, LeaveRequest, CreateLeaveRequest } from '@/types';
import { differenceInCalendarDays, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { useLocalData } from '@/lib/local-data';
import { useMemo, useState } from 'react';

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useGetLeaveBalances(employeeId: string) {
  const { leaveBalances } = useLocalData();
  const currentYear = new Date().getFullYear();

  const balances = useMemo(
    () =>
      leaveBalances
        .filter((balance) => balance.employee_id === employeeId && balance.year === currentYear)
        .sort((a, b) => a.leave_type.localeCompare(b.leave_type)),
    [employeeId, leaveBalances, currentYear]
  );

  return { data: balances, isLoading: false, error: null as unknown };
}

export function useGetUpcomingHolidays(daysAhead: number = 90) {
  const { holidays } = useLocalData();

  const data = useMemo(() => {
    const today = new Date();
    const startStr = today.toISOString().split('T')[0];
    const future = new Date(today);
    future.setDate(future.getDate() + daysAhead);
    const futureStr = future.toISOString().split('T')[0];

    return holidays
      .filter((holiday) => holiday.date >= startStr && holiday.date <= futureStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, daysAhead]);

  return { data, isLoading: false, error: null as unknown };
}

export function useGetLeaveRequests(employeeId: string) {
  const { leaveRequests } = useLocalData();

  const data = useMemo(
    () =>
      leaveRequests
        .filter((req) => req.employee_id === employeeId)
        .sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [employeeId, leaveRequests]
  );

  return { data, isLoading: false, error: null as unknown };
}

export function useCreateLeaveRequest() {
  const { createLeaveRequest } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (request: CreateLeaveRequest) => {
    setIsPending(true);
    try {
      const now = new Date().toISOString();
      const newRequest: LeaveRequest = {
        id: generateId('lr'),
        employee_id: request.employee_id,
        leave_type: request.leave_type,
        start_date: request.start_date,
        end_date: request.end_date,
        is_half_day: request.is_half_day,
        total_days: request.total_days,
        reason: request.reason,
        status: 'pending',
        approver_id: undefined,
        approver_comment: undefined,
        approved_at: undefined,
        created_at: now,
        updated_at: now,
      };
      return createLeaveRequest(newRequest);
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useCancelLeaveRequest() {
  const { cancelLeaveRequest } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({ requestId }: { requestId: string; employeeId: string }) => {
    setIsPending(true);
    try {
      const updated = cancelLeaveRequest(requestId);
      if (!updated) throw new Error('Leave request not found');
      return updated;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function calculateLeaveDays(startDate: string, endDate: string, isHalfDay: boolean): number {
  if (isHalfDay) {
    return 0.5;
  }

  const start = startOfDay(parseISO(startDate));
  const end = startOfDay(parseISO(endDate));
  const days = differenceInCalendarDays(end, start) + 1;

  return days;
}

export function hasOverlappingLeave(
  requests: LeaveRequest[],
  startDate: string,
  endDate: string
): boolean {
  const newStart = parseISO(startDate);
  const newEnd = parseISO(endDate);

  return requests.some((req) => {
    if (req.status === 'rejected') return false;

    const reqStart = parseISO(req.start_date);
    const reqEnd = parseISO(req.end_date);

    return (
      (isAfter(newStart, reqStart) || newStart.getTime() === reqStart.getTime()) &&
      (isBefore(newStart, reqEnd) || newStart.getTime() === reqEnd.getTime())
    ) ||
    (
      (isAfter(newEnd, reqStart) || newEnd.getTime() === reqStart.getTime()) &&
      (isBefore(newEnd, reqEnd) || newEnd.getTime() === reqEnd.getTime())
    ) ||
    (
      (isBefore(newStart, reqStart) || newStart.getTime() === reqStart.getTime()) &&
      (isAfter(newEnd, reqEnd) || newEnd.getTime() === reqEnd.getTime())
    );
  });
}
