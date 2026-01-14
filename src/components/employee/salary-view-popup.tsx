'use client';

import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseUser";
import { format } from 'date-fns';

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
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const [salaryConfig, setSalaryConfig] = useState<any>(null);
  const [salaryRecord, setSalaryRecord] = useState<any>(null);
  const [periods, setPeriods] = useState<
    { month: number; year: number; label: string }[]
  >([]);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );


  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError('User not authenticated');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error) {
      setError('Incorrect password');
      return;
    }

    setIsAuthenticated(true);
  };

 
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchSalaryConfig() {
      const { data } = await supabase
        .from('salary_configs')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      setSalaryConfig(data);
    }

    fetchSalaryConfig();
  }, [employeeId, isAuthenticated]);

 
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchPeriods() {
      const { data } = await supabase
        .from('salary_records')
        .select('period_month, period_year')
        .eq('employee_id', employeeId)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (!data) return;

      const mapped = data.map((r) => ({
        month: r.period_month,
        year: r.period_year,
        label: format(
          new Date(r.period_year, r.period_month - 1),
          'MMMM yyyy'
        ),
      }));

      setPeriods(mapped);
    }

    fetchPeriods();
  }, [employeeId, isAuthenticated]);


  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchSalaryRecord() {
      const { data } = await supabase
        .from('salary_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('period_month', selectedMonth)
        .eq('period_year', selectedYear)
        .single();

      setSalaryRecord(data || null);
    }

    fetchSalaryRecord();
  }, [employeeId, selectedMonth, selectedYear, isAuthenticated]);


  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-md rounded-2xl bg-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Required
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
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
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button type="submit">Confirm</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = salaryConfig?.currency || 'USD';


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Salary Summary
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {periods.length > 0 && (
            <div className="flex items-center gap-3">
              <Label>Select Period</Label>
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [y, m] = e.target.value
                    .split('-')
                    .map(Number);
                  setSelectedYear(y);
                  setSelectedMonth(m);
                }}
                className="rounded border px-3 py-1"
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

          {salaryConfig && (
            <section className="rounded border p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4" />
                Salary Configuration
              </h3>
              <p>Type: {salaryConfig.salary_type}</p>
              <p>
                Base Amount: {currency} {salaryConfig.base_amount}
              </p>
            </section>
          )}

          {salaryRecord ? (
            <section className="rounded border p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4" />
                Salary Details
              </h3>
              <p>
                Net Pay: {currency} {salaryRecord.net_pay}
              </p>
            </section>
          ) : (
            <p className="text-center text-sm text-slate-500">
              No salary record available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
