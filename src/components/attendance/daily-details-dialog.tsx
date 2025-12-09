'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyAttendance } from '@/hooks/useAttendanceAnalytics';
import { formatDate, formatTime, formatHours } from '@/lib/time-utils';
import { X } from 'lucide-react';

interface DailyDetailsDialogProps {
  day: DailyAttendance | null;
  onClose: () => void;
}

const statusConfig = {
  present: { label: 'Present', variant: 'success' as const },
  absent: { label: 'Absent', variant: 'destructive' as const },
  late: { label: 'Late Arrival', variant: 'warning' as const },
  early_leave: { label: 'Early Leave', variant: 'warning' as const },
  future: { label: 'Future Date', variant: 'secondary' as const },
};

export function DailyDetailsDialog({ day, onClose }: DailyDetailsDialogProps) {
  if (!day) return null;

  const config = statusConfig[day.status];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Daily Attendance Details</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{formatDate(day.date)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>

          {day.status === 'absent' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-900">
                No attendance record found for this date.
              </p>
            </div>
          )}

          {day.status === 'future' && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-sm text-gray-700">
                This date is in the future.
              </p>
            </div>
          )}

          {day.timeIn && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time In</p>
                  <p className="text-lg font-semibold">{formatTime(day.timeIn)}</p>
                  {day.isLate && (
                    <Badge variant="warning" className="mt-1">Late</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time Out</p>
                  <p className="text-lg font-semibold">
                    {day.timeOut ? formatTime(day.timeOut) : '—'}
                  </p>
                  {day.isEarlyLeave && (
                    <Badge variant="warning" className="mt-1">Early</Badge>
                  )}
                </div>
              </div>

              {day.totalHours !== undefined && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Hours Worked</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatHours(day.totalHours)}
                  </p>
                </div>
              )}

              {(day.isLate || day.isEarlyLeave) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-900 font-medium mb-1">Attendance Notes</p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {day.isLate && <li>• Clocked in after shift start time</li>}
                    {day.isEarlyLeave && <li>• Clocked out before shift end time</li>}
                  </ul>
                </div>
              )}
            </>
          )}

          <Button onClick={onClose} className="w-full">Close</Button>
        </CardContent>
      </Card>
    </div>
  );
}
