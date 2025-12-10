"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setUser } from "@/store/authSlice";

export default function EditProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.auth);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: currentUser?.first_name || "",
    last_name: currentUser?.last_name || "",
    phone_number: currentUser?.phone_number || "",
    address: currentUser?.address || "",
    gender: currentUser?.gender || "",
    emergency_contact_name: currentUser?.emergency_contact_name || "",
    emergency_contact_relation: currentUser?.emergency_contact_relation || "",
    emergency_contact_phone: currentUser?.emergency_contact_phone || "",
  });

  if (!currentUser) {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentUser?.id) {
      console.error("No current user found");
      alert("No user found. Please log in again.");
      return;
    }

    setShowSuccess(false);
    setIsSubmitting(true);

    try {
      console.log("Submitting profile update…", formData);

      const { error } = await supabase
        .from("employees") // make sure this is your correct table name
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone_number: formData.phone_number.trim(),
          address: formData.address.trim(),
          gender: formData.gender || null,
          emergency_contact_name: formData.emergency_contact_name.trim(),
          emergency_contact_relation:
            formData.emergency_contact_relation || null,
          emergency_contact_phone: formData.emergency_contact_phone.trim(),
        })
        .eq("id", currentUser.id); // make sure 'id' is the correct PK column

      if (error) {
        console.error("Supabase update error:", error);
        alert("Failed to update profile. Please try again.");
        return;
      }

      console.log("Profile updated successfully");

      const updatedUser = {
        ...currentUser,
        ...formData,
      };
      dispatch(setUser(updatedUser));

      setShowSuccess(true);

      router.push("/employee/dashboard/profile");
    } catch (err) {
      console.error("Unexpected error updating profile:", err);
      alert("Something went wrong. Please check console and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600 mt-1">Update your personal information</p>
        </div>
      </div>

      {showSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Profile updated successfully! Redirecting...
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
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={currentUser.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St, City, State, ZIP"
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
                value={currentUser.employee_id || "Not assigned"}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                This field cannot be edited
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={currentUser.department}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={currentUser.designation}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Contact HR to update job-related information
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emergency_contact_name">Name *</Label>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact_relation">Relation *</Label>
                <select
                  id="emergency_contact_relation"
                  name="emergency_contact_relation"
                  value={formData.emergency_contact_relation}
                  onChange={handleChange}
                  required
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
                <Label htmlFor="emergency_contact_phone">Phone Number *</Label>
                <Input
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 md:flex-none">
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
