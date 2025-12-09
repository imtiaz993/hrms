'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  useGetSalaryConfig,
  useGetAvailablePeriods,
  useGetSalaryRecord,
} from '@/hooks/useSalary';
import { SalarySummaryCards } from '@/components/salary/salary-summary-cards';
import { SalaryBreakdown } from '@/components/salary/salary-breakdown';
import { AttendanceSummary } from '@/components/salary/attendance-summary';
import { SalaryConfigInfo } from '@/components/salary/salary-config-info';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar } from 'lucide-react';

export default function SalaryPage() {
  const { currentUser } = useAppSelector((state) => state.auth);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);

  const {
    data: salaryConfig,
    isLoading: configLoading,
    error: configError,
    refetch: refetchConfig,
  } = useGetSalaryConfig(currentUser?.id || '');

  const {
    data: periods,
    isLoading: periodsLoading,
    error: periodsError,
    refetch: refetchPeriods,
  } = useGetAvailablePeriods(currentUser?.id || '');

  const {
    data: salaryRecord,
    isLoading: recordLoading,
    error: recordError,
    refetch: refetchRecord,
  } = useGetSalaryRecord(currentUser?.id || '', selectedMonth, selectedYear);

  if (!currentUser) {
    return null;
  }

  if (periods && periods.length > 0 && selectedMonth === 0) {
    setSelectedMonth(periods[0].month);
    setSelectedYear(periods[0].year);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Salary Summary</h1>
        <p className="text-gray-600 mt-1">View how your salary is calculated for each period</p>
      </div>

      {periodsError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load available periods.
            <Button
              variant="link"
              onClick={() => refetchPeriods()}
              className="ml-2 p-0 h-auto"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : periodsLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : periods && periods.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                No salary data is available yet. Your payroll might not be processed for this account.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Select Period:</label>
                <select
                  value={`${selectedYear}-${selectedMonth}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-').map(Number);
                    setSelectedYear(year);
                    setSelectedMonth(month);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {periods?.map((period) => (
                    <option key={`${period.year}-${period.month}`} value={`${period.year}-${period.month}`}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {recordError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load salary summary for this period.
                <Button
                  variant="link"
                  onClick={() => refetchRecord()}
                  className="ml-2 p-0 h-auto"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : recordLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !salaryRecord ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No salary summary found for this period. Try a different period or contact HR.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <SalarySummaryCards
                record={salaryRecord}
                currency={salaryConfig?.currency || 'USD'}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalaryBreakdown
                  record={salaryRecord}
                  currency={salaryConfig?.currency || 'USD'}
                />
                <AttendanceSummary record={salaryRecord} />
              </div>

              {configLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : configError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Unable to load salary configuration.
                    <Button
                      variant="link"
                      onClick={() => refetchConfig()}
                      className="ml-2 p-0 h-auto"
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : salaryConfig ? (
                <SalaryConfigInfo
                  config={salaryConfig}
                  standardHoursPerDay={currentUser.standard_hours_per_day}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
