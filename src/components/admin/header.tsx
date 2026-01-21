"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { logout as logoutAction } from "@/store/authSlice";
import { supabase } from "@/lib/supabaseUser";
import { User, LogOut, Lock } from "lucide-react";
import { Employee } from "@/types";
import { Bell } from "lucide-react";

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
   const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>();
  const [notification, setNotification] = useState<any>([]);
  const [isOpen, setOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const profileInitials = useMemo(() => {
    if (!currentUser) return "?";
    const first = currentUser.first_name?.charAt(0) ?? "";
    const last = currentUser.last_name?.charAt(0) ?? "";
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : "?";
  }, [currentUser]);
 const fetchNotification = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "admin");
    if (error) setError(error);
    else setNotification(data || []);
    console.log("notification", data);

    setLoading(false);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("hrmsCurrentUser");
    dispatch(logoutAction());
    router.replace("/login");
  };
 const handleIconClick = () => {
    setOpen(!isOpen);
    if (!isOpen) {
      fetchNotification();
    }
  };
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex-1 lg:ml-64"></div>

        <div className="flex items-center gap-3">
          
       <div className="relative">
  {/* Notification Icon */}
  <button
    onClick={handleIconClick}
    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
  >
    <Bell className="h-5 w-5" />

    {/* Unread indicator (optional) */}
    {notification?.some((n: any) => !n.read) && (
      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
    )}
  </button>

  {/* Dropdown */}
  {isOpen && (
    <div className="absolute right-0 mt-3 w-80 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h4 className="text-sm font-semibold text-slate-800">
          Notifications
        </h4>
       
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
            Loading notifications…
          </div>
        ) : notification.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500 text-sm">
            <Bell className="h-6 w-6 mb-2 opacity-50" />
            No notifications
          </div>
        ) : (
          notification.map((n: any) => (
            <div
              key={n.id}
              className={`px-4 py-3 border-b last:border-b-0 cursor-pointer transition
                hover:bg-slate-50 ${
                  !n.read ? "bg-blue-50/50" : ""
                }`}
            >
              <div className="flex items-start gap-2">
                {/* Unread dot */}
                {!n.read && (
                  <span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
                )}

                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {n.title}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {n.body || n.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )}
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
