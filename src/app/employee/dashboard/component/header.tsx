import { supabase } from "@/lib/supabaseUser";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout as logoutAction } from "@/store/authSlice";
import { Bell, LogOut, User, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ProfilePopup } from "@/components/employee/profile-popup";
import { ChangePasswordPopup } from "@/components/employee/change-password-popup";

const NotificationSkeleton = () => {
  return (
    <div className="p-3 border-b">
      <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-2" />
      <div className="h-3 w-72 bg-slate-200 rounded animate-pulse mb-2" />
      <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
    </div>
  );
};

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

  const notifWrapRef = useRef<HTMLDivElement | null>(null);
  const profileWrapRef = useRef<HTMLDivElement | null>(null);

  const profileInitials = useMemo(() => {
    if (!currentUser) return "?";
    const first = currentUser.first_name?.charAt(0) ?? "";
    const last = currentUser.last_name?.charAt(0) ?? "";
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : "?";
  }, [currentUser]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        isOpen &&
        notifWrapRef.current &&
        !notifWrapRef.current.contains(target)
      ) {
        setOpen(false);
      }

      if (
        profileMenuOpen &&
        profileWrapRef.current &&
        !profileWrapRef.current.contains(target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [isOpen, profileMenuOpen]);

  const handleIconClick = () => {
    setOpen((prev) => {
      const next = !prev;
      if (!prev && !next) return next;
      if (!prev && next) fetchNotification();
      return next;
    });
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
    setError(undefined);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "employee")
      .eq("employee_id", currentUser?.id);

    if (error) setError(error);
    else setNotification(data || []);

    setLoading(false);
  };

  const filternotification =[...notification].sort(
    (a,b)=> new Date(a.created_at).getTime()-new Date(b.created_at).getTime()
  )

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
            {/* Notifications */}
            <div className="relative" ref={notifWrapRef}>
              <button
                onClick={handleIconClick}
                aria-label="Open notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
              >
                <Bell className="h-5 w-5" />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-2xl z-50 max-h-80 overflow-y-auto border border-slate-100">
                  {/* Loading skeleton */}
                  {loading ? (
                    <div className="py-1">
                      {Array.from({ length: 2 }).map((_, idx) => (
                        <NotificationSkeleton key={idx} />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="p-4 text-sm text-red-600">
                      Failed to load notifications.
                    </div>
                  ) : notification.length === 0 ? (
                    <div className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        No notifications
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        You’re all caught up.
                      </p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {filternotification.map((n: any) => (
                        <div
                          key={n.id}
                          className="p-3 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                        >
                          <p className="font-semibold text-slate-900">
                            {n.title}
                          </p>
                          <p className="text-sm text-slate-600">
                            {n.body || n.message}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(() => {
                              console.log("created_at raw:", n.created_at);

                              if (!n.created_at) return "no time";

                              const d = new Date(n.created_at);
                              console.log("parsed date:", d.toString());

                              return d.toLocaleTimeString("en-PK", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              });
                            })()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileWrapRef}>
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
