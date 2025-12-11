"use client";

import { useMemo } from "react";
import { useGetAttendanceLog } from "@/hooks/useAttendanceLog";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
} from "date-fns";

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
      const dateStr = format(day, "yyyy-MM-dd");
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
    const scheduled = chartData.reduce(
      (sum, item) => sum + item.scheduledHours,
      0
    );
    const worked = chartData.reduce((sum, item) => sum + item.actualHours, 0);
    const difference = worked - scheduled;

    return {
      scheduled,
      worked,
      difference,
    };
  }, [chartData]);

  const maxHours =
    Math.max(
      ...chartData.map((d) => Math.max(d.scheduledHours, d.actualHours)),
      standardHoursPerDay * 1.5
    ) ||
    standardHoursPerDay ||
    8;

  if (!logData || chartData.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        No working hours data available for this month.
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
              const [year, month] = e.target.value.split("-").map(Number);
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

      {/* Bars (scheduled vs actual) */}
      <div className="space-y-3">
        <div className="relative flex h-64 items-end justify-between gap-1 rounded-2xl bg-slate-50/60 px-3 pb-3 pt-4">
          {chartData.map((item, index) => {
            const scheduledHeight = (item.scheduledHours / maxHours) * 100;
            const actualHeight =
              item.actualHours > 0 ? (item.actualHours / maxHours) * 100 : 0;

            const isOver = item.actualHours >= item.scheduledHours;

            return (
              <div
                key={index}
                className="relative flex flex-1 flex-col items-center"
              >
                {/* Scheduled baseline */}
                <div
                  className="absolute bottom-0 w-full rounded-t-md bg-slate-200/80"
                  style={{ height: `${scheduledHeight}%` }}
                />
                {/* Actual */}
                {item.actualHours > 0 && (
                  <div
                    className={`absolute bottom-0 w-full rounded-t-md border border-white/40 ${
                      isOver ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    style={{ height: `${Math.max(actualHeight, 5)}%` }}
                    title={`${format(
                      parseISO(item.date),
                      "MMM dd"
                    )}: ${item.actualHours.toFixed(1)}h / ${
                      item.scheduledHours
                    }h`}
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

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-sm">
        <div>
          <p className="text-xs text-slate-500">Total Scheduled</p>
          <p className="text-lg font-semibold text-slate-900">
            {totals.scheduled.toFixed(1)}h
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total Worked</p>
          <p className="text-lg font-semibold text-slate-900">
            {totals.worked.toFixed(1)}h
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Difference</p>
          <p
            className={`text-lg font-semibold ${
              totals.difference >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {totals.difference >= 0 ? "+" : ""}
            {totals.difference.toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-slate-700">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-slate-200" />
          <span>Scheduled (baseline)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-emerald-500" />
          <span>Actual (≥ scheduled)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-rose-500" />
          <span>Actual (&lt; scheduled)</span>
        </div>
      </div>
    </div>
  );
}
