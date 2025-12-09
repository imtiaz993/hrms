'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TodayStatus } from '@/types';
import { useClockIn, useClockOut } from '@/hooks/useTimeEntry';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Clock, CheckCircle2 } from 'lucide-react';

interface ClockActionCardProps {
  status: TodayStatus;
  employeeId: string;
  standardHours: number;
  standardShiftStart: string;
  standardShiftEnd: string;
}

export function ClockActionCard({
  status,
  employeeId,
  standardHours,
  standardShiftStart,
  standardShiftEnd,
}: ClockActionCardProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const handleClockIn = async () => {
    setMessage(null);
    try {
      await clockInMutation.mutateAsync({
        employeeId,
        standardHours,
        standardShiftStart,
      });
      setMessage({ type: 'success', text: 'Clocked in successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to clock in. Please try again.' });
    }
  };

  const handleClockOut = async () => {
    setMessage(null);
    try {
      const { data } = await supabase
        .from('time_entries')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .maybeSingle();

      if (!data) {
        setMessage({ type: 'error', text: 'No time entry found for today.' });
        return;
      }

      await clockOutMutation.mutateAsync({
        timeEntryId: data.id,
        employeeId,
        standardHours,
        standardShiftEnd,
      });
      setMessage({ type: 'success', text: 'Clocked out successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to clock out. Please try again.' });
    }
  };

  const currentTime = format(new Date(), 'h:mm a');
  const isLoading = clockInMutation.isPending || clockOutMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clock In / Clock Out</CardTitle>
        <CardDescription>Record your work hours for today</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'success'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-2">Current Time</p>
          <p className="text-3xl font-bold text-gray-900">{currentTime}</p>
        </div>

        {status.status === 'not_clocked_in' && (
          <Button
            onClick={handleClockIn}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <Clock className="h-5 w-5 mr-2" />
            {isLoading ? 'Clocking In...' : 'Clock In'}
          </Button>
        )}

        {status.status === 'clocked_in' && (
          <Button
            onClick={handleClockOut}
            disabled={isLoading}
            className="w-full"
            size="lg"
            variant="destructive"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {isLoading ? 'Clocking Out...' : 'Clock Out'}
          </Button>
        )}

        {status.status === 'completed' && (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium">You've completed your shift for today!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
