'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalaryRecord } from '@/types';


interface SalaryBreakdownProps {
  record: SalaryRecord;
  currency: string;
}

export function SalaryBreakdown({ record, currency }: SalaryBreakdownProps) {
  const totalDeductions = record.unpaid_leave_deduction + record.other_deductions;
  const grossPay = record.base_pay + record.overtime_pay + record.allowances;
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
  const cardBase =
    'relative overflow-hidden rounded-2xl border border-slate-100 bg-white/85 backdrop-blur-sm shadow-sm';

  return (
    <Card className={cardBase}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Salary Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5 text-sm">
          {/* Earnings */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Earnings
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Base pay</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(record.base_pay, currency)}
                </span>
              </div>

              {record.overtime_pay > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Overtime pay ({record.overtime_hours.toFixed(1)}h)
                  </span>
                  <span className="font-medium text-emerald-600">
                    +{formatCurrency(record.overtime_pay, currency)}
                  </span>
                </div>
              )}

              {record.allowances > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Allowances</span>
                  <span className="font-medium text-emerald-600">
                    +{formatCurrency(record.allowances, currency)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Gross pay
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(grossPay, currency)}
              </span>
            </div>
          </div>

          {/* Deductions */}
          {totalDeductions > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Deductions
              </h4>
              <div className="space-y-1.5">
                {record.unpaid_leave_deduction > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">
                      Unpaid leave ({record.unpaid_leave_days} day
                      {record.unpaid_leave_days === 1 ? '' : 's'})
                    </span>
                    <span className="font-medium text-rose-600">
                      -{formatCurrency(record.unpaid_leave_deduction, currency)}
                    </span>
                  </div>
                )}
                {record.other_deductions > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Other deductions</span>
                    <span className="font-medium text-rose-600">
                      -{formatCurrency(record.other_deductions, currency)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Total deductions
                </span>
                <span className="text-sm font-semibold text-rose-600">
                  -{formatCurrency(totalDeductions, currency)}
                </span>
              </div>
            </div>
          )}

          {/* Net Pay */}
          <div className="flex items-center justify-between border-t-2 border-slate-200 pt-3 text-base font-semibold">
            <span className="text-slate-900">Net pay</span>
            <span className="text-emerald-600">
              {formatCurrency(record.net_pay, currency)}
            </span>
          </div>

          {record.notes && (
            <div className="mt-3 rounded-2xl bg-indigo-50 px-3 py-2.5 text-xs text-indigo-900">
              <p>
                <span className="font-semibold">Note:</span> {record.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
