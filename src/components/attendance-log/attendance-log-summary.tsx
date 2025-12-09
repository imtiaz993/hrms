'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceLogSummary } from '@/hooks/useAttendanceLog';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface AttendanceLogSummaryProps {
  summary: AttendanceLogSummary;
}

export function AttendanceLogSummaryComponent({ summary }: AttendanceLogSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-gray-600">Present Days</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{summary.totalPresentDays}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-gray-600">Absent Days</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{summary.totalAbsentDays}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-gray-600">Total Hours</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {summary.totalHoursWorked.toFixed(1)}h
            </p>
          </div>

          {summary.totalOvertimeHours > 0 && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <p className="text-sm text-gray-600">Overtime</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {summary.totalOvertimeHours.toFixed(1)}h
              </p>
            </div>
          )}

          {summary.totalIncompletePunches > 0 && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <p className="text-sm text-gray-600">Incomplete</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {summary.totalIncompletePunches}
              </p>
            </div>
          )}
        </div>

        {summary.totalIncompletePunches > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-sm text-orange-900">
              <strong>Notice:</strong> You have {summary.totalIncompletePunches} incomplete{' '}
              {summary.totalIncompletePunches === 1 ? 'punch' : 'punches'}. Please ensure you
              clock out at the end of your shift to avoid attendance issues.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
