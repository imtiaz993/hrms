import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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

export function useGetTodayStatus(
  employeeId: string,
  standardHours: number,
  standardShiftStart: string
) {
  return useQuery({
    queryKey: ['timeEntry', 'today', employeeId],
    queryFn: async (): Promise<TodayStatus> => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      return mapTimeEntryToTodayStatus(data, standardHours, standardShiftStart);
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useGetRecentAttendance(employeeId: string, days: number = 7) {
  return useQuery({
    queryKey: ['timeEntry', 'recent', employeeId, days],
    queryFn: async (): Promise<AttendanceRow[]> => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false })
        .limit(days);

      if (error) throw error;

      return (data || []).map(mapTimeEntryToAttendanceRow);
    },
    staleTime: 300000,
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, standardHours, standardShiftStart }: {
      employeeId: string;
      standardHours: number;
      standardShiftStart: string;
    }) => {
      const timestamp = new Date().toISOString();
      const date = format(new Date(), 'yyyy-MM-dd');

      const isLate = isEmployeeLate(timestamp, standardShiftStart);

      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          employee_id: employeeId,
          date,
          time_in: timestamp,
          is_late: isLate,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeEntry', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['timeEntry', 'recent', variables.employeeId] });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      timeEntryId,
      employeeId,
      standardHours,
      standardShiftEnd
    }: {
      timeEntryId: string;
      employeeId: string;
      standardHours: number;
      standardShiftEnd: string;
    }) => {
      const timestamp = new Date().toISOString();

      const { data: entry } = await supabase
        .from('time_entries')
        .select('time_in')
        .eq('id', timeEntryId)
        .single();

      if (!entry) throw new Error('Time entry not found');

      const totalHours = calculateTotalHours(entry.time_in, timestamp);
      const overtimeHours = calculateOvertimeHours(totalHours, standardHours);
      const isEarlyLeaveFlag = isEarlyLeave(timestamp, standardShiftEnd);

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          time_out: timestamp,
          total_hours: totalHours,
          overtime_hours: overtimeHours,
          is_early_leave: isEarlyLeaveFlag,
        })
        .eq('id', timeEntryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeEntry', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['timeEntry', 'recent', variables.employeeId] });
    },
  });
}
