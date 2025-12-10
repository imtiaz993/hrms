"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calendar,
  DollarSign,
} from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // adjust selector if your slice name is different
  const currentUser = useAppSelector((state: any) => state.user?.currentUser);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: employee } = await supabase
        .from("employees")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      // if not admin → kick to employee dashboard
      if (!employee?.is_admin) {
        router.replace("/employee/dashboard");
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
              <LayoutDashboard className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Portal
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome, {currentUser?.first_name || ""}{" "}
                  {currentUser?.last_name || ""}
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
              href="/admin/dashboard"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === "/admin/dashboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>

            <Link
              href="/admin/dashboard/employees"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname?.startsWith("/admin/dashboard/employees")
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Employees
            </Link>

            <Link
              href="/admin/dashboard/attendance"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === "/admin/dashboard/attendance"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Attendance
            </Link>

            <Link
              href="/admin/dashboard/leaves"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === "/admin/dashboard/leaves"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Leave Requests
            </Link>

            <Link
              href="/admin/dashboard/payroll"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname?.startsWith("/admin/dashboard/payroll") ||
                pathname?.startsWith("/admin/dashboard/settings/payroll")
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Payroll
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
