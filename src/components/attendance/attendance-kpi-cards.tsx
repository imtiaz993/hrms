"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceAnalytics } from "@/types";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

interface AttendanceKPICardsProps {
  cardBase: any;
  analytics: AttendanceAnalytics;
  isLoading: boolean;
}

const KpiSkeletonCard = ({ cardBase }: { cardBase: any }) => {
  return (
    <Card className={cardBase}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
        <div className="h-7 w-7 rounded-full bg-slate-200 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-7 w-14 rounded bg-slate-200 animate-pulse" />
        <div className="mt-2 h-3 w-32 rounded bg-slate-200 animate-pulse" />
      </CardContent>
    </Card>
  );
};

export function AttendanceKPICards({
  cardBase,
  analytics,
  isLoading,
}: AttendanceKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiSkeletonCard cardBase={cardBase} />
        <KpiSkeletonCard cardBase={cardBase} />
        <KpiSkeletonCard cardBase={cardBase} />
        <KpiSkeletonCard cardBase={cardBase} />
        <KpiSkeletonCard cardBase={cardBase} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Present Days
          </CardTitle>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-emerald-600">
            {analytics.presentDays}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Avg {analytics.averageHoursPerDay.toFixed(1)}h per day
          </p>
        </CardContent>
      </Card>

      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Absent Days
          </CardTitle>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <XCircle className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-rose-600">
            {analytics.absentDays}
          </div>
          <p className="mt-1 text-xs text-slate-500">Days not clocked in</p>
        </CardContent>
      </Card>

      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            On-time days
          </CardTitle>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-emerald-600">
            {Math.max(analytics.presentDays - analytics.lateArrivals, 0)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Days on-time</p>
        </CardContent>
      </Card>

      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Late Arrivals
          </CardTitle>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-amber-600">
            {analytics.lateArrivals}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Clocked in after shift start
          </p>
        </CardContent>
      </Card>

      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Early Leaves
          </CardTitle>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <AlertTriangle className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-orange-600">
            {analytics.earlyLeaves}
          </div>
          <p className="mt-1 text-xs text-slate-500">Left before shift end</p>
        </CardContent>
      </Card>
    </div>
  );
}
