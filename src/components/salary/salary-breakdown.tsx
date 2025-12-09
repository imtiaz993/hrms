'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalaryRecord } from '@/types';
import { formatCurrency } from '@/hooks/useSalary';

interface SalaryBreakdownProps {
  record: SalaryRecord;
  currency: string;
}

export function SalaryBreakdown({ record, currency }: SalaryBreakdownProps) {
  const totalDeductions = record.unpaid_leave_deduction + record.other_deductions;
  const grossPay = record.base_pay + record.overtime_pay + record.allowances;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Salary Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Earnings</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Pay</span>
                <span className="font-medium">{formatCurrency(record.base_pay, currency)}</span>
              </div>
              {record.overtime_pay > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overtime Pay ({record.overtime_hours.toFixed(1)}h)</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(record.overtime_pay, currency)}
                  </span>
                </div>
              )}
              {record.allowances > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Allowances</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(record.allowances, currency)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="font-medium">Gross Pay</span>
              <span className="font-medium">{formatCurrency(grossPay, currency)}</span>
            </div>
          </div>

          {totalDeductions > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Deductions</h4>
              <div className="space-y-1">
                {record.unpaid_leave_deduction > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Unpaid Leave ({record.unpaid_leave_days} days)
                    </span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(record.unpaid_leave_deduction, currency)}
                    </span>
                  </div>
                )}
                {record.other_deductions > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Other Deductions</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(record.other_deductions, currency)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">Total Deductions</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(totalDeductions, currency)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between text-base font-semibold pt-4 border-t-2 border-gray-300">
            <span>Net Pay</span>
            <span className="text-green-600">{formatCurrency(record.net_pay, currency)}</span>
          </div>

          {record.notes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> {record.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
