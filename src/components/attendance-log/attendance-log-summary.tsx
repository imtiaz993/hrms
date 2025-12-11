"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceLogSummary } from "@/hooks/useAttendanceLog";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface AttendanceLogSummaryProps {
  summary: AttendanceLogSummary;
}

export function AttendanceLogSummaryComponent({
  summary,
}: AttendanceLogSummaryProps) {
  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm";

  const hasOvertime = summary.totalOvertimeHours > 0;
  const hasIncomplete = summary.totalIncompletePunches > 0;

  return (
    <Card className={cardBase}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Monthly Summary
        </CardTitle>
        <p className="mt-1 text-xs text-slate-500">
          High-level overview of your attendance performance this month.
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-1 rounded-2xl bg-emerald-50/60 p-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <p className="text-xs font-medium text-slate-600">Present Days</p>
            </div>
            <p className="text-2xl font-semibold text-emerald-700">
              {summary.totalPresentDays}
            </p>
          </div>

          <div className="space-y-1 rounded-2xl bg-rose-50/60 p-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <XCircle className="h-4 w-4" />
              </span>
              <p className="text-xs font-medium text-slate-600">Absent Days</p>
            </div>
            <p className="text-2xl font-semibold text-rose-700">
              {summary.totalAbsentDays}
            </p>
          </div>

          <div className="space-y-1 rounded-2xl bg-indigo-50/60 p-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Clock className="h-4 w-4" />
              </span>
              <p className="text-xs font-medium text-slate-600">Total Hours</p>
            </div>
            <p className="text-2xl font-semibold text-indigo-700">
              {summary.totalHoursWorked.toFixed(1)}h
            </p>
          </div>

          {hasOvertime && (
            <div className="space-y-1 rounded-2xl bg-purple-50/60 p-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <Clock className="h-4 w-4" />
                </span>
                <p className="text-xs font-medium text-slate-600">Overtime</p>
              </div>
              <p className="text-2xl font-semibold text-purple-700">
                {summary.totalOvertimeHours.toFixed(1)}h
              </p>
            </div>
          )}

          {hasIncomplete && (
            <div className="space-y-1 rounded-2xl bg-amber-50/60 p-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <p className="text-xs font-medium text-slate-600">Incomplete</p>
              </div>
              <p className="text-2xl font-semibold text-amber-700">
                {summary.totalIncompletePunches}
              </p>
            </div>
          )}
        </div>

        {hasIncomplete && (
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <p className="font-semibold mb-0.5">Notice</p>
            <p>
              You have {summary.totalIncompletePunches}{" "}
              {summary.totalIncompletePunches === 1
                ? "incomplete punch"
                : "incomplete punches"}
              . Please remember to clock out at the end of your shift to avoid
              attendance issues.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
