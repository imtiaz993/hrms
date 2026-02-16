'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TodayAttendanceRecord } from '@/hooks/admin/useAttendance';
import { formatTime, formatHours } from '@/lib/time-utils';
import { Eye } from 'lucide-react';

interface TodayAttendanceTableProps {
  records: TodayAttendanceRecord[];
}

const statusConfig = {
  present: {
    label: 'Present',
    variant: 'success' as const,
  },
  absent: {
    label: 'Absent',
    variant: 'destructive' as const,
  },
  late: {
    label: 'Late',
    variant: 'warning' as const,
  },
  early_leave: {
    label: 'Early Leave',
    variant: 'warning' as const,
  },
  incomplete: {
    label: 'Incomplete',
    variant: 'destructive' as const,
  },
};

export function TodayAttendanceTable({ records }: TodayAttendanceTableProps) {
  const router = useRouter();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-white">
        <p className="text-gray-500">No matching records found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Time In</TableHead>
            <TableHead>Time Out</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const config = statusConfig[record.status];
            const fullName = `${record.employee.first_name} ${record.employee.last_name}`;

            return (
              <TableRow key={record.employee.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                      {getInitials(record.employee.first_name, record.employee.last_name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{fullName}</div>
                      {record.employee.employee_id && (
                        <div className="text-xs text-gray-500">
                          ID: {record.employee.employee_id}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">
                  {record.employee.department}
                </TableCell>
                <TableCell>
                  {record.timeEntry?.clock_in ? (
                    <div>
                      <div className="text-sm text-gray-900">
                        {formatTime(record.timeEntry.clock_in)}
                      </div>
                      {record.minutesLate && record.minutesLate > 0 && (
                        <div className="text-xs text-yellow-600">
                          {record.minutesLate} min late
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Missing</span>
                  )}
                </TableCell>
                <TableCell>
                  {record.timeEntry?.clock_out ? (
                    <div className="text-sm text-gray-900">
                      {formatTime(record.timeEntry.clock_out)}
                    </div>
                  ) : record.status === 'incomplete' ? (
                    <span className="text-sm text-gray-400">—</span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {record.total_hours !== null ? (
                    <div className="text-sm font-medium text-gray-900">
                      {formatHours(record.total_hours)}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
