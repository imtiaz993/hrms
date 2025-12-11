"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyAttendance } from "@/hooks/useAttendanceAnalytics";
import { format, parseISO, startOfMonth, getDay } from "date-fns";
import { cn } from "@/lib/utils";

interface AttendanceHeatmapProps {
  dailyAttendance: DailyAttendance[];
  month: number;
  year: number;
  onDayClick: (day: DailyAttendance) => void;
}

const statusColors = {
  present: "bg-emerald-500/90 hover:bg-emerald-600",
  absent: "bg-rose-500/90 hover:bg-rose-600",
  late: "bg-amber-400/90 hover:bg-amber-500",
  early_leave: "bg-orange-500/90 hover:bg-orange-600",
  future: "bg-slate-200 hover:bg-slate-300",
};

const statusLabels = {
  present: "Present",
  absent: "Absent",
  late: "Late Arrival",
  early_leave: "Early Leave",
  future: "Future",
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

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm";

  return (
    <Card className={cardBase}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Monthly Attendance Heatmap
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Click a day to view detailed attendance info.
            </p>
          </div>
          <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
            {format(new Date(year, month - 1), "MMM yyyy")}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
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
                {label}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
            >
              {day}
            </div>
          ))}

          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {dailyAttendance.map((day) => {
            const date = parseISO(day.date);
            const dayNumber = format(date, "d");

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onDayClick(day)}
                disabled={day.status === "future"}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl text-[11px] font-semibold text-white shadow-xs transition-all duration-150",
                  statusColors[day.status],
                  day.status === "future" &&
                    "cursor-not-allowed opacity-40 hover:bg-slate-200 hover:opacity-40",
                  "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                )}
                title={`${dayNumber} - ${statusLabels[day.status]}`}
                aria-label={`${statusLabels[day.status]} on ${format(
                  date,
                  "MMMM d, yyyy"
                )}`}
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
