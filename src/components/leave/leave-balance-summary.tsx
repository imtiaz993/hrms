'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveBalance, LeaveType } from '@/types';
import { Calendar, Heart, DollarSign } from 'lucide-react';

interface LeaveBalanceSummaryProps {
  balances: LeaveBalance[];
}

const leaveTypeConfig: Record<LeaveType, { label: string; icon: any; color: string }> = {
  paid: {
    label: 'Paid Leave',
    icon: DollarSign,
    color: 'text-green-600',
  },
  sick: {
    label: 'Sick Leave',
    icon: Heart,
    color: 'text-red-600',
  },
  unpaid: {
    label: 'Unpaid Leave',
    icon: Calendar,
    color: 'text-gray-600',
  },
};

export function LeaveBalanceSummary({ balances }: LeaveBalanceSummaryProps) {
  const getBalanceForType = (type: LeaveType): LeaveBalance | null => {
    return balances.find((b) => b.leave_type === type) || null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(['paid', 'sick', 'unpaid'] as LeaveType[]).map((type) => {
        const balance = getBalanceForType(type);
        const config = leaveTypeConfig[type];
        const Icon = config.icon;

        return (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </CardHeader>
            <CardContent>
              {balance ? (
                <>
                  <div className="text-2xl font-bold">
                    {balance.remaining_days} / {balance.total_days}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {balance.used_days} days used
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold text-gray-400">
                  {type === 'unpaid' ? 'No limit' : '0 / 0'}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
