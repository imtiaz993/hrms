'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Users, CalendarCheck, Calendar, DollarSign } from 'lucide-react';
import { logout as logoutAction } from '@/store/authSlice';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !currentUser?.is_admin)) {
      router.push('/login');
    }
  }, [isAuthenticated, currentUser, isLoading, router]);

  const handleLogout = async () => {
    localStorage.removeItem('hrmsCurrentUser');
    dispatch(logoutAction());
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
                <p className="text-sm text-gray-500">
                  Welcome, {currentUser.first_name} {currentUser.last_name}
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
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
                pathname === '/admin/dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            <Link
              href="/admin/dashboard/employees"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname?.startsWith('/admin/dashboard/employees')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Employees
            </Link>
            <Link
              href="/admin/dashboard/attendance"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === '/admin/dashboard/attendance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Attendance
            </Link>
            <Link
              href="/admin/dashboard/leaves"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === '/admin/dashboard/leaves'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Leave Requests
            </Link>
            <Link
              href="/admin/dashboard/payroll"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname?.startsWith('/admin/dashboard/payroll') || pathname?.startsWith('/admin/dashboard/settings/payroll')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Payroll
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
