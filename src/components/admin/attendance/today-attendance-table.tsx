'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TodayAttendanceRecord } from '@/hooks/admin/useAttendance';
import { formatTime, formatHours } from '@/lib/time-utils';
import { UserCircle, Eye } from 'lucide-react';

interface TodayAttendanceTableProps {
  records: TodayAttendanceRecord[];
}

const statusConfig = {
  present: {
    label: 'Present',
    variant: 'success' as const,
    bgColor: 'bg-green-50',
  },
  absent: {
    label: 'Absent',
    variant: 'destructive' as const,
    bgColor: 'bg-gray-50',
  },
  late: {
    label: 'Late Arrival',
    variant: 'warning' as const,
    bgColor: 'bg-yellow-50',
  },
  early_leave: {
    label: 'Early Leave',
    variant: 'warning' as const,
    bgColor: 'bg-orange-50',
  },
  incomplete: {
    label: 'Incomplete',
    variant: 'destructive' as const,
    bgColor: 'bg-purple-50',
  },
};

export function TodayAttendanceTable({ records }: TodayAttendanceTableProps) {
  const router = useRouter();

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">No matching records found.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today's Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time In
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Out
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Worked
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => {
                const config = statusConfig[record.status];
                const fullName = `${record.employee.first_name} ${record.employee.last_name}`;

                return (
                  <tr key={record.employee.id} className={`${config.bgColor} hover:opacity-80`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <UserCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{fullName}</div>
                          {record.employee.employee_id && (
                            <div className="text-xs text-gray-500">
                              ID: {record.employee.employee_id}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.employee.department}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {record.timeEntry?.time_in ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {formatTime(record.timeEntry.time_in)}
                          </div>
                          {record.minutesLate && record.minutesLate > 0 && (
                            <div className="text-xs text-yellow-600">
                              {record.minutesLate} min late
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {record.timeEntry?.time_out ? (
                        <div className="text-sm text-gray-900">
                          {formatTime(record.timeEntry.time_out)}
                        </div>
                      ) : record.status === 'incomplete' ? (
                        <span className="text-sm text-purple-600 font-medium">Missing</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {record.hoursWorked !== null ? (
                        <div className="text-sm font-medium text-gray-900">
                          {formatHours(record.hoursWorked)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/dashboard/employees/${record.employee.id}`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
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
