'use client';

import { useState } from 'react';
import { useLocalData } from '@/lib/local-data';
import { useGetLeaveRequests } from '@/hooks/useLeave';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LeaveType, LeaveRequest } from '@/types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { calculateLeaveDays, hasOverlappingLeave } from '@/hooks/useLeave';

interface LeaveRequestPopupProps {
  employeeId: string;
  onClose: () => void;
}

export function LeaveRequestPopup({ employeeId, onClose }: LeaveRequestPopupProps) {
  const { createLeaveRequest } = useLocalData();
  const { data: existingRequests = [] } = useGetLeaveRequests(employeeId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('paid');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!startDate || !endDate) {
      setError('Please select start and end dates.');
      return;
    }

    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));
    const today = startOfDay(new Date());

    if (isBefore(start, today)) {
      setError('Start date cannot be in the past.');
      return;
    }

    if (isBefore(end, start)) {
      setError('End date must be on or after start date.');
      return;
    }

    if (isHalfDay && startDate !== endDate) {
      setError('Half-day leave can only be for a single day.');
      return;
    }

    if (hasOverlappingLeave(existingRequests, startDate, endDate)) {
      setError('You already have a pending or approved leave request for these dates.');
      return;
    }

    const totalDays = calculateLeaveDays(startDate, endDate, isHalfDay);
    const now = new Date().toISOString();

    setIsLoading(true);
    try {
      const newRequest: LeaveRequest = {
        id: `lr-${Date.now()}`,
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        total_days: totalDays,
        reason: reason || undefined,
        status: 'pending',
        created_at: now,
        updated_at: now,
      };

      createLeaveRequest(newRequest);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Request Leave</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Leave request submitted successfully!</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate) setEndDate(e.target.value);
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                  disabled={isLoading || success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || format(new Date(), 'yyyy-MM-dd')}
                  required
                  disabled={isLoading || success}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <select
                id="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                required
                disabled={isLoading || success}
              >
                <option value="paid">Paid Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isHalfDay"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                disabled={isLoading || success}
              />
              <Label htmlFor="isHalfDay" className="cursor-pointer">
                Half-day leave
              </Label>
            </div>

            {startDate && endDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-900">
                  <strong>Duration:</strong>{' '}
                  {calculateLeaveDays(startDate, endDate, isHalfDay)} day
                  {calculateLeaveDays(startDate, endDate, isHalfDay) !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for leave..."
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                disabled={isLoading || success}
              />
            </div>

            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || success}>
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

