"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalaryRecord } from "@/types";

interface AttendanceSummaryProps {
  record: SalaryRecord;
}

export function AttendanceSummary({ record }: AttendanceSummaryProps) {
  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/85 backdrop-blur-sm shadow-sm";

  return (
    <Card className={cardBase}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Attendance &amp; Leave Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Working Days
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {record.working_days}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Days Present
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">
                {record.days_present}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-rose-50/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Days Absent
              </p>
              <p className="mt-1 text-2xl font-semibold text-rose-600">
                {record.days_absent}
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-50/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Paid Leave
              </p>
              <p className="mt-1 text-2xl font-semibold text-indigo-600">
                {record.paid_leave_days}
              </p>
            </div>
          </div>

          {record.unpaid_leave_days > 0 && (
            <div className="space-y-1 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Unpaid Leave Days
              </p>
              <p className="text-xl font-semibold text-amber-600">
                {record.unpaid_leave_days}
              </p>
            </div>
          )}

          {(record.late_arrivals > 0 || record.early_leaves > 0) && (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <h4 className="text-sm font-medium text-slate-700">
                Attendance Notes
              </h4>
              {record.late_arrivals > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Late arrivals</span>
                  <span className="font-medium text-amber-600">
                    {record.late_arrivals}
                  </span>
                </div>
              )}
              {record.early_leaves > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Early departures</span>
                  <span className="font-medium text-amber-600">
                    {record.early_leaves}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total hours worked</span>
              <span className="font-semibold text-slate-900">
                {record.total_hours_worked.toFixed(1)}h
              </span>
            </div>
            {record.overtime_hours > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Overtime hours</span>
                <span className="font-semibold text-emerald-600">
                  +{record.overtime_hours.toFixed(1)}h
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
