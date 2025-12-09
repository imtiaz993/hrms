'use client';

import { useState, useEffect } from 'react';
import { useGetTodayAttendanceOverview } from '@/hooks/admin/useAttendance';
import { useGetDepartments } from '@/hooks/admin/useEmployees';
import { AttendanceKPICards } from '@/components/admin/attendance/attendance-kpi-cards';
import { TodayAttendanceTable } from '@/components/admin/attendance/today-attendance-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function AttendanceOverviewPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetTodayAttendanceOverview(searchQuery, department, statusFilter);

  const { data: departments } = useGetDepartments();

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date());
  };

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
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
        </>
      ) : null}
    </div>
  );
}
