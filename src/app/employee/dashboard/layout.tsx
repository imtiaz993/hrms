"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Clock,
  Calendar,
  DollarSign,
  BarChart3,
  PartyPopper,
  User as UserIcon,
  ClipboardList,
} from "lucide-react";

export default function EmployeeDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // adjust selector to your actual slice name if needed
  const currentUser = useAppSelector((state: any) => state.user?.currentUser);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // not logged in → go to login
      if (!user) {
        router.replace("/login");
        return;
      }

      // check role
      const { data: employee } = await supabase
        .from("employees")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      // if admin → send to admin dashboard
      if (employee?.is_admin) {
        router.replace("/admin/dashboard");
        return;
      }

      setChecking(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Employee Portal
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome, {currentUser?.first_name} {currentUser?.last_name}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/employee/dashboard"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === "/employee/dashboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Time Tracking
            </Link>

            <Link
              href="/employee/dashboard/attendance-log"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === "/employee/dashboard/attendance-log"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Daily Log
            </Link>

            <Link
              href="/employee/dashboard/leave"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === "/employee/dashboard/leave"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Leave & Holidays
            </Link>

            <Link
              href="/employee/dashboard/salary"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === "/employee/dashboard/salary"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Salary
            </Link>

            <Link
              href="/employee/dashboard/attendance-analytics"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === "/employee/dashboard/attendance-analytics"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>

            <Link
              href="/employee/dashboard/events"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === "/employee/dashboard/events"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <PartyPopper className="h-4 w-4 mr-2" />
              Events
            </Link>

            <Link
              href="/employee/dashboard/profile"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname?.startsWith("/employee/dashboard/profile")
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
