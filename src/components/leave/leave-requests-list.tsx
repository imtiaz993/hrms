'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeaveRequest, LeaveStatus, LeaveType } from '@/types';
import { useCancelLeaveRequest } from '@/hooks/useLeave';
import { formatDate } from '@/lib/time-utils';
import { Calendar, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { isAfter, parseISO } from 'date-fns';

interface LeaveRequestsListProps {
  requests: LeaveRequest[];
  employeeId: string;
}

const statusConfig: Record<LeaveStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' }> = {
  pending: {
    label: 'Pending',
    variant: 'secondary',
  },
  approved: {
    label: 'Approved',
    variant: 'success',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
  },
};

const leaveTypeLabels: Record<LeaveType, string> = {
  paid: 'Paid',
  sick: 'Sick',
  unpaid: 'Unpaid',
};

export function LeaveRequestsList({ requests, employeeId }: LeaveRequestsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const cancelMutation = useCancelLeaveRequest();

  const handleCancel = async (requestId: string) => {
    setError('');
    setCancellingId(requestId);

    try {
      await cancelMutation.mutateAsync({ requestId, employeeId });
    } catch (err: any) {
      setError(err.message || 'Failed to cancel leave request.');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancelRequest = (request: LeaveRequest): boolean => {
    if (request.status !== 'pending') return false;
    const startDate = parseISO(request.start_date);
    const today = new Date();
    return isAfter(startDate, today) || startDate.toDateString() === today.toDateString();
  };

  const formatDuration = (request: LeaveRequest): string => {
    if (request.is_half_day) return 'Half day';
    if (request.total_days === 1) return '1 day';
    return `${request.total_days} days`;
  };

  const formatDateRange = (request: LeaveRequest): string => {
    if (request.start_date === request.end_date) {
      return formatDate(request.start_date);
    }
    return `${formatDate(request.start_date)} - ${formatDate(request.end_date)}`;
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">You haven't requested any leave yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Use the form above to request your first leave.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">My Leave Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Dates</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    {formatDateRange(request)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {formatDuration(request)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {leaveTypeLabels[request.leave_type]}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <Badge variant={statusConfig[request.status].variant}>
                      {statusConfig[request.status].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                    {request.reason || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {canCancelRequest(request) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(request.id)}
                        disabled={cancellingId === request.id}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {cancellingId === request.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.some((r) => r.status === 'approved' && r.approver_comment) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-2">Approver Comments:</p>
            {requests
              .filter((r) => r.status === 'approved' && r.approver_comment)
              .map((request) => (
                <div key={request.id} className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">{formatDateRange(request)}:</span>{' '}
                  {request.approver_comment}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
