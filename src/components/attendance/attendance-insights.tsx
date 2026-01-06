"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceAnalytics } from "@/types";

interface AttendanceInsightsProps {
  analytics: AttendanceAnalytics;
}

export function AttendanceInsights({ analytics }: AttendanceInsightsProps) {
  const now = new Date();
  const year = analytics.year ?? now.getFullYear();
  const month = analytics.month ?? now.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  let weekdayscount = 0;
  const todayDate = now.getDate();
  for (let day = 1; day <= todayDate; day++) {
    const currentDate = new Date(year, month, day);
    const dayofweek = currentDate.getDay();
    if (dayofweek !== 0 && dayofweek !== 6) {
      weekdayscount++;
    }
  }

  const presentPercentage =
    totalDays > 0 ? (analytics.presentDays / weekdayscount) * 100 : 0;
  const absentPercentage =
    totalDays > 0 ? (analytics.absentDays / weekdayscount) * 100 : 0;

  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className={cardBase}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Attendance Distribution
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Overview of your presence vs. absence for the selected period.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Present Days</span>
              <span className="font-semibold text-emerald-600">
                {analytics.presentDays} ({presentPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-[width] duration-300"
                style={{ width: `${presentPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Absent Days</span>
              <span className="font-semibold text-rose-600">
                {analytics.absentDays} ({absentPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-600 transition-[width] duration-300"
                style={{ width: `${absentPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cardBase}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Punctuality Score
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Calculated based on on-time arrivals and full shifts.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col items-center py-3 text-center">
            <div className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <div>
                <div className="text-4xl font-bold leading-none"></div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em]">
                  Score
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Aim for a punctuality score of 90%+ to maintain an excellent
              record.
            </p>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">On-time days</span>
              <span className="font-semibold text-emerald-600">
                {Math.max(analytics.presentDays - analytics.lateArrivals, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Late arrivals</span>
              <span className="font-semibold text-amber-600">
                {analytics.lateArrivals}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Early leaves</span>
              <span className="font-semibold text-orange-600">
                {analytics.earlyLeaves}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
