'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateEmployee } from '@/hooks/admin/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/Supabase';

export default function AddEmployeePage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    gender: '',
    date_of_birth: '',
    employee_id: '',
    department: '',
    designation: '',
    join_date: '',
    employment_type: 'full-time',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
    standard_shift_start: '09:00',
    standard_shift_end: '17:00',
    standard_hours_per_day: 8,
    is_admin: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.join_date) newErrors.join_date = 'Join date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitError(null);

  if (!validateForm()) return;

  try {
    setIsInviting(true);

    // 1) Create auth user first (with a temporary random password)
    const tempPassword = crypto.randomUUID(); // or any random generator

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: tempPassword,
    });

    if (signUpError) {
      console.error("auth signUp error:", signUpError);

      if (
        signUpError.message?.toLowerCase().includes("already") ||
        signUpError.message?.toLowerCase().includes("registered")
      ) {
        setErrors((prev) => ({
          ...prev,
          email: "An account with this email already exists",
        }));
      } else {
        setSubmitError(
          signUpError.message || "Failed to create authentication user."
        );
      }
      setIsInviting(false);
      return;
    }

    const authUser = signUpData.user;
    if (!authUser?.id) {
      setSubmitError("Failed to get authentication user id.");
      setIsInviting(false);
      return;
    }

    const authUserId = authUser.id; // 👈 this must match employees.id type (uuid)

    // 2) Insert into employees with SAME id as auth user
    const { error: insertError } = await supabase.from("employees").insert([
      {
        id: authUserId, // 👈 now NOT NULL and same as auth.users.id
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        address: formData.address,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || null,
        employee_id: formData.employee_id || null,
        department: formData.department,
        designation: formData.designation,
        join_date: formData.join_date,
        employment_type: formData.employment_type,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_relation: formData.emergency_contact_relation || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        standard_shift_start: formData.standard_shift_start,
        standard_shift_end: formData.standard_shift_end,
        standard_hours_per_day: formData.standard_hours_per_day,
        is_admin: formData.is_admin,
      },
    ]);

    if (insertError) {
      console.error("employees insert error:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });

      if (
        insertError.message?.toLowerCase().includes("duplicate") ||
        insertError.message?.toLowerCase().includes("unique")
      ) {
        setErrors((prev) => ({
          ...prev,
          email: "Email already exists",
        }));
      } else {
        setSubmitError(
          insertError.message ||
            insertError.details ||
            "Failed to create employee."
        );
      }
      setIsInviting(false);
      return;
    }

    // 3) Send magic-link email so employee can set their own password
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        emailRedirectTo: `${window.location.origin}/create-password`, // or /reset-password
      },
    });

    if (otpError) {
      console.error("OTP error:", otpError);
      setSubmitError(
        otpError.message ||
          "Employee created, but failed to send the sign-in email."
      );
      setIsInviting(false);
      return;
    }

    // 4) All good → go back to employees list
    router.push("/admin/dashboard/employees");
  } catch (error: any) {
    console.error(error);
    if (error?.message?.includes("unique")) {
      setErrors({ email: "Email already exists" });
    } else {
      setSubmitError("Failed to create employee. Please try again.");
    }
  } finally {
    setIsInviting(false);
  }
};


  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
          <p className="text-gray-600 mt-1">Create a new employee record</p>
        </div>
      </div>

      {createEmployee.isSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Employee created successfully!
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  placeholder="AUTO"
                />
              </div>
              <div>
                <Label htmlFor="join_date">Join Date *</Label>
                <Input
                  id="join_date"
                  name="join_date"
                  type="date"
                  value={formData.join_date}
                  onChange={handleChange}
                  className={errors.join_date ? 'border-red-500' : ''}
                />
                {errors.join_date && (
                  <p className="text-sm text-red-600 mt-1">{errors.join_date}</p>
                )}
              </div>
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
                  placeholder="e.g., Engineering"
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
                  placeholder="e.g., Software Engineer"
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

            <div className="flex items-center space-x-2">
              <input
                id="is_admin"
                name="is_admin"
                type="checkbox"
                checked={formData.is_admin}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_admin" className="font-normal cursor-pointer">
                Grant admin privileges
              </Label>
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
          <Button type="submit" disabled={createEmployee.isPending}>
            {createEmployee.isPending ? 'Creating...' : 'Save Employee'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
