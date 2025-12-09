'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeaveType, LeaveRequest } from '@/types';
import { useCreateLeaveRequest, calculateLeaveDays, hasOverlappingLeave } from '@/hooks/useLeave';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface LeaveRequestFormProps {
  employeeId: string;
  existingRequests: LeaveRequest[];
}

export function LeaveRequestForm({ employeeId, existingRequests }: LeaveRequestFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('paid');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const createMutation = useCreateLeaveRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');

    if (!startDate || !endDate) {
      setValidationError('Please select start and end dates.');
      return;
    }

    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));
    const today = startOfDay(new Date());

    if (isBefore(start, today)) {
      setValidationError('Start date cannot be in the past.');
      return;
    }

    if (isBefore(end, start)) {
      setValidationError('End date must be on or after start date.');
      return;
    }

    if (isHalfDay && startDate !== endDate) {
      setValidationError('Half-day leave can only be for a single day.');
      return;
    }

    if (hasOverlappingLeave(existingRequests, startDate, endDate)) {
      setValidationError('You already have a pending or approved leave request for these dates.');
    }

    const totalDays = calculateLeaveDays(startDate, endDate, isHalfDay);

    try {
      await createMutation.mutateAsync({
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        total_days: totalDays,
        reason: reason || undefined,
      });

      setSuccessMessage('Leave request submitted successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      setIsHalfDay(false);
    } catch (error: any) {
      setValidationError(error.message || 'Failed to submit leave request. Please try again.');
    }
  };

  const calculateDaysPreview = () => {
    if (!startDate || !endDate) return null;

    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));

    if (isBefore(end, start)) return null;

    const days = calculateLeaveDays(startDate, endDate, isHalfDay);
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Leave</CardTitle>
        <CardDescription>Submit a new leave request for approval</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                disabled={createMutation.isPending}
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
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <select
              id="leaveType"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={createMutation.isPending}
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
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              disabled={createMutation.isPending}
            />
            <Label htmlFor="isHalfDay" className="cursor-pointer">
              Half-day leave
            </Label>
          </div>

          {calculateDaysPreview() && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-900">
                <strong>Duration:</strong> {calculateDaysPreview()}
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
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={createMutation.isPending}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
