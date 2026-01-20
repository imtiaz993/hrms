import { supabase } from "@/lib/supabaseUser";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout as logoutAction } from "@/store/authSlice";
import { Bell, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { ProfilePopup } from "@/components/employee/profile-popup";
import { ChangePasswordPopup } from "@/components/employee/change-password-popup";

const Header = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser }: any = useAppSelector((state) => state.auth);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>();
  const [notification, setNotification] = useState<any>([]);
  const [isOpen, setOpen] = useState(false);

  const profileInitials = useMemo(() => {
    if (!currentUser) return "?";
    const first = currentUser.first_name?.charAt(0) ?? "";
    const last = currentUser.last_name?.charAt(0) ?? "";
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : "?";
  }, [currentUser]);

  const handleIconClick = () => {
    setOpen(!isOpen);
    if (!isOpen) {
      fetchNotification();
    }
  };

  const closeProfileMenu = () => setProfileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
    localStorage.removeItem("hrmsCurrentUser");
    dispatch(logoutAction());
    router.push("/login");
  };

  const fetchNotification = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "user")
      .eq("id", currentUser?.id);
    if (error) setError(error);
    else setNotification(data || []);
    console.log("notification", data);

    setLoading(false);
  };

  return (
    <>
      {showProfile && (
        <ProfilePopup
          employee={currentUser}
          onClose={() => setShowProfile(false)}
          onChangePassword={() => {
            setShowProfile(false);
            setShowChangePassword(true);
          }}
        />
      )}

      {showChangePassword && (
        <ChangePasswordPopup
          employee={currentUser}
          onClose={() => setShowChangePassword(false)}
        />
      )}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Employee Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Notification Icon */}
              <button
                onClick={handleIconClick}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                <Bell className="h-5 w-5" />
              </button>
              {/* Dropdown */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-lg z-50 max-h-80   overflow-y-auto">
                  {loading ? (
                    <p className="p-4 text-gray-500">Loading...</p>
                  ) : notification.length === 0 ? (
                    <p className="p-4 text-gray-500">No notifications</p>
                  ) : (
                    notification.map((n: any) => (
                      <div
                        key={n.id}
                        className="p-3 border-b hover:bg-gray-100 cursor-pointer"
                      >
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-sm text-gray-600">
                          {n.body || n.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-label="Open profile menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
              >
                <span aria-hidden="true">{profileInitials}</span>
              </button>

              {profileMenuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white/95 p-2 text-sm shadow-lg backdrop-blur-sm"
                  role="menu"
                  aria-label="Profile menu"
                >
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Signed in as
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {currentUser.first_name} {currentUser.last_name}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeProfileMenu();
                      setShowProfile(true);
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    role="menuitem"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                      <User className="h-3 w-3" />
                    </span>
                    <span className="text-sm">View profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeProfileMenu();
                      setShowChangePassword(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    role="menuitem"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                      <span className="h-1.5 w-3 rounded-sm border border-slate-400" />
                    </span>
                    <span className="text-sm">Change password</span>
                  </button>
                  <div className="mt-1 border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        closeProfileMenu();
                        handleLogout();
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      role="menuitem"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
