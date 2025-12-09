'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalaryConfig } from '@/types';
import { formatCurrency, calculateHourlyRate } from '@/hooks/useSalary';

interface SalaryConfigInfoProps {
  config: SalaryConfig;
  standardHoursPerDay: number;
}

export function SalaryConfigInfo({ config, standardHoursPerDay }: SalaryConfigInfoProps) {
  const hourlyRate = config.salary_type === 'hourly'
    ? config.base_amount
    : calculateHourlyRate(config.base_amount, standardHoursPerDay);

  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-700">Salary Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Salary Type:</span>
            <span className="font-medium capitalize">{config.salary_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {config.salary_type === 'monthly' ? 'Base Salary:' : 'Hourly Rate:'}
            </span>
            <span className="font-medium">{formatCurrency(config.base_amount, config.currency)}</span>
          </div>
          {config.salary_type === 'monthly' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Effective Hourly Rate:</span>
              <span className="font-medium">{formatCurrency(hourlyRate, config.currency)}/hr</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Overtime Multiplier:</span>
            <span className="font-medium">{config.overtime_multiplier}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Standard Hours/Day:</span>
            <span className="font-medium">{standardHoursPerDay}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
