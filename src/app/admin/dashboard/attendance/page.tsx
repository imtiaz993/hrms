'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGetTodayAttendanceOverview } from '@/hooks/admin/useAttendance';
import { useGetDepartments, useGetAllEmployees } from '@/hooks/admin/useEmployees';
import { useGetAttendanceAnalytics } from '@/hooks/useAttendanceAnalytics';
import { AttendanceKPICards } from '@/components/admin/attendance/attendance-kpi-cards';
import { TodayAttendanceTable } from '@/components/admin/attendance/today-attendance-table';
import { AttendanceChartCard } from '@/components/employee/attendance-chart-card';
import { WorkingHoursChartCard } from '@/components/employee/working-hours-chart-card';
import { AttendanceHeatmap } from '@/components/attendance/attendance-heatmap';
import { AttendanceInsights } from '@/components/attendance/attendance-insights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, RefreshCw, AlertCircle, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function AttendanceOverviewPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const {
    data,
    isLoading,
    error,
  } = useGetTodayAttendanceOverview(searchQuery, department, statusFilter);

  const { data: departments } = useGetDepartments();
  const { data: employees = [] } = useGetAllEmployees('', 'all', 'active');

  const { data: analyticsData } = useGetAttendanceAnalytics(selectedEmployeeId, selectedMonth, selectedYear);

  const [selectedDay, setSelectedDay] = useState<any>(null);

  const selectedEmployee = useMemo(() => {
    return employees.find((emp) => emp.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  const availableMonths = useMemo(() => {
    const now = new Date();
    return [
      { month: now.getMonth() + 1, year: now.getFullYear(), label: format(now, 'MMMM yyyy') },
    ];
  }, []);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Overview</h1>
          <p className="text-gray-600 mt-1">Real-time attendance monitoring for today</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            <Calendar className="inline h-4 w-4 mr-1" />
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load attendance overview.
            <Button variant="link" onClick={handleRefresh} className="ml-2 p-0 h-auto">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          <AttendanceKPICards stats={data.stats} />

          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="all">All Departments</option>
                    {departments?.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="all">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="early_leave">Early Leave</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Last updated: {getTimeSinceUpdate()}
              </div>
            </CardContent>
          </Card>
          {data.records.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  No attendance records found for today.
                </div>
              </CardContent>
            </Card>
          ) : (
            <TodayAttendanceTable records={data.records} />
          )}

          <div className="border-t pt-8 mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Attendance Analytics</h2>
              <p className="text-gray-600">Detailed attendance insights and trends</p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Select Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Users className="h-5 w-5 text-gray-400" />
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.department}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedEmployee && (
                  <p className="mt-3 text-sm text-gray-600">
                    Showing analytics for:{' '}
                    <span className="font-semibold text-gray-900">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </span>
                    {' '}({selectedEmployee.department} - {selectedEmployee.designation})
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceChartCard
                    employeeId={selectedEmployeeId}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onMonthChange={handleMonthChange}
                    availableMonths={availableMonths}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Working Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkingHoursChartCard
                    employeeId={selectedEmployeeId}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    standardHoursPerDay={selectedEmployee?.standard_hours_per_day || 8}
                    onMonthChange={handleMonthChange}
                    availableMonths={availableMonths}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="mb-6">
              <AttendanceHeatmap
                dailyAttendance={analyticsData?.dailyAttendance || []}
                month={selectedMonth}
                year={selectedYear}
                onDayClick={setSelectedDay}
              />
            </div>

            <div>
              <AttendanceInsights analytics={analyticsData || { presentDays: 0, absentDays: 0, lateArrivals: 0, earlyLeaves: 0, totalHoursWorked: 0, averageHoursPerDay: 0, dailyAttendance: [] }} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
