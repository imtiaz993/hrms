"use client";

import { useMemo } from "react";
import {
  format,
  parseISO,
  isSunday,
  isSaturday,
  isFuture,
  isToday,
} from "date-fns";
const statusLabels: any = {
  present: "Present",
  absent: "Absent",
  late: "Late Arrival",
  early_leave: "Early Leave",
  future: "Future",
  weekEnd: "WeekEnd",
};
import { cn } from "@/lib/utils";
interface WorkingHoursChartCardProps {
  selectedMonth: number;
  selectedYear: number;
  standardHoursPerDay: number;
  onMonthChange: (month: number, year: number) => void;
  availableMonths: Array<{ month: number; year: number; label: string }>;
  chartData: any;
  isLoading: any;
}
const statusColors: any = {
  present: "bg-emerald-500/90 hover:bg-emerald-600",
  absent: "bg-rose-500/90 hover:bg-rose-600",
  late: "bg-amber-400/90 hover:bg-amber-500",
  early_leave: "bg-orange-500/90 hover:bg-orange-600",
  future: "bg-slate-200 hover:bg-slate-300",
  weekEnd: "bg-black hover:bg-gray-500",
};

export function WorkingHoursChartCard({
  selectedMonth,
  selectedYear,
  standardHoursPerDay,
  onMonthChange,
  availableMonths,
  chartData,
  isLoading,
}: WorkingHoursChartCardProps) {
  const totals = useMemo(() => {
    const scheduled = chartData.reduce(
      (sum:any, item:any) =>
        isSaturday(item.date) || isSunday(item.date)
          ? sum + 0
          : sum + item.standard_hours,
      0
    );
    const worked = chartData.reduce((sum:any, item:any) => sum + item.total_hours, 0);
    return {
      scheduled,
      worked,
      difference: worked - scheduled,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        Loading working hours...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        No working hours data available for this month.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
      <div className="space-y-3">
        <div className="relative flex h-64 items-end justify-between gap-1 rounded-2xl bg-slate-50/60 px-3 pb-3 pt-4">
          {chartData.map((item:any, index:any) => {
            const actualHeight = (item.total_hours / item.standard_hours) * 100;

            return (
              <div
                key={index}
                className="relative flex flex-1 flex-col justify-end items-center h-full"
              >
                <div
                  className={`relative bottom-0 w-full rounded-t-md ${
                    isSunday(item.date) || isSaturday(item.date)
                      ? "bg-black"
                      : "bg-slate-200/80"
                  }`}
                  style={{
                    height: `${
                      isFuture(item.date) ||
                      isSunday(item.date) ||
                      isSaturday(item.date)
                        ? "20"
                        : !item.clock_in || !item.clock_out
                        ? 20
                        : (item.standard_hours / standardHoursPerDay) * 100
                    }%`,
                  }}
                >
                  <div
                    className={`absolute bottom-0 w-full rounded-t-md border border-white/40 ${
                      item.is_late
                        ? "bg-yellow-400"
                        : item.is_early_leave
                        ? "bg-orange-600"
                        : item?.clock_in
                        ? "bg-emerald-500"
                        : isFuture(item.date)
                        ? ""
                        : isSaturday(item.date) || isSunday(item.date)
                        ? "bg-black"
                        : "bg-rose-500"
                    }`}
                    style={{
                      height: `${
                        item?.clock_in && item?.clock_out ? actualHeight : "100"
                      }%`,
                    }}
                    title={`${format(
                      parseISO(item.date),
                      "MMM dd"
                    )}: ${item.total_hours.toFixed(1)}h / ${
                      item.standard_hours
                    }h`}
                  />
                </div>

                <span className="mt-1 text-[10px] text-slate-500 absolute z-10">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
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
      <div className="mt-3 flex  justify-center  flex-wrap gap-3">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div
            key={status}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1"
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full border border-white shadow-sm",
                statusColors[status as keyof typeof statusColors]
              )}
            />
            <span className="text-[11px] font-medium text-slate-600">
              {label as string}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
