'use client';

import { useMemo } from 'react';
import { useGetAttendanceLog } from '@/hooks/useAttendanceLog';
import { useGetAvailableMonths } from '@/hooks/useAttendanceAnalytics';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

interface AttendanceChartCardProps {
  employeeId: string;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  availableMonths: Array<{ month: number; year: number; label: string }>;
}

type AttendanceStatus = 'present' | 'early_present' | 'half_day' | 'absent' | 'leave' | 'missing';

export function AttendanceChartCard({
  employeeId,
  selectedMonth,
  selectedYear,
  onMonthChange,
  availableMonths,
}: AttendanceChartCardProps) {
  const { data: logData } = useGetAttendanceLog(employeeId, selectedMonth, selectedYear);

  const chartData = useMemo(() => {
    if (!logData) return [];

    const monthDate = new Date(selectedYear, selectedMonth - 1, 1);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const allDays = eachDayOfInterval({ start, end });

    return allDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = logData.logs.find((l) => l.date === dateStr);

      let status: AttendanceStatus = 'absent';
      if (log) {
        if (log.status === 'present' && !log.isLate) {
          status = 'present';
        } else if (log.status === 'late' && log.isLate) {
          status = 'early_present'; // Late arrival
        } else if (log.status === 'early_leave') {
          status = 'early_present'; // Early leave
        } else if (log.status === 'incomplete') {
          status = 'missing';
        } else if (log.status === 'absent') {
          status = 'absent';
        } else if (log.status === 'present') {
          status = 'present';
        }
      }
      
      // Check for leave requests on this date
      // Note: This would need leave request data, but for now we'll use present/absent

      return {
        date: dateStr,
        day: day.getDate(),
        status,
      };
    });
  }, [logData, selectedMonth, selectedYear]);

  const statusCounts = useMemo(() => {
    const counts = {
      present: 0,
      early_present: 0,
      half_day: 0,
      absent: 0,
      leave: 0,
      missing: 0,
    };

    chartData.forEach((item) => {
      counts[item.status]++;
    });

    return counts;
  }, [chartData]);

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'early_present':
        return 'bg-yellow-500';
      case 'half_day':
        return 'bg-orange-500';
      case 'absent':
        return 'bg-red-500';
      case 'leave':
        return 'bg-blue-500';
      case 'missing':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  if (!logData || chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No attendance data available for this month.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      {availableMonths.length > 0 && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Select Month:</label>
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number);
              onMonthChange(month, year);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {availableMonths.map((m) => (
              <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Bar Chart */}
      <div className="space-y-2">
        <div className="flex items-end justify-between gap-1 h-48">
          {chartData.map((item, index) => {
            // Show a bar for each day - height represents presence (not absent)
            const hasData = item.status !== 'absent';
            // Use a fixed height for visibility, or scale based on day of week
            const height = hasData ? 60 + (item.day % 7) * 5 : 0; // Vary height slightly for visual interest
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                {hasData && (
                  <div
                    className={`w-full ${getStatusColor(item.status)} rounded-t transition-all`}
                    style={{ height: `${height}%`, minHeight: hasData ? '20px' : '0' }}
                    title={`${format(parseISO(item.date), 'MMM dd')}: ${item.status}`}
                  />
                )}
                <span className="text-xs text-gray-500 mt-1">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Present ({statusCounts.present})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Early Present ({statusCounts.early_present})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Half-Day ({statusCounts.half_day})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Absent ({statusCounts.absent})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Leave ({statusCounts.leave})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded"></div>
          <span>Missing ({statusCounts.missing})</span>
        </div>
      </div>
    </div>
  );
}

