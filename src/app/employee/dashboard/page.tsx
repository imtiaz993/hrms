'use client';

import { useAppSelector } from '@/store/hooks';
import { useGetTodayStatus, useGetRecentAttendance } from '@/hooks/useTimeEntry';
import { TodayStatusCard } from '@/components/employee/today-status-card';
import { ClockActionCard } from '@/components/employee/clock-action-card';
import { RecentAttendanceList } from '@/components/employee/recent-attendance-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function EmployeeDashboardPage() {
  const { currentUser } = useAppSelector((state) => state.auth);

  const {
    data: todayStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useGetTodayStatus(
    currentUser?.id || '',
    currentUser?.standard_hours_per_day || 8,
    currentUser?.standard_shift_start || '09:00'
  );

  const {
    data: recentAttendance,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useGetRecentAttendance(currentUser?.id || '', 7);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Time In / Time Out</h1>
        <p className="text-gray-600 mt-1">Track your working hours for today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statusError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load today's status.
              <Button
                variant="link"
                onClick={() => refetchStatus()}
                className="ml-2 p-0 h-auto"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : statusLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : todayStatus ? (
          <>
            <TodayStatusCard status={todayStatus} />
            <ClockActionCard
              status={todayStatus}
              employeeId={currentUser.id}
              standardHours={currentUser.standard_hours_per_day}
              standardShiftStart={currentUser.standard_shift_start}
              standardShiftEnd={currentUser.standard_shift_end}
            />
          </>
        ) : null}
      </div>

      <div>
        {attendanceError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load attendance records.
              <Button
                variant="link"
                onClick={() => refetchAttendance()}
                className="ml-2 p-0 h-auto"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : attendanceLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : recentAttendance ? (
          <RecentAttendanceList attendance={recentAttendance} />
        ) : null}
      </div>
    </div>
  );
}
