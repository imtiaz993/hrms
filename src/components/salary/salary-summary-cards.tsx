'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalaryRecord } from '@/types';
import { formatCurrency } from '@/hooks/useSalary';
import { DollarSign, Clock, TrendingUp, Minus } from 'lucide-react';

interface SalarySummaryCardsProps {
  record: SalaryRecord;
  currency: string;
}

export function SalarySummaryCards({ record, currency }: SalarySummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(record.net_pay, currency)}
          </div>
          {record.is_provisional && (
            <p className="text-xs text-yellow-600 mt-1">Provisional</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {record.total_hours_worked.toFixed(1)}h
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {record.days_present} days present
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overtime</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {record.overtime_hours.toFixed(1)}h
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(record.overtime_pay, currency)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deductions</CardTitle>
          <Minus className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(record.unpaid_leave_deduction + record.other_deductions, currency)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {record.unpaid_leave_days} unpaid days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
