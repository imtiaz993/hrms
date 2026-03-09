import { AttendanceAnalytics, Employee, TimeEntry } from "@/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { isWeekend } from "date-fns";
import { useMemo, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseUser";
import { getCurrentDate, parseISOPlain } from "@/lib/time-utils";
export interface TodayAttendanceRecord {
  employee: Employee;
  timeEntry: TimeEntry | null;
  status: "present" | "absent" | "late" | "early_leave";
  isLate: boolean;
  isEarlyLeave: boolean;
  total_hours: number | null;
}

export interface AttendanceOverviewStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateArrivals: number;
  earlyLeaves: number;
  incompletePunches: number;
}

export function useGetTodayAttendanceOverview(
  searchQuery?: string,
  department?: string,
  statusFilter?: string,
) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [now, setNow] = useState(getCurrentDate());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(getCurrentDate());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const refetchData = async () => {
    try {
      setIsLoading(true);
      const today = format(getCurrentDate(), "yyyy-MM-dd");

      //  Get active employees
      let employeeQuery = supabase
        .from("employees")
        .select("*")
        .eq("is_active", true)
        .not("is_admin", "eq", true);

      // if (department && department !== 'all') {
      //   employeeQuery = employeeQuery.eq('department', department);
      // }

      const { data: employeeData, error: empError } = await employeeQuery;

      if (empError) throw empError;

      //  Get today's time entries
      const { data: entryData, error: entryError } = await supabase
        .from("time_entries")
        .select("*")
        .eq("date", today);

      if (entryError) throw entryError;

      setEmployees(employeeData || []);
      setTimeEntries(entryData || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchData();
  }, []);

  const data = useMemo(() => {
    const today = format(getCurrentDate(), "yyyy-MM-dd");

    let filteredEmployees = [...employees];

    if (department && department !== "all") {
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.department === department,
      );
    }

    if (searchQuery && searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      filteredEmployees = filteredEmployees.filter((emp) => {
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        const empId = (emp.employee_id || "").toLowerCase();
        return fullName.includes(lowerQuery) || empId.includes(lowerQuery);
      });
    }

    const entriesMap = new Map<string, TimeEntry>();
    timeEntries
      .filter((entry) => entry.date === today)
      .forEach((entry) => entriesMap.set(entry.employee_id, entry));

    let totalEmployees = 0;
    let presentToday = 0;
    let absentToday = 0;
    let lateArrivals = 0;
    let earlyLeaves = 0;
    let incompletePunches = 0;

    const records = filteredEmployees.map((employee) => {
      const entry = entriesMap.get(employee.id) || null;

      let status: any = "absent";
      let isLate = false;
      let isEarlyLeave = false;

      let totalHours: number | null = null;

      if (entry) {
        if (entry.is_late && entry.is_early_leave) {
          status = "late";
          isLate = true;
          isEarlyLeave = true;
          lateArrivals++;
          earlyLeaves++;
          presentToday++;
        } else if (entry.is_late) {
          status = "late";
          isLate = true;
          lateArrivals++;
          presentToday++;
        } else if (entry.is_early_leave) {
          status = "early_leave";
          isEarlyLeave = true;
          earlyLeaves++;
          presentToday++;
        } else {
          status = "present";
          presentToday++;
        }

        if (entry.clock_out) {
          totalHours = entry.total_hours ?? null;
        } else if (entry.clock_in) {
          const clockInTime = parseISOPlain(entry.clock_in);
          const diffMs = now.getTime() - clockInTime.getTime();
          totalHours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : null;
        }

        if (isLate && entry.clock_in) {
          const timeIn = parseISOPlain(entry.clock_in);
          // Standard start on the specific day in plain
          const standardStart = parseISOPlain(`${today}T${employee.standard_shift_start}:00`);
          const minutesDiff = Math.floor(
            (timeIn.getTime() - standardStart.getTime()) / 60000,
          );
        }
      } else {
        absentToday++;
      }

      totalEmployees++;

      return {
        employee,
        timeEntry: entry,
        status,
        isLate,
        isEarlyLeave,
        total_hours: totalHours,
      };
    });

    let filteredRecords = records;
    if (statusFilter && statusFilter !== "all") {
      filteredRecords = records.filter((r) => r.status === statusFilter);
    }

    const allRecords = employees
      .filter((emp) => !emp.is_admin)
      .map((employee) => {
        const entry = entriesMap.get(employee.id) || null;
        let status: any = "absent";
        let isLate = false;
        let isEarlyLeave = false;
        let totalHours: number | null = null;

        if (entry) {
          if (entry.is_late && entry.is_early_leave) {
            status = "late";
            isLate = true;
            isEarlyLeave = true;
          } else if (entry.is_late) {
            status = "late";
            isLate = true;
          } else if (entry.is_early_leave) {
            status = "early_leave";
            isEarlyLeave = true;
          } else {
            status = "present";
          }
          if (entry.clock_out) {
            totalHours = entry.total_hours ?? null;
          } else if (entry.clock_in) {
            const clockInTime = parseISOPlain(entry.clock_in);
            const diffMs = now.getTime() - clockInTime.getTime();
            totalHours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : null;
          }
        }

        return {
          employee,
          timeEntry: entry,
          status,
          isLate,
          isEarlyLeave,
          total_hours: totalHours,
        };
      });

    return {
      records: filteredRecords,
      allRecords,
      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        lateArrivals,
        earlyLeaves,
        incompletePunches,
      },
    };
  }, [employees, department, timeEntries, searchQuery, statusFilter, now]);

  return { data, isLoading, error, refetchData };
}

export function useGetEmployeeMonthlyAttendance(
  employeeId: string | null,
  month: number,
  year: number,
) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (!employeeId) {
      setEntries([]);
      return;
    }

    const fetchEntries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const start = format(
          startOfMonth(parseISOPlain(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`)),
          "yyyy-MM-dd",
        );
        const end = format(
          endOfMonth(parseISOPlain(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`)),
          "yyyy-MM-dd"
        );

        const { data, error: fetchError } = await supabase
          .from("time_entries")
          .select("*")
          .eq("employee_id", employeeId)
          .gte("date", start)
          .lte("date", end);

        if (fetchError) throw fetchError;
        setEntries(data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch attendance"),
        );
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [employeeId, month, year, refreshTrigger]);

  const analytics = useMemo<AttendanceAnalytics | null>(() => {
    if (!employeeId) return null;

    const monthDate = parseISOPlain(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const todayStr = format(getCurrentDate(), "yyyy-MM-dd");

    const entriesMap = new Map<string, TimeEntry>();
    entries.forEach((entry) => {
      entriesMap.set(entry.date, entry);
    });

    let presentDays = 0;
    let absentDays = 0;
    let lateArrivals = 0;
    let earlyLeaves = 0;
    let totalHoursWorked = 0;

    eachDayOfInterval({ start, end }).forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      if (dateStr > todayStr) return;

      const entry = entriesMap.get(dateStr);

      if (!entry && !isWeekend(day)) {
        absentDays++;
        return;
      }

      if (entry) {
        presentDays++;
        if (entry.is_late) lateArrivals++;
        if (entry.is_early_leave) earlyLeaves++;
        if (entry.total_hours) totalHoursWorked += entry.total_hours;
      }
    });

    const averageHoursPerDay =
      presentDays > 0 ? totalHoursWorked / presentDays : 0;

    return {
      presentDays,
      absentDays,
      lateArrivals,
      earlyLeaves,
      totalHoursWorked,
      averageHoursPerDay,
      dailyAttendance: [],
    };
  }, [employeeId, month, year, entries]);

  return { analytics, entries, isLoading, error, refetch };
}
