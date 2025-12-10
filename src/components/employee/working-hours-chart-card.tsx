'use client';

import { useMemo } from 'react';
import { useGetAttendanceLog } from '@/hooks/useAttendanceLog';
import { useGetAvailableMonths } from '@/hooks/useAttendanceAnalytics';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

interface WorkingHoursChartCardProps {
  employeeId: string;
  selectedMonth: number;
  selectedYear: number;
  standardHoursPerDay: number;
  onMonthChange: (month: number, year: number) => void;
  availableMonths: Array<{ month: number; year: number; label: string }>;
}

export function WorkingHoursChartCard({
  employeeId,
  selectedMonth,
  selectedYear,
  standardHoursPerDay,
  onMonthChange,
  availableMonths,
}: WorkingHoursChartCardProps) {
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

      return {
        date: dateStr,
        day: day.getDate(),
        scheduledHours: standardHoursPerDay,
        actualHours: log?.totalHours || 0,
      };
    });
  }, [logData, selectedMonth, selectedYear, standardHoursPerDay]);

  const totals = useMemo(() => {
    const scheduled = chartData.reduce((sum, item) => sum + item.scheduledHours, 0);
    const worked = chartData.reduce((sum, item) => sum + item.actualHours, 0);
    const difference = worked - scheduled;

    return {
      scheduled,
      worked,
      difference,
    };
  }, [chartData]);

  const maxHours = Math.max(
    ...chartData.map((d) => Math.max(d.scheduledHours, d.actualHours)),
    standardHoursPerDay * 1.5
  );

  if (!logData || chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No working hours data available for this month.</p>
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

      {/* Line Chart */}
      <div className="space-y-2">
        <div className="relative h-64 flex items-end justify-between gap-1">
          {chartData.map((item, index) => {
            const scheduledHeight = (item.scheduledHours / maxHours) * 100;
            const actualHeight = item.actualHours > 0 ? (item.actualHours / maxHours) * 100 : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center relative">
                {/* Scheduled hours bar (baseline) */}
                <div
                  className="w-full bg-gray-200 rounded-t absolute bottom-0 opacity-50"
                  style={{ height: `${scheduledHeight}%` }}
                />
                {/* Actual hours bar */}
                {item.actualHours > 0 && (
                  <div
                    className={`w-full rounded-t transition-all ${
                      item.actualHours >= item.scheduledHours ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${Math.max(actualHeight, 2)}%` }}
                    title={`${format(parseISO(item.date), 'MMM dd')}: ${item.actualHours.toFixed(1)}h / ${item.scheduledHours}h`}
                  />
                )}
                <span className="text-xs text-gray-500 mt-1">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-gray-500">Total Scheduled</p>
          <p className="text-lg font-semibold">{totals.scheduled.toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Worked</p>
          <p className="text-lg font-semibold">{totals.worked.toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Difference</p>
          <p
            className={`text-lg font-semibold ${
              totals.difference >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {totals.difference >= 0 ? '+' : ''}
            {totals.difference.toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <span>Scheduled (baseline)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Actual (above)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Actual (below)</span>
        </div>
      </div>
    </div>
  );
}

