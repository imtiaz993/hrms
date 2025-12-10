"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Old password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters";
    } else if (formData.newPassword === formData.oldPassword) {
      newErrors.newPassword =
        "New password must be different from old password";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setShowSuccess(false);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !user.email) {
        setFormError(
          "Unable to identify current user. Please re-login and try again."
        );
        setIsSubmitting(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.oldPassword,
      });

      if (signInError) {
        setErrors((prev) => ({
          ...prev,
          oldPassword: "Old password is incorrect",
        }));
        setIsSubmitting(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        setFormError(
          updateError.message || "Failed to update password. Please try again."
        );
        setIsSubmitting(false);
        return;
      }

      setShowSuccess(true);

      setTimeout(() => {
        router.push("/employee/dashboard/profile");
      }, 2000);
    } catch (err: any) {
      setFormError(
        "Unexpected error while changing password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
          <p className="text-gray-600 mt-1">
            Update your account password securely
          </p>
        </div>
      </div>

      {showSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Password changed successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Password Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Minimum 6 characters long</li>
            <li>Must be different from your current password</li>
            <li>Confirmation must match new password</li>
          </ul>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="oldPassword">Old Password *</Label>
              <Input
                id="oldPassword"
                name="oldPassword"
                type="password"
                value={formData.oldPassword}
                onChange={handleChange}
                className={errors.oldPassword ? "border-red-500" : ""}
              />
              {errors.oldPassword && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.oldPassword}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                className={errors.newPassword ? "border-red-500" : ""}
              />
              {errors.newPassword && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            For security purposes, this is a mock password change. In a
            production environment, this would securely update your password in
            the system.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button type="submit">Update Password</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
