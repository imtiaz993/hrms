"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DailyAttendance } from "@/hooks/useAttendanceAnalytics";
import { formatDate, formatTime, formatHours } from "@/lib/time-utils";
import { X } from "lucide-react";

interface DailyDetailsDialogProps {
  day: DailyAttendance | null;
  onClose: () => void;
}

const statusConfig = {
  present: { label: "Present", variant: "success" as const },
  absent: { label: "Absent", variant: "destructive" as const },
  late: { label: "Late Arrival", variant: "warning" as const },
  early_leave: { label: "Early Leave", variant: "warning" as const },
  future: { label: "Future Date", variant: "secondary" as const },
};

export function DailyDetailsDialog({ day, onClose }: DailyDetailsDialogProps) {
  if (!day) return null;

  const config = statusConfig[day.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Daily attendance details"
    >
      <Card className="w-full max-w-md rounded-2xl border border-slate-100 bg-white/90 shadow-xl">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Daily Attendance Details
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(day.date)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close daily details"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pb-5">
          <div>
            <p className="mb-1 text-sm text-slate-600">Status</p>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>

          {day.status === "absent" && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5">
              <p className="text-sm text-rose-900">
                No attendance record was found for this date.
              </p>
            </div>
          )}

          {day.status === "future" && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-sm text-slate-700">
                This date is in the future.
              </p>
            </div>
          )}

          {day.timeIn && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-sm text-slate-600">Time In</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatTime(day.timeIn)}
                  </p>
                  {day.isLate && (
                    <Badge variant="warning" className="mt-1">
                      Late
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600">Time Out</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {day.timeOut ? formatTime(day.timeOut) : "—"}
                  </p>
                  {day.isEarlyLeave && (
                    <Badge variant="warning" className="mt-1">
                      Early
                    </Badge>
                  )}
                </div>
              </div>

              {day.totalHours !== undefined && (
                <div>
                  <p className="mb-1 text-sm text-slate-600">
                    Total Hours Worked
                  </p>
                  <p className="text-2xl font-semibold text-indigo-600">
                    {formatHours(day.totalHours)}
                  </p>
                </div>
              )}

              {(day.isLate || day.isEarlyLeave) && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                  <p className="mb-1 text-sm font-semibold text-amber-900">
                    Attendance notes
                  </p>
                  <ul className="space-y-1 text-sm text-amber-800">
                    {day.isLate && (
                      <li>• Clocked in after shift start time.</li>
                    )}
                    {day.isEarlyLeave && (
                      <li>• Clocked out before shift end time.</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}

          <Button
            onClick={onClose}
            className="mt-2 w-full rounded-full text-sm font-medium"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
