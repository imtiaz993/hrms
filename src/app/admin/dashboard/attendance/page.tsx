'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGetTodayAttendanceOverview } from '@/hooks/admin/useAttendance';
import { useGetDepartments, useGetAllEmployees } from '@/hooks/admin/useEmployees';

import { AttendanceKPICards } from '@/components/admin/attendance/attendance-kpi-cards';
import { TodayAttendanceTable } from '@/components/admin/attendance/today-attendance-table';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, RefreshCw, AlertCircle, Calendar, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseUser';

export default function AttendanceOverviewPage() {
 
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
   

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
   const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    late: 0,
    early: 0,
    ontime: 0,
  });

  const {
    data,
    isLoading,
    error,
  } = useGetTodayAttendanceOverview(searchQuery, department, statusFilter);

  const { data: departments } = useGetDepartments();
  const { data: employees = [] } = useGetAllEmployees();
   const totalEmployees = employees?.length || 0;



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

   const fetchAdminAttendanceToday = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
  
      const { data: employees } = await supabase
        .from("employees")
        .select("id")
        .eq("is_active", true)
          .eq("is_admin", false);
  
      const totalEmployees = employees?.length || 0;
  
      const { data: entries } = await supabase
        .from("time_entries")
        .select("employee_id, is_late, is_early_leave")
        .eq("date", today);
  
      const present = entries?.length || 0;
      const late = entries?.filter((e) => e.is_late).length || 0;
      const early = entries?.filter((e) => e.is_early_leave).length || 0;
      const absent = totalEmployees - present;
      const ontime = entries?.filter((e) => !e.is_late).length || 0;
  
      setAttendance({
        present,
        absent,
        late,
        early,
        ontime,
      });
    };
useEffect(() => {
  fetchAdminAttendanceToday();
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
    const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm";

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
          {/* <AttendanceKPICards stats={data.stats} /> */}

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Attendance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Employees
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {totalEmployees}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active employees</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Present Today
              </CardTitle>
              <Clock className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {attendance.present}
              </div>
              <p className="text-xs text-gray-500 mt-1">Clocked in</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Absent
              </CardTitle>
              <Users className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {attendance.absent}
              </div>
              <p className="text-xs text-gray-500 mt-1">Not clocked in</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Late Arrivals
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {attendance.late}
              </div>
              <p className="text-xs text-gray-500 mt-1">After start time</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Early Leaves
              </CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {attendance.early}
              </div>
              <p className="text-xs text-gray-500 mt-1">Left early</p>
            </CardContent>
          </Card>
          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                on time
              </CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {attendance.ontime}
              </div>
              <p className="text-xs text-gray-500 mt-1">on time</p>
            </CardContent>
          </Card>
        </div>
      </section>


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

          
        </>
      ) : null}
    </div>
  );
}
