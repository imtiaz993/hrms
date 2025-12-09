'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetPayrollSettings, useUpdatePayrollSettings } from '@/hooks/admin/usePayroll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PayrollSettingsPage() {
  const router = useRouter();
  const { data: settings, isLoading, error } = useGetPayrollSettings();
  const updateSettings = useUpdatePayrollSettings();

  const [formData, setFormData] = useState({
    hourly_rate: 10,
    overtime_multiplier: 1.5,
    standard_working_days_per_month: 22,
    deduction_type: 'hourly' as 'hourly' | 'daily',
    daily_deduction_rate: 0,
    currency: 'USD',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      setFormData({
        hourly_rate: settings.hourly_rate,
        overtime_multiplier: settings.overtime_multiplier,
        standard_working_days_per_month: settings.standard_working_days_per_month,
        deduction_type: settings.deduction_type,
        daily_deduction_rate: settings.daily_deduction_rate,
        currency: settings.currency,
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['hourly_rate', 'overtime_multiplier', 'daily_deduction_rate'].includes(name)
        ? parseFloat(value) || 0
        : name === 'standard_working_days_per_month'
        ? parseInt(value) || 0
        : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.hourly_rate <= 0) {
      newErrors.hourly_rate = 'Hourly rate must be greater than 0';
    }
    if (formData.overtime_multiplier < 1) {
      newErrors.overtime_multiplier = 'Overtime multiplier must be at least 1';
    }
    if (
      formData.standard_working_days_per_month < 1 ||
      formData.standard_working_days_per_month > 31
    ) {
      newErrors.standard_working_days_per_month = 'Working days must be between 1 and 31';
    }
    if (formData.deduction_type === 'daily' && formData.daily_deduction_rate < 0) {
      newErrors.daily_deduction_rate = 'Daily deduction rate cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateSettings.mutateAsync(formData);
    } catch (error) {
      alert('Failed to update payroll settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load payroll settings.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary & Payroll Settings</h1>
          <p className="text-gray-600 mt-1">Configure payroll calculation rules</p>
        </div>
      </div>

      {updateSettings.isSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Payroll settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Salary Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate ({formData.currency})</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                  className={errors.hourly_rate ? 'border-red-500' : ''}
                />
                {errors.hourly_rate && (
                  <p className="text-sm text-red-600 mt-1">{errors.hourly_rate}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Base rate used for salary calculations</p>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="PKR">PKR</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="overtime_multiplier">Overtime Multiplier</Label>
                <Input
                  id="overtime_multiplier"
                  name="overtime_multiplier"
                  type="number"
                  step="0.1"
                  min="1"
                  value={formData.overtime_multiplier}
                  onChange={handleChange}
                  className={errors.overtime_multiplier ? 'border-red-500' : ''}
                />
                {errors.overtime_multiplier && (
                  <p className="text-sm text-red-600 mt-1">{errors.overtime_multiplier}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Multiplier for overtime pay (e.g., 1.5 = 1.5x hourly rate)
                </p>
              </div>

              <div>
                <Label htmlFor="standard_working_days_per_month">
                  Standard Working Days Per Month
                </Label>
                <Input
                  id="standard_working_days_per_month"
                  name="standard_working_days_per_month"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.standard_working_days_per_month}
                  onChange={handleChange}
                  className={errors.standard_working_days_per_month ? 'border-red-500' : ''}
                />
                {errors.standard_working_days_per_month && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.standard_working_days_per_month}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Expected working days in a month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deduction Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deduction_type">Deduction Type</Label>
              <select
                id="deduction_type"
                name="deduction_type"
                value={formData.deduction_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="hourly">Deduct based on hourly rate × missing hours</option>
                <option value="daily">Deduct fixed daily rate</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                How to calculate deductions for unpaid leave
              </p>
            </div>

            {formData.deduction_type === 'daily' && (
              <div>
                <Label htmlFor="daily_deduction_rate">
                  Daily Deduction Rate ({formData.currency})
                </Label>
                <Input
                  id="daily_deduction_rate"
                  name="daily_deduction_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.daily_deduction_rate}
                  onChange={handleChange}
                  className={errors.daily_deduction_rate ? 'border-red-500' : ''}
                />
                {errors.daily_deduction_rate && (
                  <p className="text-sm text-red-600 mt-1">{errors.daily_deduction_rate}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Fixed amount deducted per day of unpaid leave
                </p>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Deduction Calculation:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>
                    <strong>Hourly:</strong> Deduction = Unpaid Leave Hours × Hourly Rate
                  </li>
                  <li>
                    <strong>Daily:</strong> Deduction = Unpaid Leave Days × Daily Rate
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
