"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodayStatus } from "@/types";
import { formatTime } from "@/lib/time-utils";
import { LogIn, LogOut } from "lucide-react";

interface TodayStatusCardProps {
  status: TodayStatus;
}

export function TodayStatusCard({ status }: TodayStatusCardProps) {
  const clockInValue =
    status.timeIn || status.clockIn || (status as any).clock_in || null;

  const clockOutValue =
    status.timeOut || status.clockOut || (status as any).clock_out || null;

  const SummaryChip = ({
    icon,
    label,
    value,
    tone = "slate",
  }: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    tone?: "slate" | "indigo" | "emerald" | "amber";
  }) => {
    const toneMap: any = {
      slate: "bg-slate-50 border-slate-200 text-slate-700",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
      amber: "bg-amber-50 border-amber-200 text-amber-700",
    };

    return (
      <div
        className={`rounded-2xl border px-3 py-2 ${toneMap[tone]} flex items-center gap-2`}
      >
        <span className="shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] leading-4 opacity-80">{label}</p>
          <p className="text-sm font-semibold leading-5 truncate">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="rounded-2xl border border-slate-100 bg-white/90 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-slate-900">
              Today&apos;s Status
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2 text-sm">
        {/* Top summary chips */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SummaryChip
            icon={<LogIn className="h-4 w-4" />}
            label="Clock In"
            value={clockInValue ? formatTime(clockInValue) : "—"}
            tone={
              clockInValue ? (status.isLate ? "amber" : "emerald") : "slate"
            }
          />
          <SummaryChip
            icon={<LogOut className="h-4 w-4" />}
            label="Clock Out"
            value={clockOutValue ? formatTime(clockOutValue) : "—"}
            tone={clockOutValue ? "emerald" : "slate"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
