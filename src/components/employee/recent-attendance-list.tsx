'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AttendanceRow } from '@/types';
import { AlertCircle } from 'lucide-react';

interface RecentAttendanceListProps {
  attendance: AttendanceRow[];
}

export function RecentAttendanceList({ attendance }: RecentAttendanceListProps) {
  if (attendance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No attendance records found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Your time entries will appear here once you start clocking in.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: AttendanceRow['status']) => {
    switch (status) {
      case 'on_time':
        return <Badge variant="success">On Time</Badge>;
      case 'late':
        return <Badge variant="warning">Late</Badge>;
      case 'early_leave':
        return <Badge variant="warning">Early Leave</Badge>;
      case 'incomplete':
        return <Badge variant="secondary">Incomplete</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attendance (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Time In</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Time Out</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Hours</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{row.date}</td>
                  <td className="py-3 px-4 text-sm">{row.timeIn}</td>
                  <td className="py-3 px-4 text-sm">{row.timeOut || '—'}</td>
                  <td className="py-3 px-4 text-sm font-medium">{row.totalHours}</td>
                  <td className="py-3 px-4 text-sm">{getStatusBadge(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
