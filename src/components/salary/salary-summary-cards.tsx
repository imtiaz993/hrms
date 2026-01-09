"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalaryRecord } from "@/types";

import { DollarSign, Clock, TrendingUp, Minus } from "lucide-react";

interface SalarySummaryCardsProps {
  record: SalaryRecord;
  currency: string;
}

export function SalarySummaryCards({
  record,
  currency,
}: SalarySummaryCardsProps) {
   function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/85 backdrop-blur-sm shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md";

  const totalDeductions =
    record.unpaid_leave_deduction + record.other_deductions;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Net pay
          </CardTitle>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <DollarSign className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-emerald-600">
            {formatCurrency(record.net_pay, currency)}
          </div>
          {record.is_provisional && (
            <p className="mt-1 text-xs font-medium text-amber-600">
              Provisional calculation
            </p>
          )}
        </CardContent>
      </Card>

      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total hours
          </CardTitle>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Clock className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-slate-900">
            {record.total_hours_worked.toFixed(1)}h
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {record.days_present} days present
          </p>
        </CardContent>
      </Card>

      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Overtime
          </CardTitle>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <TrendingUp className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-slate-900">
            {record.overtime_hours.toFixed(1)}h
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatCurrency(record.overtime_pay, currency)}
          </p>
        </CardContent>
      </Card>

      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Deductions
          </CardTitle>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Minus className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-rose-600">
            {formatCurrency(totalDeductions, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {record.unpaid_leave_days} unpaid day
            {record.unpaid_leave_days === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
