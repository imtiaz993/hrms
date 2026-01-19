"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, UserPlus, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabaseUser";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types";

type Mode = "create" | "edit";

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mode?: Mode;
  employee?: Employee | null;
}

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  gender: string;
  date_of_birth: string;
  employee_id: string;
  department: string;
  designation: string;
  join_date: string;
  employment_type: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  standard_shift_start: string;
  standard_shift_end: string;
  standard_hours_per_day: number | string;
  is_admin: boolean;
};

function toISODate(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function initialForm(): FormState {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    gender: "",
    date_of_birth: "",
    employee_id: "",
    department: "",
    designation: "",
    join_date: "",
    employment_type: "full-time",
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact_phone: "",
    standard_shift_start: "09:00",
    standard_shift_end: "17:00",
    standard_hours_per_day: 8,
    is_admin: false,
  };
}

export function AddEmployeeModal({
  open,
  onOpenChange,
  onSuccess,
  mode = "create",
  employee = null,
}: AddEmployeeModalProps) {
  const isEdit = mode === "edit";

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<FormState>(initialForm());

  const resetForm = () => {
    setFormData(initialForm());
    setErrors({});
    setSubmitError(null);
    setIsSuccess(false);
  };

  useEffect(() => {
    if (!open) return;

    setSubmitError(null);
    setIsSuccess(false);
    setErrors({});

    if (isEdit && employee) {
      setFormData({
        first_name: employee.first_name ?? "",
        last_name: employee.last_name ?? "",
        email: employee.email ?? "",
        phone_number: employee.phone_number ?? "",
        address: employee.address ?? "",
        gender: employee.gender ?? "",
        date_of_birth: toISODate(employee.date_of_birth as any),
        employee_id: employee.employee_id ?? "",
        department: employee.department ?? "",
        designation: employee.designation ?? "",
        join_date: toISODate(employee.join_date as any),
        employment_type: employee.employment_type ?? "full-time",
        emergency_contact_name: employee.emergency_contact_name ?? "",
        emergency_contact_relation: employee.emergency_contact_relation ?? "",
        emergency_contact_phone: employee.emergency_contact_phone ?? "",
        standard_shift_start: employee.standard_shift_start ?? "09:00",
        standard_shift_end: employee.standard_shift_end ?? "17:00",
        standard_hours_per_day: (employee.standard_hours_per_day as any) ?? 8,
        is_admin: Boolean(employee.is_admin),
      });
      return;
    }

    if (!isEdit) resetForm();
  }, [open, isEdit, employee]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const t = e.target as HTMLInputElement;
    const value = t.type === "checkbox" ? t.checked : t.value;

    setFormData((prev) => ({ ...prev, [t.name]: value }));
    if (errors[t.name]) setErrors((prev) => ({ ...prev, [t.name]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.department.trim())
      newErrors.department = "Department is required";
    if (!formData.designation.trim())
      newErrors.designation = "Designation is required";
    if (!formData.join_date) newErrors.join_date = "Join date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="text-xs text-red-600 mt-1">{errors[name]}</p>
    ) : null;

  const inputClass = (name: string) =>
    cn(errors[name] ? "border-red-500 focus-visible:ring-red-500" : "");

  const Select = (props: any) => (
    <select
      {...props}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50",
        props.className
      )}
    />
  );

  const handleClose = (nextOpen: boolean) => {
    if (isSaving) return;
    if (!nextOpen && !isEdit) resetForm();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSuccess(false);

    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number || null,
        address: formData.address || null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        employee_id: formData.employee_id || null,
        department: formData.department,
        designation: formData.designation,
        join_date: formData.join_date,
        employment_type: formData.employment_type || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_relation: formData.emergency_contact_relation || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        standard_shift_start: formData.standard_shift_start,
        standard_shift_end: formData.standard_shift_end,
        standard_hours_per_day: Number(formData.standard_hours_per_day) || 8,
        is_admin: Boolean(formData.is_admin),
      };

      if (isEdit) {
        if (!employee?.id) {
          setSubmitError("Missing employee id.");
          return;
        }

        const { error } = await supabase
          .from("employees")
          .update(payload)
          .eq("id", employee.id);

        if (error) {
          setSubmitError(error.message || "Failed to update employee.");
          return;
        }

        setIsSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          onSuccess();
        }, 700);
        return;
      }

      // CREATE
      const createRes = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          is_admin: formData.is_admin,
        }),
      });

      const createJson = await createRes.json().catch(() => ({}));

      if (!createRes.ok || createJson?.error) {
        const msg =
          createJson?.error?.message ||
          createJson?.error ||
          "Failed to create authentication user.";

        if (String(msg).toLowerCase().includes("already")) {
          setErrors((prev) => ({
            ...prev,
            email: "An account with this email already exists",
          }));
        } else {
          setSubmitError(msg);
        }
        return;
      }

      const authUserId = createJson?.data?.user?.id;
      if (!authUserId) {
        setSubmitError("Auth user created but user id not returned.");
        return;
      }

      const { error: insertError } = await supabase
        .from("employees")
        .insert([
          { id: authUserId, ...payload, is_active: true, is_deleted: false },
        ]);

      if (insertError) {
        setSubmitError(insertError.message || "Failed to create employee.");
        return;
      }

      const mailRes = await fetch("/api/admin/send-create-password-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const mailJson = await mailRes.json().catch(() => ({}));

      if (!mailRes.ok || mailJson?.error) {
        setSubmitError(
          mailJson?.error?.message ||
            mailJson?.error ||
            "Failed to send password email."
        );
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        onSuccess();
      }, 900);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl p-0 overflow-y-auto">
        <div className="flex max-h-[90vh] flex-col">
          <div className="shrink-0 px-6 py-5 border-b bg-white">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-lg">
                    {isEdit ? "Edit Employee" : "Add New Employee"}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {isEdit
                      ? "Update employee profile details."
                      : "Create employee + send password setup email."}
                  </DialogDescription>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
                  {isEdit ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {isEdit ? "Update" : "Onboarding"}
                </div>
              </div>
            </DialogHeader>

            {submitError && (
              <div className="mt-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              </div>
            )}

            {isSuccess && (
              <div className="mt-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    {isEdit
                      ? "Employee updated successfully!"
                      : "Employee created successfully!"}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-50 px-6 py-6 space-y-8">
              {/* Personal */}
              <section className="rounded-xl border bg-white">
                <div className="px-5 py-4 border-b">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Basic details for identification and contact.
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={inputClass("first_name")}
                        disabled={isSaving}
                      />
                      <FieldError name="first_name" />
                    </div>

                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={inputClass("last_name")}
                        disabled={isSaving}
                      />
                      <FieldError name="last_name" />
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
                      className={inputClass("email")}
                      disabled={isSaving || isEdit}
                    />
                    <FieldError name="email" />
                    {isEdit && (
                      <p className="text-xs text-gray-500 mt-1">
                        Email is locked because it is tied to authentication.
                      </p>
                    )}
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
                        disabled={isSaving}
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
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        disabled={isSaving}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">
                          Prefer not to say
                        </option>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        name="employee_id"
                        value={formData.employee_id}
                        onChange={handleChange}
                        placeholder="AUTO"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={isSaving}
                      className="min-h-[92px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                      placeholder="Street, city, country"
                    />
                  </div>
                </div>
              </section>

              {/* Job */}
              <section className="rounded-xl border bg-white">
                <div className="px-5 py-4 border-b">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Job Information
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Role, department, and schedule.
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Input
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className={inputClass("department")}
                        disabled={isSaving}
                        placeholder="e.g., Engineering"
                      />
                      <FieldError name="department" />
                    </div>

                    <div>
                      <Label htmlFor="designation">Designation *</Label>
                      <Input
                        id="designation"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        className={inputClass("designation")}
                        disabled={isSaving}
                        placeholder="e.g., Software Engineer"
                      />
                      <FieldError name="designation" />
                    </div>

                    <div>
                      <Label htmlFor="join_date">Join Date *</Label>
                      <Input
                        id="join_date"
                        name="join_date"
                        type="date"
                        value={formData.join_date}
                        onChange={handleChange}
                        className={inputClass("join_date")}
                        disabled={isSaving}
                      />
                      <FieldError name="join_date" />
                    </div>

                    <div>
                      <Label htmlFor="employment_type">Employment Type</Label>
                      <Select
                        id="employment_type"
                        name="employment_type"
                        value={formData.employment_type}
                        onChange={handleChange}
                        disabled={isSaving}
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                      </Select>
                    </div>
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
                        disabled={isSaving}
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
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="standard_hours_per_day">
                        Hours / Day
                      </Label>
                      <Input
                        id="standard_hours_per_day"
                        name="standard_hours_per_day"
                        type="number"
                        min="1"
                        max="24"
                        value={formData.standard_hours_per_day}
                        onChange={handleChange}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Admin access
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Enable to give access to admin dashboard.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        id="is_admin"
                        name="is_admin"
                        type="checkbox"
                        checked={formData.is_admin}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300"
                        disabled={isSaving}
                      />
                      <span className="text-sm text-gray-800">Grant</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Emergency */}
              <section className="rounded-xl border bg-white">
                <div className="px-5 py-4 border-b">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Emergency Contact
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Optional contact for urgent situations.
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">
                        Contact Name
                      </Label>
                      <Input
                        id="emergency_contact_name"
                        name="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={handleChange}
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergency_contact_phone">
                        Contact Phone
                      </Label>
                      <Input
                        id="emergency_contact_phone"
                        name="emergency_contact_phone"
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={handleChange}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="emergency_contact_relation">Relation</Label>
                    <Select
                      id="emergency_contact_relation"
                      name="emergency_contact_relation"
                      value={formData.emergency_contact_relation}
                      onChange={handleChange}
                      disabled={isSaving}
                    >
                      <option value="">Select relation</option>
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="child">Child</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                </div>
              </section>
            </div>

            <div className="shrink-0 border-t bg-white px-6 py-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                  ? "Save Changes"
                  : "Save Employee"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
