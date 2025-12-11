"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveBalance, LeaveType } from "@/types";
import { Calendar, Heart, DollarSign } from "lucide-react";

interface LeaveBalanceSummaryProps {
  balances: LeaveBalance[];
}

const leaveTypeConfig: Record<
  LeaveType,
  { label: string; icon: any; color: string; bg: string; chip: string }
> = {
  paid: {
    label: "Paid Leave",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50/70",
    chip: "bg-emerald-100 text-emerald-700",
  },
  sick: {
    label: "Sick Leave",
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50/70",
    chip: "bg-rose-100 text-rose-700",
  },
  unpaid: {
    label: "Unpaid Leave",
    icon: Calendar,
    color: "text-slate-600",
    bg: "bg-slate-50/80",
    chip: "bg-slate-100 text-slate-700",
  },
};

export function LeaveBalanceSummary({ balances }: LeaveBalanceSummaryProps) {
  const getBalanceForType = (type: LeaveType): LeaveBalance | null =>
    balances.find((b) => b.leave_type === type) || null;

  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {(["paid", "sick", "unpaid"] as LeaveType[]).map((type) => {
        const balance = getBalanceForType(type);
        const config = leaveTypeConfig[type];
        const Icon = config.icon;

        const usedDays = balance?.used_days ?? 0;
        const totalDays = balance?.total_days ?? 0;
        const pct =
          totalDays > 0 ? Math.min(100, (usedDays / totalDays) * 100) : 0;

        return (
          <Card key={type} className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {config.label}
                </CardTitle>
                <p className="mt-1 text-[11px] text-slate-400">
                  {type === "unpaid"
                    ? "No fixed limit"
                    : "Track and plan your upcoming days off"}
                </p>
              </div>
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${config.bg}`}
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
              </span>
            </CardHeader>

            <CardContent className="space-y-3 pb-4">
              {balance ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-semibold text-slate-900">
                      {balance.remaining_days}
                      <span className="text-sm text-slate-400">
                        {" "}
                        / {balance.total_days}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${config.chip}`}
                    >
                      {usedDays} used
                    </span>
                  </div>

                  {totalDays > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Usage</span>
                        <span className="font-semibold text-slate-700">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-[width] duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-slate-300">
                    {type === "unpaid" ? "No limit" : "0 / 0"}
                  </div>
                  <p className="text-xs text-slate-400">
                    {type === "unpaid"
                      ? "Unpaid leave is usually unlimited but unpaid."
                      : "No balance configured yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
