'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TodayStatus } from '@/types';
import { formatDateFull, formatTime, formatHours } from '@/lib/time-utils';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface TodayStatusCardProps {
  status: TodayStatus;
}

export function TodayStatusCard({ status }: TodayStatusCardProps) {
  const getStatusBadge = () => {
    switch (status.status) {
      case 'not_clocked_in':
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Clocked In
          </Badge>
        );
      case 'clocked_in':
        return (
          <Badge variant="default">
            <Clock className="h-3 w-3 mr-1" />
            Currently Clocked In
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Day Complete
          </Badge>
        );
    }
  };

  const getLateBadge = () => {
    if (!status.isLate) {
      return <Badge variant="success">On Time</Badge>;
    }
    return (
      <Badge variant="warning">
        Late by {status.lateByMinutes}m
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Status</CardTitle>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-gray-500">{formatDateFull(status.date)}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {status.timeIn && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Clock In:</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatTime(status.timeIn)}</span>
                {status.timeIn && getLateBadge()}
              </div>
            </div>
          )}

          {status.timeOut && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Clock Out:</span>
              <span className="font-semibold">{formatTime(status.timeOut)}</span>
            </div>
          )}

          {status.status === 'clocked_in' && status.elapsedHours && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Elapsed Time:</span>
              <span className="font-semibold text-blue-600">
                {formatHours(status.elapsedHours)}
              </span>
            </div>
          )}

          {status.status === 'completed' && status.totalHours && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Hours:</span>
                <span className="font-semibold">{formatHours(status.totalHours)}</span>
              </div>

              {status.overtimeHours > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overtime:</span>
                  <span className="font-semibold text-green-600">
                    {formatHours(status.overtimeHours)}
                  </span>
                </div>
              )}
            </>
          )}

          {status.status === 'not_clocked_in' && (
            <div className="text-center py-4">
              <p className="text-gray-500">You haven't clocked in yet today.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
