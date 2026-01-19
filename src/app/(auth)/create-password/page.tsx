"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseUser";
import { Suspense } from "react";

function CreatePasswordClient() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // 🔐 ACCESS CONTROL + SESSION VALIDATION
  useEffect(() => {
    const validateAccess = async () => {
      // 1️⃣ Already logged-in user → block page
      // const hrmsCurrentUser = localStorage.getItem("hrmsCurrentUser");
      // if (hrmsCurrentUser) {
      //   if (hrmsCurrentUser.includes('"is_admin":true')) {
      //     router.replace("/admin/dashboard");
      //     return;
      //   } else {
      //     router.replace("/employee/dashboard");
      //     return;
      //   }
      // }

      // 2️⃣ Page allowed ONLY if token exists
      // const token = localStorage.getItem("token");
      // if (!token) {
      //   router.replace("/login");
      //   return;
      // }

      // 3️⃣ Validate Supabase session (magic link)
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? null);
      setSessionChecked(true);
    };

    validateAccess();
  }, [router]);

  // 🔑 PASSWORD CREATION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Session expired. Please request a new password link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // 1️⃣ Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw new Error(updateError.message);

      // 2️⃣ Logout user immediately
      await supabase.auth.signOut();

      setSuccess("Password created successfully. Redirecting to login...");

      // 3️⃣ Redirect to login
      router.replace("/login");
    } catch (err: any) {
      setError(err?.message || "Failed to create password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ⏳ Loading state while checking session
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking your link...</p>
      </div>
    );
  }

  // ✅ VALID SESSION UI
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Password</CardTitle>
          <CardDescription>
            Enter your new password below
            {email && (
              <span className="block text-xs text-muted-foreground mt-1">
                Creating password for <strong>{email}</strong>
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <CreatePasswordClient />
    </Suspense>
  );
}
