'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { logout as logoutAction } from '@/store/authSlice';
import { supabase } from '@/lib/supabaseUser';
import { User, LogOut, Lock } from 'lucide-react';
import { Employee } from '@/types';

interface AdminHeaderProps {
  currentUser: Employee;
  onShowProfile: () => void;
  onShowChangePassword: () => void;
}

export function AdminHeader({
  currentUser,
  onShowProfile,
  onShowChangePassword,
}: AdminHeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const profileInitials = useMemo(() => {
    if (!currentUser) return '?';
    const first = currentUser.first_name?.charAt(0) ?? '';
    const last = currentUser.last_name?.charAt(0) ?? '';
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : '?';
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }

    localStorage.removeItem('hrmsCurrentUser');
    dispatch(logoutAction());
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex-1 lg:ml-64">
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Admin
            </p>
            <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
              Admin Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {currentUser.first_name} {currentUser.last_name}
            </p>
            <p className="text-xs text-gray-500">{currentUser.designation}</p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-label="Open profile menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">{profileInitials}</span>
            </button>

            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div
                  className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 text-sm shadow-lg"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onShowProfile();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onShowChangePassword();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Lock className="h-4 w-4 text-gray-400" />
                    Change Password
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
