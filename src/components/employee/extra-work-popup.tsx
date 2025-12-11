'use client';

import { useState } from 'react';
import { useLocalData } from '@/lib/local-data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ExtraWorkType } from '@/types';
import { format } from 'date-fns';

interface ExtraWorkPopupProps {
  employeeId: string;
  onClose: () => void;
}

export function ExtraWorkPopup({ employeeId, onClose }: ExtraWorkPopupProps) {
  const { createExtraWork } = useLocalData();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workType, setWorkType] = useState<ExtraWorkType>('weekend');
  const [hoursWorked, setHoursWorked] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!date) {
      setError('Please select a date.');
      return;
    }

    const hours = parseFloat(hoursWorked);
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter a valid number of hours worked.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for extra work.');
      return;
    }

    setIsLoading(true);
    try {
      createExtraWork({
        employee_id: employeeId,
        date,
        work_type: workType,
        hours_worked: hours,
        reason: reason.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit extra work request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-2xl border border-slate-100 bg-white/95 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Request Extra Work Adjustment
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
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
                <AlertDescription>
                  Extra work request submitted successfully!
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={isLoading || success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workType">Work Type *</Label>
              <select
                id="workType"
                value={workType}
                onChange={(e) => setWorkType(e.target.value as ExtraWorkType)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
                required
                disabled={isLoading || success}
              >
                <option value="weekend">Weekend Work</option>
                <option value="holiday">Holiday Work</option>
                <option value="overtime">Overtime</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursWorked">Hours Worked *</Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.5"
                min="0.5"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="e.g., 4, 6, 8"
                required
                disabled={isLoading || success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for extra work..."
                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
                required
                disabled={isLoading || success}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl"
                disabled={isLoading || success}
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
