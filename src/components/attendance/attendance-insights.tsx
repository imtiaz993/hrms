'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceAnalytics } from '@/hooks/useAttendanceAnalytics';

interface AttendanceInsightsProps {
  analytics: AttendanceAnalytics;
}

export function AttendanceInsights({ analytics }: AttendanceInsightsProps) {
  const totalDays = analytics.presentDays + analytics.absentDays;
  const presentPercentage = totalDays > 0 ? (analytics.presentDays / totalDays) * 100 : 0;
  const absentPercentage = totalDays > 0 ? (analytics.absentDays / totalDays) * 100 : 0;

  const punctualityScore = analytics.presentDays > 0
    ? ((analytics.presentDays - analytics.lateArrivals - analytics.earlyLeaves) / analytics.presentDays) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attendance Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Present Days</span>
              <span className="font-medium">{analytics.presentDays} ({presentPercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${presentPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Absent Days</span>
              <span className="font-medium">{analytics.absentDays} ({absentPercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all"
                style={{ width: `${absentPercentage}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Hours Worked</span>
              <span className="text-2xl font-bold text-blue-600">
                {analytics.totalHoursWorked.toFixed(1)}h
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Punctuality Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div>
                <div className="text-4xl font-bold">{punctualityScore.toFixed(0)}%</div>
                <div className="text-xs uppercase tracking-wide">Score</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Based on on-time arrivals and full shifts
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">On-Time Days</span>
              <span className="font-medium text-green-600">
                {analytics.presentDays - analytics.lateArrivals}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Late Arrivals</span>
              <span className="font-medium text-yellow-600">
                {analytics.lateArrivals}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Early Leaves</span>
              <span className="font-medium text-orange-600">
                {analytics.earlyLeaves}
              </span>
            </div>
          </div>

          {punctualityScore < 80 && analytics.presentDays > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-900">
                <strong>Tip:</strong> Try to arrive on time and complete your full shift to improve your punctuality score.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
