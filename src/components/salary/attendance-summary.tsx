'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalaryRecord } from '@/types';

interface AttendanceSummaryProps {
  record: SalaryRecord;
}

export function AttendanceSummary({ record }: AttendanceSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attendance & Leave Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Working Days</p>
              <p className="text-2xl font-bold">{record.working_days}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Present</p>
              <p className="text-2xl font-bold text-green-600">{record.days_present}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Days Absent</p>
              <p className="text-2xl font-bold text-red-600">{record.days_absent}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid Leave</p>
              <p className="text-2xl font-bold text-blue-600">{record.paid_leave_days}</p>
            </div>
          </div>

          {record.unpaid_leave_days > 0 && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600">Unpaid Leave Days</p>
              <p className="text-xl font-bold text-orange-600">{record.unpaid_leave_days}</p>
            </div>
          )}

          {(record.late_arrivals > 0 || record.early_leaves > 0) && (
            <div className="pt-3 border-t space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Attendance Notes</h4>
              {record.late_arrivals > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Late Arrivals</span>
                  <span className="font-medium text-yellow-600">{record.late_arrivals}</span>
                </div>
              )}
              {record.early_leaves > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Early Departures</span>
                  <span className="font-medium text-yellow-600">{record.early_leaves}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Hours Worked</span>
              <span className="font-medium">{record.total_hours_worked.toFixed(1)}h</span>
            </div>
            {record.overtime_hours > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Overtime Hours</span>
                <span className="font-medium text-green-600">
                  +{record.overtime_hours.toFixed(1)}h
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
