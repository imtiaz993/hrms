"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { supabase } from "@/lib/Supabase";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  const signOutAndError = async (message: string) => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setError(message);
  };

  useEffect(() => {
    const guard = async () => {
      setError("");

      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (session?.user) {
        const u = session.user;

        const { data: profile, error: profileError } = await supabase
          .from("employees")
          .select("*")
          .eq("id", u.id)
          .single();

        if (profileError || !profile) {
          await signOutAndError(
            "Unable to load your profile. Please login again."
          );
          setSessionChecked(true);
          return;
        }

        if (profile.is_deleted === true) {
          await signOutAndError(
            "This account has been deleted. Please contact admin."
          );
          setSessionChecked(true);
          return;
        }

        if (profile.is_active === false) {
          await signOutAndError(
            "Your account is deactivated. Contact admin to reactivate."
          );
          setSessionChecked(true);
          return;
        }

        localStorage.setItem("hrmsCurrentUser", JSON.stringify(profile));
        dispatch(setUser(profile));

        router.replace(
          profile.is_admin ? "/admin/dashboard" : "/employee/dashboard"
        );
        return;
      }

      setSessionChecked(true);
    };

    guard();
  }, [dispatch, router]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw new Error(
          authError.message || "Failed to login. Please check your credentials."
        );
      }

      const supaUser = data.user;
      if (!supaUser) {
        throw new Error("Unable to login. Please try again.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", supaUser.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error(
          "Unable to load your profile. Please contact support."
        );
      }

      if (profile.is_deleted === true) {
        await supabase.auth.signOut();
        throw new Error(
          "This account has been deleted. Please contact admin."
        );
      }

      if (profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error(
          "Your account is deactivated. Contact admin to reactivate."
        );
      }

      localStorage.setItem("hrmsCurrentUser", JSON.stringify(profile));
      dispatch(setUser(profile));

      router.push(
        profile.is_admin ? "/admin/dashboard" : "/employee/dashboard"
      );
    } catch (err: any) {
      setError(
        err?.message || "Failed to login. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
