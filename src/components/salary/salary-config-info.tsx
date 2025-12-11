'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalaryConfig } from '@/types';
import { formatCurrency, calculateHourlyRate } from '@/hooks/useSalary';

interface SalaryConfigInfoProps {
  config: SalaryConfig;
  standardHoursPerDay: number;
}

export function SalaryConfigInfo({
  config,
  standardHoursPerDay,
}: SalaryConfigInfoProps) {
  const hourlyRate =
    config.salary_type === 'hourly'
      ? config.base_amount
      : calculateHourlyRate(config.base_amount, standardHoursPerDay);

  const cardBase =
    'relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 backdrop-blur-sm';

  return (
    <Card className={cardBase}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-900">
          Salary Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Salary type</span>
            <span className="font-medium capitalize text-slate-900">
              {config.salary_type}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">
              {config.salary_type === 'monthly' ? 'Base salary' : 'Hourly rate'}
            </span>
            <span className="font-medium text-slate-900">
              {formatCurrency(config.base_amount, config.currency)}
            </span>
          </div>

          {config.salary_type === 'monthly' && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Effective hourly rate</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(hourlyRate, config.currency)}/hr
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span
              className="text-slate-600"
            >
              Overtime multiplier
            </span>
            <span className="font-medium text-slate-900">
              {config.overtime_multiplier}x
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Standard hours per day</span>
            <span className="font-medium text-slate-900">
              {standardHoursPerDay}h
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
