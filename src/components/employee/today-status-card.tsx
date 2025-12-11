"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TodayStatus } from "@/types";
import { formatDateFull, formatTime, formatHours } from "@/lib/time-utils";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface TodayStatusCardProps {
  status: TodayStatus;
}

export function TodayStatusCard({ status }: TodayStatusCardProps) {
  const getStatusBadge = () => {
    switch (status.status) {
      case "not_clocked_in":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Not Clocked In
          </Badge>
        );
      case "clocked_in":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Currently Clocked In
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Day Complete
          </Badge>
        );
    }
  };

  const getLateBadge = () => {
    if (!status.isLate) {
      return <Badge variant="success">On Time</Badge>;
    }
    return <Badge variant="warning">Late by {status.lateByMinutes}m</Badge>;
  };

  return (
    <Card className="rounded-2xl border border-slate-100 bg-white/90 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Today&apos;s Status
          </CardTitle>
          {getStatusBadge()}
        </div>
        <p className="text-xs text-slate-500">{formatDateFull(status.date)}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-1 text-sm">
        {status.timeIn && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Clock In:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {formatTime(status.timeIn)}
              </span>
              {getLateBadge()}
            </div>
          </div>
        )}

        {status.timeOut && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Clock Out:</span>
            <span className="font-semibold text-slate-900">
              {formatTime(status.timeOut)}
            </span>
          </div>
        )}

        {status.status === "clocked_in" && status.elapsedHours && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Elapsed Time:</span>
            <span className="font-semibold text-indigo-600">
              {formatHours(status.elapsedHours)}
            </span>
          </div>
        )}

        {status.status === "completed" && status.totalHours && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Hours:</span>
              <span className="font-semibold text-slate-900">
                {formatHours(status.totalHours)}
              </span>
            </div>

            {status.overtimeHours > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Overtime:</span>
                <span className="font-semibold text-emerald-600">
                  {formatHours(status.overtimeHours)}
                </span>
              </div>
            )}
          </>
        )}

        {status.status === "not_clocked_in" && (
          <div className="mt-2 rounded-2xl bg-slate-50/80 p-4 text-center text-sm text-slate-500">
            You haven&apos;t clocked in yet today.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
