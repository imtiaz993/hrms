'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyAttendance } from '@/hooks/useAttendanceAnalytics';
import { format, parseISO, startOfMonth, getDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceHeatmapProps {
  dailyAttendance: DailyAttendance[];
  month: number;
  year: number;
  onDayClick: (day: DailyAttendance) => void;
}

const statusColors = {
  present: 'bg-green-500 hover:bg-green-600',
  absent: 'bg-red-500 hover:bg-red-600',
  late: 'bg-yellow-500 hover:bg-yellow-600',
  early_leave: 'bg-orange-500 hover:bg-orange-600',
  future: 'bg-gray-200 hover:bg-gray-300',
};

const statusLabels = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late Arrival',
  early_leave: 'Early Leave',
  future: 'Future',
};

export function AttendanceHeatmap({
  dailyAttendance,
  month,
  year,
  onDayClick,
}: AttendanceHeatmapProps) {
  const firstDayOfMonth = startOfMonth(new Date(year, month - 1));
  const startingDayOfWeek = getDay(firstDayOfMonth);

  const emptyDays = Array(startingDayOfWeek).fill(null);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Attendance Heatmap</CardTitle>
        <div className="flex flex-wrap gap-4 mt-2">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center space-x-2">
              <div
                className={cn('w-4 h-4 rounded', statusColors[status as keyof typeof statusColors])}
              />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 pb-2">
              {day}
            </div>
          ))}

          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {dailyAttendance.map((day) => {
            const date = parseISO(day.date);
            const dayNumber = format(date, 'd');

            return (
              <button
                key={day.date}
                onClick={() => onDayClick(day)}
                disabled={day.status === 'future'}
                className={cn(
                  'aspect-square rounded-md flex items-center justify-center text-sm font-medium text-white transition-colors',
                  statusColors[day.status],
                  day.status === 'future' && 'cursor-not-allowed opacity-50'
                )}
                title={`${dayNumber} - ${statusLabels[day.status]}`}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
