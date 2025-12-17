'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

export default function EmployeeDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth
  );

  const isAdmin =
    Boolean((currentUser as any)?.is_admin) ||
    Boolean((currentUser as any)?.raw_app_meta_data?.is_admin);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (isAdmin) {
      router.replace('/admin/dashboard');
      return;
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

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

  // While redirecting, render nothing
  if (!isAuthenticated || isAdmin) {
    return null;
  }

  return <>{children}</>;
}
