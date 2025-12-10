'use client';

import { useState } from 'react';
import { useLocalData } from '@/lib/local-data';
import { useGetSalaryConfig, useGetAvailablePeriods, useGetSalaryRecord } from '@/hooks/useSalary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Lock, AlertCircle, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface SalaryViewPopupProps {
  employeeId: string;
  onClose: () => void;
}

export function SalaryViewPopup({ employeeId, onClose }: SalaryViewPopupProps) {
  const { payrollSettings, authenticate, employees } = useLocalData();
  const { data: salaryConfig } = useGetSalaryConfig(employeeId);
  const { data: periods } = useGetAvailablePeriods(employeeId);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data: salaryRecord } = useGetSalaryRecord(employeeId, selectedMonth, selectedYear);
  
  const employee = employees.find((e) => e.id === employeeId);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employee) {
      setError('Employee not found');
      return;
    }

    const user = authenticate(employee.email, password);
    if (user) {
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Password Required</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Enter your password to view salary details</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Confirm
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Salary Summary</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Selector */}
          {periods && periods.length > 0 && (
            <div className="flex items-center space-x-4">
              <Label>Select Period:</Label>
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-').map(Number);
                  setSelectedYear(year);
                  setSelectedMonth(month);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm"
              >
                {periods.map((p) => (
                  <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Salary Configuration */}
          {salaryConfig && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Salary Configuration</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Salary Type</p>
                  <p className="font-medium capitalize">{salaryConfig.salary_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Base Amount</p>
                  <p className="font-medium">
                    {salaryConfig.currency} {salaryConfig.base_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Overtime Multiplier</p>
                  <p className="font-medium">{salaryConfig.overtime_multiplier}x</p>
                </div>
                <div>
                  <p className="text-gray-500">Effective From</p>
                  <p className="font-medium">{salaryConfig.effective_from}</p>
                </div>
              </div>
            </div>
          )}

          {/* Salary Record */}
          {salaryRecord ? (
            <>
              {/* Working Days Summary */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Working Days Summary</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Working Days</p>
                    <p className="font-medium text-lg">{salaryRecord.working_days}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Days Present</p>
                    <p className="font-medium text-lg text-green-600">{salaryRecord.days_present}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Days Absent</p>
                    <p className="font-medium text-lg text-red-600">{salaryRecord.days_absent}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Paid Leave Days</p>
                    <p className="font-medium text-lg text-blue-600">{salaryRecord.paid_leave_days}</p>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Salary Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Pay</span>
                    <span className="font-medium">
                      {salaryConfig?.currency || 'USD'} {salaryRecord.base_pay.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overtime Pay</span>
                    <span className="font-medium text-green-600">
                      +{salaryConfig?.currency || 'USD'} {salaryRecord.overtime_pay.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allowances</span>
                    <span className="font-medium text-green-600">
                      +{salaryConfig?.currency || 'USD'} {salaryRecord.allowances.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Gross Salary</span>
                    <span className="font-semibold">
                      {salaryConfig?.currency || 'USD'}{' '}
                      {(
                        salaryRecord.base_pay +
                        salaryRecord.overtime_pay +
                        salaryRecord.allowances
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unpaid Leave Deduction</span>
                    <span className="font-medium text-red-600">
                      -{salaryConfig?.currency || 'USD'} {salaryRecord.unpaid_leave_deduction.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Deductions</span>
                    <span className="font-medium text-red-600">
                      -{salaryConfig?.currency || 'USD'} {salaryRecord.other_deductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-lg font-bold">Net Pay</span>
                    <span className="text-lg font-bold text-green-600">
                      {salaryConfig?.currency || 'USD'} {salaryRecord.net_pay.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Hours Worked</p>
                  <p className="font-medium">{salaryRecord.total_hours_worked}h</p>
                </div>
                <div>
                  <p className="text-gray-500">Overtime Hours</p>
                  <p className="font-medium">{salaryRecord.overtime_hours}h</p>
                </div>
                <div>
                  <p className="text-gray-500">Late Arrivals</p>
                  <p className="font-medium">{salaryRecord.late_arrivals}</p>
                </div>
                <div>
                  <p className="text-gray-500">Early Leaves</p>
                  <p className="font-medium">{salaryRecord.early_leaves}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No salary record available for the selected period.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

