'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TodayAttendanceRecord, useGetEmployeeMonthlyAttendance } from '@/hooks/admin/useAttendance';
import { formatTime, formatHours } from '@/lib/time-utils';
import { Eye } from 'lucide-react';
import { AttendanceKPICards } from '@/components/attendance/attendance-kpi-cards';
import { Employee } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import QuickOverview from '@/app/employee/dashboard/component/QuickOverview';

interface TodayAttendanceTableProps {
  records: TodayAttendanceRecord[];
  allEmployees?: Employee[];
  selectedMonth?: number;
  selectedYear?: number;
  onMonthChange?: (month: number, year: number) => void;
}

const statusConfig = {
  present: { label: 'Present', variant: 'success' as const },
  absent: { label: 'Absent', variant: 'destructive' as const },
  late: { label: 'Late', variant: 'warning' as const },
  early_leave: { label: 'Early Leave', variant: 'warning' as const },
  incomplete: { label: 'Incomplete', variant: 'destructive' as const },
};

export function TodayAttendanceTable({
  records,
  allEmployees = [],
  selectedMonth = new Date().getMonth() + 1,
  selectedYear = new Date().getFullYear(),
  onMonthChange,
}: TodayAttendanceTableProps) {
  const router = useRouter();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Use all employees for dropdown (so we can select anyone, including absent today)
  const employees = useMemo(() => {
    const fromRecords = Array.from(new Map(records.map(r => [r.employee.id, r.employee])).values());
    if (allEmployees.length > 0) return allEmployees;
    return fromRecords;
  }, [records, allEmployees]);

  // Fetch employee's monthly attendance from DB when selected
  const { analytics: fetchedAnalytics, entries: monthlyEntries, isLoading: analyticsLoading } = useGetEmployeeMonthlyAttendance(
    selectedEmployeeId,
    selectedMonth,
    selectedYear
  );

  // Selected employee for standard_hours_per_day (chart)
  const selectedEmployee = useMemo(() =>
    employees.find(e => e.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId]
  );

  // Chart data for QuickOverview - same format as employee dashboard, based on selected employee's monthly entries
  const chartData = useMemo(() => {
    if (!selectedEmployeeId) return [];
    const monthDate = new Date(selectedYear, selectedMonth - 1, 1);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const allDays = eachDayOfInterval({ start, end });
    const entriesMap = new Map(monthlyEntries.map(e => [e.date, e]));

    return allDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = entriesMap.get(dateStr);
      const standardHours = selectedEmployee?.standard_hours_per_day ?? 8;
      return {
        date: dateStr,
        day: day.getDate(),
        clock_in: entry?.clock_in ?? null,
        clock_out: entry?.clock_out ?? null,
        standard_hours: standardHours,
        total_hours: entry?.total_hours ?? 0,
        is_late: entry?.is_late ?? false,
        is_early_leave: entry?.is_early_leave ?? false,
      };
    });
  }, [selectedEmployeeId, selectedMonth, selectedYear, monthlyEntries, selectedEmployee?.standard_hours_per_day]);

  // Fallback: when "All Employees" selected, use today's aggregate from records
  const todayAnalytics = useMemo(() => {
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateArrivals = records.filter(r => r.status === 'late').length;
    const earlyLeaves = records.filter(r => r.status === 'early_leave').length;
    const totalHoursWorked = records.reduce((acc, r) => acc + (r.total_hours || 0), 0);
    const averageHoursPerDay = presentDays ? totalHoursWorked / presentDays : 0;
    return {
      presentDays,
      absentDays,
      lateArrivals,
      earlyLeaves,
      totalHoursWorked,
      averageHoursPerDay,
      dailyAttendance: [],
    };
  }, [records]);

  // Use DB-fetched analytics when employee selected, else today's aggregate
  const analytics = selectedEmployeeId && fetchedAnalytics ? fetchedAnalytics : todayAnalytics;
  const isLoading = records.length === 0 || (!!selectedEmployeeId && analyticsLoading);

  const cardBase = 'relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm';

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Employee + Month selector - card data only */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="font-medium">Select Employee:</label>
          <select
            className="border rounded px-3 py-1 min-w-[180px]"
            value={selectedEmployeeId || ''}
            onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
        </div>
        {onMonthChange && (
          <div className="flex items-center gap-3">
            <label className="font-medium">Period:</label>
            <select
              className="border rounded px-3 py-1"
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value), selectedYear)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {format(new Date(selectedYear, m - 1), 'MMMM')}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-3 py-1"
              value={selectedYear}
              onChange={(e) => onMonthChange(selectedMonth, Number(e.target.value))}
            >
              {[selectedYear, selectedYear - 1, selectedYear - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPIs update based on selected employee */}
      <AttendanceKPICards
        analytics={analytics}
        cardBase={cardBase}
        isLoading={isLoading}
      />

      {/* Quick Attendance Overview - shows chart for selected employee */}
      {selectedEmployeeId ? (
        <QuickOverview
          cardBase={cardBase}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          currentUser={selectedEmployee}
          handleMonthChange={onMonthChange}
          months={[]}
          chartData={chartData}
          isLoading={analyticsLoading}
        />
      ) : (
        <div className={`${cardBase} rounded-2xl p-8 lg:col-span-2`}>
          <h3 className="text-base font-semibold text-slate-900">Quick Attendance Overview</h3>
          <p className="mt-2 text-sm text-slate-500">Select an employee to view their attendance chart.</p>
        </div>
      )}

      {/* Attendance Table - always shows ALL employees (filter only applies to cards above) */}
      {records.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-white">
          <p className="text-gray-500">No matching records found.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Status</TableHead>

              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const config = statusConfig[record.status];
                const fullName = `${record.employee.first_name} ${record.employee.last_name}`;

                return (
                  <TableRow key={record.employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                          {getInitials(record.employee.first_name, record.employee.last_name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{fullName}</div>
                          {record.employee.employee_id && (
                            <div className="text-xs text-gray-500">
                              ID: {record.employee.employee_id}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">{record.employee.department}</TableCell>
                    <TableCell>
                      {record.timeEntry?.clock_in ? (
                        <div>
                          <div className="text-sm text-gray-900">{formatTime(record.timeEntry.clock_in)}</div>
                          {record.minutesLate && record.minutesLate > 0 && (
                            <div className="text-xs text-yellow-600">{record.minutesLate} min late</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Missing</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.timeEntry?.clock_out ? (
                        <div className="text-sm text-gray-900">{formatTime(record.timeEntry.clock_out)}</div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.total_hours !== null ? (
                        <div className="text-sm font-medium text-gray-900">
                          {formatHours(record.total_hours)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                   
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
