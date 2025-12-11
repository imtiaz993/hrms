'use client';

import { useState } from 'react';
import { useLocalData } from '@/lib/local-data';
import {
  useGetSalaryConfig,
  useGetAvailablePeriods,
  useGetSalaryRecord,
} from '@/hooks/useSalary';
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
import {
  X,
  Lock,
  AlertCircle,
  DollarSign,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface SalaryViewPopupProps {
  employeeId: string;
  onClose: () => void;
}

export function SalaryViewPopup({ employeeId, onClose }: SalaryViewPopupProps) {
  const { payrollSettings, authenticate, employees } = useLocalData();
  const { data: salaryConfig } = useGetSalaryConfig(employeeId);
  const { data: periods } = useGetAvailablePeriods(employeeId);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data: salaryRecord } = useGetSalaryRecord(
    employeeId,
    selectedMonth,
    selectedYear
  );

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-md rounded-2xl border border-slate-100 bg-white/95 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Lock className="h-5 w-5 text-slate-600" />
              <span>Password Required</span>
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
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  Enter your password to view salary details
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-xl">
                  Confirm
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = salaryConfig?.currency || payrollSettings?.defaultCurrency || 'USD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white/95 shadow-xl">
        <CardHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-slate-100 bg-white/95 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <span>Salary Summary</span>
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
        <CardContent className="space-y-6 pt-4">
          {/* Period Selector */}
          {periods && periods.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50/80 p-3">
              <Label className="text-sm font-medium text-slate-700">
                Select Period:
              </Label>
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-').map(Number);
                  setSelectedYear(year);
                  setSelectedMonth(month);
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
              >
                {periods.map((p) => (
                  <option
                    key={`${p.year}-${p.month}`}
                    value={`${p.year}-${p.month}`}
                  >
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Salary Configuration */}
          {salaryConfig && (
            <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TrendingUp className="h-4 w-4 text-slate-600" />
                <span>Salary Configuration</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <ConfigRow
                  label="Salary Type"
                  value={salaryConfig.salary_type}
                  capitalize
                />
                <ConfigRow
                  label="Base Amount"
                  value={`${currency} ${salaryConfig.base_amount.toLocaleString()}`}
                />
                <ConfigRow
                  label="Overtime Multiplier"
                  value={`${salaryConfig.overtime_multiplier}x`}
                />
                <ConfigRow
                  label="Effective From"
                  value={salaryConfig.effective_from}
                />
              </div>
            </section>
          )}

          {/* Salary Record */}
          {salaryRecord ? (
            <>
              {/* Working Days Summary */}
              <section className="rounded-2xl border border-slate-100 bg-white/90 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <span>Working Days Summary</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <SummaryTile
                    label="Working Days"
                    value={salaryRecord.working_days}
                  />
                  <SummaryTile
                    label="Days Present"
                    value={salaryRecord.days_present}
                    accent="text-emerald-600"
                  />
                  <SummaryTile
                    label="Days Absent"
                    value={salaryRecord.days_absent}
                    accent="text-rose-600"
                  />
                  <SummaryTile
                    label="Paid Leave Days"
                    value={salaryRecord.paid_leave_days}
                    accent="text-indigo-600"
                  />
                </div>
              </section>

              {/* Salary Breakdown */}
              <section className="rounded-2xl border border-slate-100 bg-white/90 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Salary Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  <Row
                    label="Base Pay"
                    value={`${currency} ${salaryRecord.base_pay.toLocaleString()}`}
                  />
                  <Row
                    label="Overtime Pay"
                    value={`+${currency} ${salaryRecord.overtime_pay.toLocaleString()}`}
                    accent="text-emerald-600"
                  />
                  <Row
                    label="Allowances"
                    value={`+${currency} ${salaryRecord.allowances.toLocaleString()}`}
                    accent="text-emerald-600"
                  />
                  <DividerRow
                    label="Gross Salary"
                    value={`${currency} ${(
                      salaryRecord.base_pay +
                      salaryRecord.overtime_pay +
                      salaryRecord.allowances
                    ).toLocaleString()}`}
                  />
                  <Row
                    label="Unpaid Leave Deduction"
                    value={`-${currency} ${salaryRecord.unpaid_leave_deduction.toLocaleString()}`}
                    accent="text-rose-600"
                  />
                  <Row
                    label="Other Deductions"
                    value={`-${currency} ${salaryRecord.other_deductions.toLocaleString()}`}
                    accent="text-rose-600"
                  />
                  <DividerRow
                    label="Net Pay"
                    value={`${currency} ${salaryRecord.net_pay.toLocaleString()}`}
                    accent="text-emerald-600 text-lg font-bold"
                  />
                </div>
              </section>

              {/* Additional Details */}
              <section className="grid grid-cols-2 gap-4 text-sm">
                <SummaryTile
                  label="Total Hours Worked"
                  value={`${salaryRecord.total_hours_worked}h`}
                />
                <SummaryTile
                  label="Overtime Hours"
                  value={`${salaryRecord.overtime_hours}h`}
                />
                <SummaryTile
                  label="Late Arrivals"
                  value={salaryRecord.late_arrivals}
                />
                <SummaryTile
                  label="Early Leaves"
                  value={salaryRecord.early_leaves}
                />
              </section>
            </>
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">
              No salary record available for the selected period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string | number;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span
        className={`font-medium text-slate-900 ${
          capitalize ? 'capitalize' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50/80 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-semibold ${
          accent || 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={accent ? accent : 'font-medium text-slate-900'}>
        {value}
      </span>
    </div>
  );
}

function DividerRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span
        className={accent ? accent : 'text-sm font-semibold text-slate-900'}
      >
        {value}
      </span>
    </div>
  );
}
