"use client";

import { useMemo, useState } from "react";
import {
  format,
  parseISO,
  isSunday,
  isSaturday,
  isFuture,
  startOfDay,
  isBefore,
} from "date-fns";
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
  standardHoursPerDay: number;
  chartData: any;
  isLoading: any;
}

const ChartSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between rounded-2xl">
      <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
      <div className="h-9 w-44 rounded-md bg-slate-200 animate-pulse" />
    </div>

    <div className="relative h-36 flex items-end justify-between gap-1 rounded-2xl">
      {Array.from({ length: 33 }).map((_, i) => (
        <div
          key={i}
          className="relative flex flex-1 flex-col justify-end h-full"
        >
          <div
            className="w-full rounded-t-sm bg-slate-200/70 animate-pulse"
            style={{ height: `${33 + (i % 7) * 10}%` }}
          />
          <div className="mt-1 h-2 w-3 rounded bg-slate-200 animate-pulse self-center" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-6 w-20 rounded bg-slate-200 animate-pulse" />
        </div>
      ))}
    </div>

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

function boolLabel(v: any) {
  return v ? "Yes" : "No";
}

export function WorkingHoursChartCard({
  standardHoursPerDay,
  chartData,
  isLoading,
}: WorkingHoursChartCardProps) {
  const [hovered, setHovered] = useState<any | null>(null);

  const totals = useMemo(() => {
    const today = startOfDay(new Date());

    const scheduled = chartData.reduce((sum: number, item: any) => {
      const d = startOfDay(new Date(item.date)); // item.date can be "yyyy-MM-dd"
      const isWeekend = isSaturday(d) || isSunday(d);

      if (isWeekend) return sum;
      if (!isBefore(d, today)) return sum; // only past days

      return sum + (Number(item.standard_hours) || 0);
    }, 0);

    const worked = chartData.reduce(
      (sum: number, item: any) => sum + (Number(item.total_hours) || 0),
      0,
    );

    return { scheduled, worked, difference: worked - scheduled };
  }, [chartData]);

  const tooltip = useMemo(() => {
    if (!hovered) return null;

    const weekend = isSaturday(hovered.date) || isSunday(hovered.date);
    const future = isFuture(hovered.date);

    const dateStr = format(parseISO(hovered.date), "MMM dd, yyyy");

    // off/absent if no clock_in (and not weekend/future)
    const isAbsent = !weekend && !future && !hovered?.clock_in;

    const lines: Array<{ k: string; v: string }> = [{ k: "Date", v: dateStr }];

    if (weekend) {
      lines.push({ k: "Status", v: "Weekend" });
      return lines;
    }

    if (future) {
      lines.push({ k: "Status", v: "Future" });
      return lines;
    }

    if (isAbsent) {
      lines.push({ k: "Status", v: "Absent" });
      return lines;
    }

    // present (clock_in exists)
    lines.push({ k: "Status", v: "Present" });

    if (hovered.clock_in)
      lines.push({
        k: "Clock In",
        v: format(new Date(hovered.clock_in), "h:mm a"),
      });
    if (hovered.clock_out)
      lines.push({
        k: "Clock Out",
        v: format(new Date(hovered.clock_out), "h:mm a"),
      });

    // Only show worked hours if clock_out exists
    if (hovered.clock_in && hovered.clock_out) {
      const hrs =
        typeof hovered.total_hours === "number"
          ? hovered.total_hours
          : Number(hovered.total_hours ?? 0);
      lines.push({ k: "Worked Hours", v: `${hrs.toFixed(1)}h` });
    }

    lines.push({ k: "Late", v: boolLabel(hovered.is_late) });
    lines.push({ k: "Early Leave", v: boolLabel(hovered.is_early_leave) });

    return lines;
  }, [hovered]);

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
      <div className="space-y-3">
        <div className="relative h-36 flex items-end justify-between gap-1 rounded-2xl">
          {chartData.map((item: any, index: any) => {
            const weekend = isSunday(item.date) || isSaturday(item.date);
            const future = isFuture(item.date);

            const actualHeight = (item.total_hours / item.standard_hours) * 100;

            const baseHeight = `${
              future || weekend
                ? 33
                : !item.clock_in || !item.clock_out
                  ? 33
                  : (item.standard_hours / standardHoursPerDay) * 100
            }%`;

            const fillHeight = `${item?.clock_in && item?.clock_out ? actualHeight : 100}%`;

            const fillColor = item.is_late
              ? "bg-yellow-400"
              : item.is_early_leave
                ? "bg-orange-600"
                : item?.clock_in
                  ? "bg-emerald-500"
                  : future
                    ? ""
                    : weekend
                      ? "bg-black"
                      : "bg-rose-500";

            return (
              <div
                key={index}
                className="relative flex flex-1 flex-col justify-end items-center h-full"
              >
                <div
                  className={`relative bottom-0 w-full rounded-t-sm cursor-pointer ${
                    weekend ? "bg-black" : "bg-slate-200/80"
                  }`}
                  onMouseEnter={() => setHovered(item)}
                  onMouseMove={() => setHovered(item)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ height: baseHeight }}
                >
                  {/* Hover target = the fill bar */}
                  <div
                    className={`absolute bottom-0 w-full rounded-t-sm border border-white/40 ${fillColor}`}
                    style={{ height: fillHeight }}
                  />
                </div>

                <span className="mt-1 text-[10px] text-white font-semibold absolute z-10">
                  {item.day}
                </span>

                {/* Tooltip */}
                {hovered?.date === item.date && tooltip && (
                  <div className="pointer-events-none absolute -top-2 left-1/2 z-50 w-56 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-700 shadow-lg backdrop-blur">
                    <div className="space-y-1">
                      {tooltip.map((row, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-3"
                        >
                          <span className="text-slate-500">{row.k}</span>
                          <span className="font-medium text-slate-900 text-right">
                            {row.v}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-slate-200 bg-white/95" />
                  </div>
                )}
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
