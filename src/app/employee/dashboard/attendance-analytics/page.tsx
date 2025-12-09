'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  useGetAttendanceAnalytics,
  useGetAvailableMonths,
  DailyAttendance,
} from '@/hooks/useAttendanceAnalytics';
import { AttendanceKPICards } from '@/components/attendance/attendance-kpi-cards';
import { AttendanceHeatmap } from '@/components/attendance/attendance-heatmap';
import { DailyDetailsDialog } from '@/components/attendance/daily-details-dialog';
import { AttendanceInsights } from '@/components/attendance/attendance-insights';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar } from 'lucide-react';

export default function AttendanceAnalyticsPage() {
  const { currentUser } = useAppSelector((state) => state.auth);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);
  const [selectedDay, setSelectedDay] = useState<DailyAttendance | null>(null);

  const {
    data: months,
    isLoading: monthsLoading,
    error: monthsError,
    refetch: refetchMonths,
  } = useGetAvailableMonths(currentUser?.id || '');

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useGetAttendanceAnalytics(currentUser?.id || '', selectedMonth, selectedYear);

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
        <h1 className="text-3xl font-bold text-gray-900">Attendance Analytics</h1>
        <p className="text-gray-600 mt-1">View your attendance performance and trends</p>
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
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                No attendance records available yet. Start clocking in to see your analytics.
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

          {analyticsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load attendance analytics.
                <Button
                  variant="link"
                  onClick={() => refetchAnalytics()}
                  className="ml-2 p-0 h-auto"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : analytics ? (
            <>
              <AttendanceKPICards analytics={analytics} />

              <AttendanceHeatmap
                dailyAttendance={analytics.dailyAttendance}
                month={selectedMonth}
                year={selectedYear}
                onDayClick={setSelectedDay}
              />

              <AttendanceInsights analytics={analytics} />
            </>
          ) : null}
        </>
      )}

      <DailyDetailsDialog day={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  );
}
