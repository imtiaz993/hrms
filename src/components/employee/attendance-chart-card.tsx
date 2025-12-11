'use client';

import { useMemo } from 'react';
import { useGetAttendanceLog } from '@/hooks/useAttendanceLog';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

interface AttendanceChartCardProps {
  employeeId: string;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  availableMonths: Array<{ month: number; year: number; label: string }>;
}

type AttendanceStatus =
  | 'present'
  | 'early_present'
  | 'half_day'
  | 'absent'
  | 'leave'
  | 'missing';

export function AttendanceChartCard({
  employeeId,
  selectedMonth,
  selectedYear,
  onMonthChange,
  availableMonths,
}: AttendanceChartCardProps) {
  const { data: logData } = useGetAttendanceLog(
    employeeId,
    selectedMonth,
    selectedYear
  );

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
          status = 'early_present';
        } else if (log.status === 'early_leave') {
          status = 'early_present';
        } else if (log.status === 'incomplete') {
          status = 'missing';
        } else if (log.status === 'absent') {
          status = 'absent';
        } else if (log.status === 'present') {
          status = 'present';
        }
      }

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
        return 'bg-emerald-500';
      case 'early_present':
        return 'bg-yellow-400';
      case 'half_day':
        return 'bg-orange-500';
      case 'absent':
        return 'bg-rose-500';
      case 'leave':
        return 'bg-blue-500';
      case 'missing':
        return 'bg-slate-400';
      default:
        return 'bg-slate-300';
    }
  };

  if (!logData || chartData.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        No attendance data available for this month.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      {availableMonths.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-slate-50/80 p-3">
          <label className="text-sm font-medium text-slate-700">
            Select Month:
          </label>
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number);
              onMonthChange(month, year);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
          >
            {availableMonths.map((m) => (
              <option
                key={`${m.year}-${m.month}`}
                value={`${m.year}-${m.month}`}
              >
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Bar Chart */}
      <div className="space-y-3">
        <div className="flex h-56 items-end justify-between gap-1 rounded-2xl bg-slate-50/60 px-3 pb-3 pt-4">
          {chartData.map((item, index) => {
            const hasData = item.status !== 'absent';
            const height = hasData ? 40 + ((item.day % 7) * 7) : 0;

            return (
              <div
                key={index}
                className="relative flex flex-1 flex-col items-center"
              >
                {hasData && (
                  <div
                    className={`${getStatusColor(
                      item.status
                    )} w-full rounded-t-md shadow-sm transition-all`}
                    style={{
                      height: `${height}%`,
                      minHeight: hasData ? '18px' : '0',
                    }}
                    title={`${format(parseISO(item.date), 'MMM dd')}: ${
                      item.status
                    }`}
                  />
                )}
                <span className="mt-1 text-[10px] text-slate-500">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700">
        <LegendItem
          color="bg-emerald-500"
          label="Present"
          count={statusCounts.present}
        />
        <LegendItem
          color="bg-yellow-400"
          label="Late/Early"
          count={statusCounts.early_present}
        />
        <LegendItem
          color="bg-orange-500"
          label="Half-Day"
          count={statusCounts.half_day}
        />
        <LegendItem
          color="bg-rose-500"
          label="Absent"
          count={statusCounts.absent}
        />
        <LegendItem
          color="bg-blue-500"
          label="Leave"
          count={statusCounts.leave}
        />
        <LegendItem
          color="bg-slate-400"
          label="Missing"
          count={statusCounts.missing}
        />
      </div>
    </div>
  );
}


function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded ${color}`} />
      <span>
        {label} ({count})
      </span>
    </div>
  );
}
