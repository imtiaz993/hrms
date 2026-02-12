'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGetEmployeeById, useUpdateEmployee } from '@/hooks/admin/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  const { addToast } = useToast();

  const { data: employee, isLoading: loadingEmployee } = useGetEmployeeById(employeeId);
  const updateEmployee = useUpdateEmployee();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    gender: '',
    date_of_birth: '',
    department: '',
    designation: '',
    employment_type: '',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
    standard_shift_start: '',
    standard_shift_end: '',
    standard_hours_per_day: 8,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        phone_number: employee.phone_number || '',
        address: employee.address || '',
        gender: employee.gender || '',
        date_of_birth: employee.date_of_birth || '',
        department: employee.department || '',
        designation: employee.designation || '',
        employment_type: employee.employment_type || 'full-time',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_relation: employee.emergency_contact_relation || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        standard_shift_start: employee.standard_shift_start || '09:00',
        standard_shift_end: employee.standard_shift_end || '17:00',
        standard_hours_per_day: employee.standard_hours_per_day || 8,
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateEmployee.mutateAsync({ employeeId, input: formData });
      router.push(`/admin/dashboard/employees/${employeeId}`);
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update employee. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loadingEmployee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Employee not found</AlertDescription>
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
          <p className="text-gray-600 mt-1">Update employee information</p>
        </div>
      </div>

      {updateEmployee.isSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Employee updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={employee.email} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={employee.employee_id || 'Not assigned'}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Employee ID cannot be changed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={errors.department ? 'border-red-500' : ''}
                />
                {errors.department && (
                  <p className="text-sm text-red-600 mt-1">{errors.department}</p>
                )}
              </div>
              <div>
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className={errors.designation ? 'border-red-500' : ''}
                />
                {errors.designation && (
                  <p className="text-sm text-red-600 mt-1">{errors.designation}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="employment_type">Employment Type</Label>
              <select
                id="employment_type"
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="standard_shift_start">Shift Start</Label>
                <Input
                  id="standard_shift_start"
                  name="standard_shift_start"
                  type="time"
                  value={formData.standard_shift_start}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="standard_shift_end">Shift End</Label>
                <Input
                  id="standard_shift_end"
                  name="standard_shift_end"
                  type="time"
                  value={formData.standard_shift_end}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="standard_hours_per_day">Hours Per Day</Label>
                <Input
                  id="standard_hours_per_day"
                  name="standard_hours_per_day"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.standard_hours_per_day}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact_relation">Relation</Label>
                <select
                  id="emergency_contact_relation"
                  name="emergency_contact_relation"
                  value={formData.emergency_contact_relation}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select relation</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={updateEmployee.isPending}>
            {updateEmployee.isPending ? 'Updating...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
