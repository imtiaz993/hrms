"use client";
import { TimeEntry, TodayStatus, AttendanceRow } from "@/types";
import {
  mapTimeEntryToTodayStatus,
  mapTimeEntryToAttendanceRow,
  calculateTotalHours,
  calculateOvertimeHours,
  isEmployeeLate,
  isEarlyLeave,
} from "@/lib/time-utils";
import { supabase } from "@/lib/Supabase";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useLocalData } from "@/lib/local-data";

export function useGetTodayStatus(
  employeeId: string,
  standardHours: number,
  standardShiftStart: string
) {
  const [data, setData] = useState<TodayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchToday = async () => {
    setIsLoading(true);

    if (!employeeId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const today = format(new Date(), "yyyy-MM-dd");

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("date", today + "T00:00:00")
      .lte("date", today + "T23:59:59")
      .order("clock_in", { ascending: false });

    if (error || !entries || entries.length === 0) {
      setData(null);
    } else {
      const latestEntry = entries[0];
      if (latestEntry.clock_out) {
        setData({
          status: "completed",
          timeEntryId: latestEntry.id,
          clockIn: latestEntry.clock_in,
          clockOut: latestEntry.clock_out,
          totalHours: latestEntry.total_hours,
        });
      } else {
        setData(
          mapTimeEntryToTodayStatus(
            latestEntry,
            standardHours,
            standardShiftStart
          )
        );
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchToday();
  }, [employeeId, standardHours, standardShiftStart]);

  return {
    data,
    isLoading,
    refetch: fetchToday,
    error: null,
  };
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
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({ employeeId }: { employeeId: string }) => {
    setIsPending(true);

    const today = format(new Date(), "yyyy-MM-dd");

    const { error } = await supabase.from("time_entries").insert({
      employee_id: employeeId,
      date: today,
      clock_in: new Date().toISOString(),
    });

    setIsPending(false);
    if (error) throw error;
  };

  return { mutateAsync, isPending };
}

export function useClockOut() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({ timeEntryId }: { timeEntryId: string }) => {
    setIsPending(true);

    const { error } = await supabase
      .from("time_entries")
      .update({
        clock_out: new Date().toISOString(),
      })
      .eq("id", timeEntryId);

    setIsPending(false);
    if (error) throw error;
  };

  return { mutateAsync, isPending };
}
