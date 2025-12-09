'use client';

import { useAppSelector } from '@/store/hooks';
import {
  useGetLeaveBalances,
  useGetUpcomingHolidays,
  useGetLeaveRequests,
} from '@/hooks/useLeave';
import { LeaveBalanceSummary } from '@/components/leave/leave-balance-summary';
import { UpcomingHolidays } from '@/components/leave/upcoming-holidays';
import { LeaveRequestForm } from '@/components/leave/leave-request-form';
import { LeaveRequestsList } from '@/components/leave/leave-requests-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function LeavePage() {
  const { currentUser } = useAppSelector((state) => state.auth);

  const {
    data: leaveBalances,
    isLoading: balancesLoading,
    error: balancesError,
    refetch: refetchBalances,
  } = useGetLeaveBalances(currentUser?.id || '');

  const {
    data: holidays,
    isLoading: holidaysLoading,
    error: holidaysError,
    refetch: refetchHolidays,
  } = useGetUpcomingHolidays(90);

  const {
    data: leaveRequests,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useGetLeaveRequests(currentUser?.id || '');

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave & Holidays</h1>
        <p className="text-gray-600 mt-1">Request time off and view your leave history</p>
      </div>

      {balancesError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load leave balances.
            <Button
              variant="link"
              onClick={() => refetchBalances()}
              className="ml-2 p-0 h-auto"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : balancesLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <LeaveBalanceSummary balances={leaveBalances || []} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {requestsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load leave data.
                <Button
                  variant="link"
                  onClick={() => refetchRequests()}
                  className="ml-2 p-0 h-auto"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : requestsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <LeaveRequestForm
              employeeId={currentUser.id}
              existingRequests={leaveRequests || []}
            />
          )}
        </div>

        <div>
          {holidaysError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load holidays.
                <Button
                  variant="link"
                  onClick={() => refetchHolidays()}
                  className="ml-2 p-0 h-auto"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : holidaysLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <UpcomingHolidays holidays={holidays || []} />
          )}
        </div>
      </div>

      <div>
        {requestsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load leave requests.
              <Button
                variant="link"
                onClick={() => refetchRequests()}
                className="ml-2 p-0 h-auto"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : requestsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <LeaveRequestsList requests={leaveRequests || []} employeeId={currentUser.id} />
        )}
      </div>
    </div>
  );
}
