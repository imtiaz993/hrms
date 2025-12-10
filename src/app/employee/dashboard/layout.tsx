'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { LogOut, Clock, Calendar, DollarSign, BarChart3, PartyPopper, User as UserIcon, ClipboardList } from 'lucide-react';
import { logout as logoutAction } from '@/store/authSlice';

export default function EmployeeDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, currentUser } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

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

  if (!isAuthenticated) {
    return null;
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
              href="/employee/dashboard"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === '/employee/dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Time Tracking
            </Link>
            <Link
              href="/employee/dashboard/attendance-log"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === '/employee/dashboard/attendance-log'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Daily Log
            </Link>
            <Link
              href="/employee/dashboard/leave"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === '/employee/dashboard/leave'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Leave & Holidays
            </Link>
            <Link
              href="/employee/dashboard/salary"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === '/employee/dashboard/salary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Salary
            </Link>
            <Link
              href="/employee/dashboard/attendance-analytics"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === '/employee/dashboard/attendance-analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
            <Link
              href="/employee/dashboard/events"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname === '/employee/dashboard/events'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <PartyPopper className="h-4 w-4 mr-2" />
              Events
            </Link>
            <Link
              href="/employee/dashboard/profile"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                pathname?.startsWith('/employee/dashboard/profile')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
