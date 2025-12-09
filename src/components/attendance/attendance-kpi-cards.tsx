'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceAnalytics } from '@/hooks/useAttendanceAnalytics';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface AttendanceKPICardsProps {
  analytics: AttendanceAnalytics;
}

export function AttendanceKPICards({ analytics }: AttendanceKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present Days</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {analytics.presentDays}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Avg {analytics.averageHoursPerDay.toFixed(1)}h per day
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {analytics.absentDays}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Days not clocked in
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {analytics.lateArrivals}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Clocked in late
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Early Leaves</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {analytics.earlyLeaves}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Left before shift end
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
