import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Employee, TimeEntry } from '@/types';
import { format, parseISO } from 'date-fns';

export interface TodayAttendanceRecord {
  employee: Employee;
  timeEntry: TimeEntry | null;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'incomplete';
  isLate: boolean;
  isEarlyLeave: boolean;
  hoursWorked: number | null;
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
  return useQuery({
    queryKey: ['admin', 'attendance', 'today', searchQuery, department, statusFilter],
    queryFn: async (): Promise<{
      records: TodayAttendanceRecord[];
      stats: AttendanceOverviewStats;
    }> => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const [employeesResult, entriesResult] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .eq('is_active', true)
          .order('first_name'),
        supabase.from('time_entries').select('*').eq('date', today),
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (entriesResult.error) throw entriesResult.error;

      let employees = employeesResult.data || [];
      const entriesMap = new Map<string, TimeEntry>();

      (entriesResult.data || []).forEach((entry) => {
        entriesMap.set(entry.employee_id, entry);
      });

      if (department && department !== 'all') {
        employees = employees.filter((emp) => emp.department === department);
      }

      if (searchQuery && searchQuery.trim() !== '') {
        const lowerQuery = searchQuery.toLowerCase();
        employees = employees.filter((emp) => {
          const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
          const empId = (emp.employee_id || '').toLowerCase();
          return fullName.includes(lowerQuery) || empId.includes(lowerQuery);
        });
      }

      let totalEmployees = 0;
      let presentToday = 0;
      let absentToday = 0;
      let lateArrivals = 0;
      let earlyLeaves = 0;
      let incompletePunches = 0;

      const records: TodayAttendanceRecord[] = employees.map((employee) => {
        const entry = entriesMap.get(employee.id) || null;

        let status: TodayAttendanceRecord['status'] = 'absent';
        let isLate = false;
        let isEarlyLeave = false;
        let minutesLate: number | null = null;

        if (entry) {
          if (!entry.time_out) {
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

          if (isLate && entry.time_in) {
            const timeIn = parseISO(`${today}T${entry.time_in}`);
            const standardStart = parseISO(`${today}T${employee.standard_shift_start}`);
            minutesLate = Math.floor((timeIn.getTime() - standardStart.getTime()) / 60000);
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
          hoursWorked: entry?.total_hours || null,
          minutesLate,
        };
      });

      let filteredRecords = records;
      if (statusFilter && statusFilter !== 'all') {
        filteredRecords = records.filter((record) => record.status === statusFilter);
      }

      const stats: AttendanceOverviewStats = {
        totalEmployees,
        presentToday,
        absentToday,
        lateArrivals,
        earlyLeaves,
        incompletePunches,
      };

      return { records: filteredRecords, stats };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}
