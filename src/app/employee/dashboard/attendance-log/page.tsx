'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useGetAttendanceLog } from '@/hooks/useAttendanceLog';
import { useGetAvailableMonths } from '@/hooks/useAttendanceAnalytics';
import { DailyLogTable } from '@/components/attendance-log/daily-log-table';
import { AttendanceLogSummaryComponent } from '@/components/attendance-log/attendance-log-summary';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, FileText } from 'lucide-react';

export default function AttendanceLogPage() {
  const { currentUser } = useAppSelector((state) => state.auth);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);

  const {
    data: months,
    isLoading: monthsLoading,
    error: monthsError,
    refetch: refetchMonths,
  } = useGetAvailableMonths(currentUser?.id || '');

  const {
    data: logData,
    isLoading: logLoading,
    error: logError,
    refetch: refetchLog,
  } = useGetAttendanceLog(currentUser?.id || '', selectedMonth, selectedYear);

  if (!currentUser) {
    return null;
  }

  if (months && months.length > 0 && selectedMonth === 0) {
    setSelectedMonth(months[0].month);
    setSelectedYear(months[0].year);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Attendance Log</h1>
        <p className="text-gray-600 mt-1">View your day-wise punch history</p>
      </div>

      {monthsError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load available months.
            <Button
              variant="link"
              onClick={() => refetchMonths()}
              className="ml-2 p-0 h-auto"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : monthsLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : months && months.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                No attendance records available yet. Start clocking in to see your logs.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Select Month:</label>
                <select
                  value={`${selectedYear}-${selectedMonth}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-').map(Number);
                    setSelectedYear(year);
                    setSelectedMonth(month);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {months?.map((m) => (
                    <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {logError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load your attendance log.
                <Button
                  variant="link"
                  onClick={() => refetchLog()}
                  className="ml-2 p-0 h-auto"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : logLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : logData ? (
            <>
              <AttendanceLogSummaryComponent summary={logData.summary} />

              {logData.logs.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No attendance records found for this month.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <DailyLogTable logs={logData.logs} />
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
