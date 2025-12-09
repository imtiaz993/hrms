import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { LeaveBalance, Holiday, LeaveRequest, CreateLeaveRequest } from '@/types';
import { differenceInCalendarDays, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';

export function useGetLeaveBalances(employeeId: string) {
  return useQuery({
    queryKey: ['leaveBalances', employeeId],
    queryFn: async (): Promise<LeaveBalance[]> => {
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('year', currentYear)
        .order('leave_type');

      if (error) throw error;
      return data || [];
    },
    staleTime: 300000,
  });
}

export function useGetUpcomingHolidays(daysAhead: number = 90) {
  return useQuery({
    queryKey: ['holidays', 'upcoming', daysAhead],
    queryFn: async (): Promise<Holiday[]> => {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .gte('date', today)
        .lte('date', futureDateStr)
        .order('date');

      if (error) throw error;
      return data || [];
    },
    staleTime: 3600000,
  });
}

export function useGetLeaveRequests(employeeId: string) {
  return useQuery({
    queryKey: ['leaveRequests', employeeId],
    queryFn: async (): Promise<LeaveRequest[]> => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateLeaveRequest) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', variables.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances', variables.employee_id] });
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, employeeId }: { requestId: string; employeeId: string }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('employee_id', employeeId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', variables.employeeId] });
    },
  });
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
