'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyLogEntry } from '@/hooks/useAttendanceLog';
import { formatTime, formatHours } from '@/lib/time-utils';
import { Clock, AlertCircle } from 'lucide-react';

interface DailyLogTableProps {
  logs: DailyLogEntry[];
}

const statusConfig = {
  present: {
    label: 'Present',
    variant: 'success' as const,
    color: 'text-green-600',
  },
  absent: {
    label: 'Absent',
    variant: 'destructive' as const,
    color: 'text-red-600',
  },
  late: {
    label: 'Late',
    variant: 'warning' as const,
    color: 'text-yellow-600',
  },
  early_leave: {
    label: 'Early Leave',
    variant: 'warning' as const,
    color: 'text-orange-600',
  },
  incomplete: {
    label: 'Incomplete',
    variant: 'destructive' as const,
    color: 'text-red-600',
  },
  not_applicable: {
    label: 'N/A',
    variant: 'secondary' as const,
    color: 'text-gray-400',
  },
};

export function DailyLogTable({ logs }: DailyLogTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span>Daily Attendance Records</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time In
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Out
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => {
                const config = statusConfig[log.status];
                const isActionable = log.status !== 'not_applicable';

                return (
                  <tr
                    key={log.date}
                    className={`hover:bg-gray-50 transition-colors ${
                      !isActionable ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.dayName}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {log.timeIn ? (
                        <div className="text-sm text-gray-900">
                          {formatTime(log.timeIn)}
                          {log.isLate && (
                            <AlertCircle className="inline h-3 w-3 ml-1 text-yellow-600" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {log.status === 'incomplete' ? (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-red-600 font-medium">Missing</span>
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        </div>
                      ) : log.timeOut ? (
                        <div className="text-sm text-gray-900">
                          {formatTime(log.timeOut)}
                          {log.isEarlyLeave && (
                            <AlertCircle className="inline h-3 w-3 ml-1 text-orange-600" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {log.totalHours !== null ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatHours(log.totalHours)}
                          </div>
                          {log.overtimeHours > 0 && (
                            <div className="text-xs text-blue-600">
                              +{formatHours(log.overtimeHours)} OT
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
