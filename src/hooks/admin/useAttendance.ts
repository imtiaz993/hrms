import { Employee, TimeEntry } from '@/types';
import { format, parseISO } from 'date-fns';
import { useMemo, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseUser';
export interface TodayAttendanceRecord {
  employee: Employee;
  timeEntry: TimeEntry | null;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'incomplete';
  isLate: boolean;
  isEarlyLeave: boolean;
  total_hours: number | null;
  minutesLate: number | null;
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
  statusFilter?: string
) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');

        // ✅ Get active employees
        let employeeQuery = supabase
          .from('employees')
          .select('*')
          .eq('is_active', true);

        if (department && department !== 'all') {
          employeeQuery = employeeQuery.eq('department', department);
        }

        const { data: employeeData, error: empError } = await employeeQuery;

        if (empError) throw empError;

        // ✅ Get today's time entries
        const { data: entryData, error: entryError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('date', today);

        if (entryError) throw entryError;

        setEmployees(employeeData || []);
        setTimeEntries(entryData || []);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [department]);

  const data = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');

    let filteredEmployees = [...employees];

    if (searchQuery && searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      filteredEmployees = filteredEmployees.filter((emp) => {
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        const empId = (emp.employee_id || '').toLowerCase();
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

      let status: any = 'absent';
      let isLate = false;
      let isEarlyLeave = false;
      let minutesLate: number | null = null;

      if (entry) {
        if (!entry.clock_out) {
          status = 'incomplete';
          incompletePunches++;
          presentToday++;
        } else if (entry.is_late && entry.is_early_leave) {
          status = 'late';
          isLate = true;
          isEarlyLeave = true;
          lateArrivals++;
          earlyLeaves++;
          presentToday++;
        } else if (entry.is_late) {
          status = 'late';
          isLate = true;
          lateArrivals++;
          presentToday++;
        } else if (entry.is_early_leave) {
          status = 'early_leave';
          isEarlyLeave = true;
          earlyLeaves++;
          presentToday++;
        } else {
          status = 'present';
          presentToday++;
        }

        if (isLate && entry.clock_in) {
          const timeIn = parseISO(entry.clock_in);
          const standardStart = new Date(`${today}T${employee.standard_shift_start}`);
          const minutesDiff = Math.floor(
            (timeIn.getTime() - standardStart.getTime()) / 60000
          );
          minutesLate = minutesDiff > 0 ? minutesDiff : null;
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
        total_hours: entry?.total_hours || null,
        minutesLate,
      };
    });

    let filteredRecords = records;
    if (statusFilter && statusFilter !== 'all') {
      filteredRecords = records.filter((r) => r.status === statusFilter);
    }

    return {
      records: filteredRecords,
      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        lateArrivals,
        earlyLeaves,
        incompletePunches,
      },
    };
  }, [employees, timeEntries, searchQuery, statusFilter]);
  console.log("EMPLOYEES:", employees);
console.log("TIME ENTRIES:", timeEntries);


  return { data, isLoading, error };
}
