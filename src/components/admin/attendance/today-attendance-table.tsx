'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { TodayAttendanceRecord, useGetEmployeeMonthlyAttendance } from '@/hooks/admin/useAttendance';
import { formatTime, formatHours } from '@/lib/time-utils';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { AttendanceKPICards } from '@/components/attendance/attendance-kpi-cards';
import { Employee } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import QuickOverview from '@/app/employee/dashboard/component/QuickOverview';

interface TodayAttendanceTableProps {
  /** Filter 1: for table only (Search, Department, Status) */
  tableRecords: TodayAttendanceRecord[];
  /** Unfiltered records for "All Employees" cards (independent of Filter 1) */
  allRecords: TodayAttendanceRecord[];
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
  tableRecords,
  allRecords,
  allEmployees = [],
  selectedMonth = new Date().getMonth() + 1,
  selectedYear = new Date().getFullYear(),
  onMonthChange,
}: TodayAttendanceTableProps) {
  const router = useRouter();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Use all employees for dropdown (exclude admins - only show employees)
  const employees = useMemo(() => {
    const fromRecords = Array.from(new Map(allRecords.map(r => [r.employee.id, r.employee])).values());
    const list = allEmployees.length > 0 ? allEmployees : fromRecords;
    return list.filter(e => !e.is_admin);
  }, [allRecords, allEmployees]);

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

  // Cards: zero when no employee selected; employee data when selected
  const emptyAnalytics = useMemo(() => ({
    presentDays: 0,
    absentDays: 0,
    lateArrivals: 0,
    earlyLeaves: 0,
    totalHoursWorked: 0,
    averageHoursPerDay: 0,
    dailyAttendance: [],
  }), []);

  const analytics = selectedEmployeeId
    ? (fetchedAnalytics ?? emptyAnalytics)
    : emptyAnalytics;

  // Cards loading: only when fetching employee data (not when allRecords empty)
  const cardsLoading = !!selectedEmployeeId && analyticsLoading;

  const cardBase = 'relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm';

  useEffect(() => {
    setPage(1);
  }, [tableRecords.length, pageSize]);

  const total = tableRecords.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRecords = tableRecords.slice(startIndex, startIndex + pageSize);
  const showingFrom = total === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + pageSize, total);

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Filter 1 applies ONLY to table */}
      {tableRecords.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-white">
          <p className="text-gray-500">No matching records for the selected filters.</p>
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
              {paginatedRecords.map((record) => {
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

      {tableRecords.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{showingFrom}</span>–
            <span className="font-medium text-gray-900">{showingTo}</span> of{" "}
            <span className="font-medium text-gray-900">{total}</span>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <span className="text-sm text-gray-600">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="flex h-9 w-[96px] rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {[5, 10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Prev</span>
              </Button>
              <div className="text-sm text-gray-700 text-center px-2 whitespace-nowrap">
                Page <span className="font-medium">{safePage}</span> /{" "}
                <span className="font-medium">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex-1 sm:flex-none"
              >
                <span className="mr-1 hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="font-medium">Select Employee:</label>
          <select
            className="border rounded px-3 py-1 min-w-[180px]"
            value={selectedEmployeeId || ''}
            onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
          >
            <option value="">Attendance By Employee</option>
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
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

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

      {/* KPIs - zero when no employee; employee data when selected */}
      <AttendanceKPICards
        analytics={analytics}
        cardBase={cardBase}
        isLoading={cardsLoading}
      />

    

   
   
    </div>
  );
}
