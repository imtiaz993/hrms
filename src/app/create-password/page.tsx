"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { supabase } from "@/lib/Supabase";

export default function CreatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // When user comes from magic link, Supabase creates a session.
  // We fetch the current user to make sure the link is valid.
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        setError(
          "Your create link is invalid or has expired. Please request a new link."
        );
      } else {
        setEmail(data.user.email ?? null);
      }

      setSessionChecked(true);
    };

    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError(
        "No active session found. Please open the password create link from your email again."
      );
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
      // This updates the password for the CURRENTLY logged-in user
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw new Error(
          updateError.message || "Failed to create password. Please try again."
        );
      }

      setSuccess("Password updated successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formDisabled = isLoading || !!error && !email;

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
          {!sessionChecked ? (
            <p className="text-sm text-muted-foreground">Checking your link...</p>
          ) : (
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
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={formDisabled}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={formDisabled}
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={formDisabled}>
                {isLoading ? "Creating..." : "Create Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
