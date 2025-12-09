'use client';

import { useState } from 'react';
import { LeaveRequestWithEmployee } from '@/hooks/admin/useLeaveRequests';
import { useApproveLeaveRequest, useRejectLeaveRequest } from '@/hooks/admin/useLeaveRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/time-utils';
import { X, CheckCircle2, XCircle, User, Calendar, FileText } from 'lucide-react';

interface LeaveApprovalModalProps {
  request: LeaveRequestWithEmployee;
  onClose: () => void;
}

const leaveTypeLabels: Record<string, string> = {
  paid: 'Paid Leave',
  sick: 'Sick Leave',
  unpaid: 'Unpaid Leave',
};

const statusConfig = {
  pending: { label: 'Pending', variant: 'warning' as const },
  approved: { label: 'Approved', variant: 'success' as const },
  rejected: { label: 'Rejected', variant: 'destructive' as const },
  cancelled: { label: 'Cancelled', variant: 'secondary' as const },
};

export function LeaveApprovalModal({ request, onClose }: LeaveApprovalModalProps) {
  const [adminComment, setAdminComment] = useState('');
  const approveRequest = useApproveLeaveRequest();
  const rejectRequest = useRejectLeaveRequest();

  const handleApprove = async () => {
    try {
      await approveRequest.mutateAsync({ requestId: request.id, adminComment });
      onClose();
    } catch (error) {
      alert('Failed to approve leave request');
    }
  };

  const handleReject = async () => {
    if (!adminComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectRequest.mutateAsync({ requestId: request.id, adminComment });
      onClose();
    } catch (error) {
      alert('Failed to reject leave request');
    }
  };

  const isPending = request.status === 'pending';
  const statusInfo = statusConfig[request.status];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Leave Request Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Employee Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">
                    {request.employee.first_name} {request.employee.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{request.employee.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{request.employee.email}</p>
                </div>
                {request.employee.employee_id && (
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-medium">{request.employee.employee_id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>Leave Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Leave Type</p>
                  <p className="font-medium">{leaveTypeLabels[request.leave_type]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">{formatDate(request.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-medium">{formatDate(request.end_date)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="font-medium">{request.total_days} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted On</p>
                  <p className="font-medium">{formatDate(request.created_at)}</p>
                </div>
              </div>
              {request.reason && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reason</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{request.reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {request.approver_comment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Admin Comment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{request.approver_comment}</p>
              </CardContent>
            </Card>
          )}

          {isPending && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="adminComment">Comment (Optional for approval, Required for rejection)</Label>
                  <textarea
                    id="adminComment"
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Add a comment about this decision..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={approveRequest.isPending}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {approveRequest.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    disabled={rejectRequest.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {rejectRequest.isPending ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isPending && (
            <Alert>
              <AlertDescription>
                This leave request has already been {request.status}. No further action can be
                taken.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
