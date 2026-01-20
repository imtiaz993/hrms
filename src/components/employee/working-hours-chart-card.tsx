"use client";

import { useMemo } from "react";
import { format, parseISO, isSunday, isSaturday, isFuture } from "date-fns";
import { cn } from "@/lib/utils";

const statusLabels: any = {
  present: "Present",
  absent: "Absent",
  late: "Late Arrival",
  early_leave: "Early Leave",
  future: "Future",
  weekend: "Weekend",
};

const statusColors: any = {
  present: "bg-emerald-500/90 hover:bg-emerald-600",
  absent: "bg-rose-500/90 hover:bg-rose-600",
  late: "bg-amber-400/90 hover:bg-amber-500",
  early_leave: "bg-orange-500/90 hover:bg-orange-600",
  future: "bg-slate-200 hover:bg-slate-300",
  weekend: "bg-black hover:bg-gray-500",
};

interface WorkingHoursChartCardProps {
  selectedMonth: number;
  selectedYear: number;
  standardHoursPerDay: number;
  onMonthChange: (month: number, year: number) => void;
  availableMonths: Array<{ month: number; year: number; label: string }>;
  chartData: any;
  isLoading: any;
}

const ChartSkeleton = () => (
  <div className="space-y-4">
    {/* Month select skeleton */}
    <div className="flex items-center justify-between rounded-2xl">
      <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
      <div className="h-9 w-44 rounded-md bg-slate-200 animate-pulse" />
    </div>

    {/* Bars skeleton */}
    <div className="relative h-36 flex items-end justify-between gap-1 rounded-2xl">
      {Array.from({ length: 31 }).map((_, i) => (
        <div
          key={i}
          className="relative flex flex-1 flex-col justify-end h-full"
        >
          <div
            className="w-full rounded-t-sm bg-slate-200/70 animate-pulse"
            style={{ height: `${20 + (i % 7) * 10}%` }}
          />
          <div className="mt-1 h-2 w-3 rounded bg-slate-200 animate-pulse self-center" />
        </div>
      ))}
    </div>

    {/* Totals skeleton */}
    <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-6 w-20 rounded bg-slate-200 animate-pulse" />
        </div>
      ))}
    </div>

    {/* Legend skeleton */}
    <div className="mt-3 flex justify-center flex-wrap gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="inline-flex items-center gap-2 rounded-full">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

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
      (sum: any, item: any) =>
        isSaturday(item.date) || isSunday(item.date)
          ? sum + 0
          : sum + item.standard_hours,
      0,
    );
    const worked = chartData.reduce(
      (sum: any, item: any) => sum + item.total_hours,
      0,
    );
    return {
      scheduled,
      worked,
      difference: worked - scheduled,
    };
  }, [chartData]);

  if (isLoading) return <ChartSkeleton />;

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
        <div className="flex items-center justify-between rounded-2xl">
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
        <div className="relative h-36 flex items-end justify-between gap-1 rounded-2xl">
          {chartData.map((item: any, index: any) => {
            const actualHeight = (item.total_hours / item.standard_hours) * 100;

            return (
              <div
                key={index}
                className="relative flex flex-1 flex-col justify-end items-center h-full"
              >
                <div
                  className={`relative bottom-0 w-full rounded-t-sm ${
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
                    className={`absolute bottom-0 w-full rounded-t-sm border border-white/40 ${
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
                    title={`${format(parseISO(item.date), "MMM dd")}: ${item.total_hours.toFixed(
                      1,
                    )}h / ${item.standard_hours}h`}
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

      <div className="mt-3 flex justify-center flex-wrap gap-3">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div
            key={status}
            className="inline-flex items-center gap-2 rounded-full"
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full border border-white shadow-sm",
                statusColors[status as keyof typeof statusColors],
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
