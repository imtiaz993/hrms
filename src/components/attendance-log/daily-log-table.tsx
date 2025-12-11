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
    color: 'text-emerald-600',
  },
  absent: {
    label: 'Absent',
    variant: 'destructive' as const,
    color: 'text-rose-600',
  },
  late: {
    label: 'Late',
    variant: 'warning' as const,
    color: 'text-amber-600',
  },
  early_leave: {
    label: 'Early Leave',
    variant: 'warning' as const,
    color: 'text-orange-600',
  },
  incomplete: {
    label: 'Incomplete',
    variant: 'destructive' as const,
    color: 'text-rose-600',
  },
  not_applicable: {
    label: 'N/A',
    variant: 'secondary' as const,
    color: 'text-slate-400',
  },
};

export function DailyLogTable({ logs }: DailyLogTableProps) {
  const cardBase =
    'relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm';

  return (
    <Card className={cardBase}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
            <Clock className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Daily Attendance Records
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Detailed view of your clock-in, clock-out, and hours.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Day
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Time In
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Time Out
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Total Hours
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {logs.map((log) => {
                const config = statusConfig[log.status];
                const isActionable = log.status !== 'not_applicable';

                return (
                  <tr
                    key={log.date}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      !isActionable ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      <div className="text-sm font-medium text-slate-900">{log.dayName}</div>
                      <p className="text-[11px] text-slate-400">{log.date}</p>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      {log.timeIn ? (
                        <div className="flex items-center text-sm text-slate-900">
                          {formatTime(log.timeIn)}
                          {log.isLate && (
                            <AlertCircle className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      {log.status === 'incomplete' ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                          <span>Missing</span>
                          <AlertCircle className="h-3.5 w-3.5" />
                        </div>
                      ) : log.timeOut ? (
                        <div className="flex items-center text-sm text-slate-900">
                          {formatTime(log.timeOut)}
                          {log.isEarlyLeave && (
                            <AlertCircle className="ml-1.5 h-3.5 w-3.5 text-orange-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      {log.totalHours !== null ? (
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-slate-900">
                            {formatHours(log.totalHours)}
                          </div>
                          {log.overtimeHours > 0 && (
                            <div className="text-[11px] font-medium text-indigo-600">
                              +{formatHours(log.overtimeHours)} OT
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      <Badge
                        variant={config.variant}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        {config.label}
                      </Badge>
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
