"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { ProfilePopup } from "@/components/employee/profile-popup";
import { ChangePasswordPopup } from "@/components/employee/change-password-popup";
import { Messaging, onMessage } from "firebase/messaging";
import { messaging } from "../../../firebase";
import { useToast } from "@/components/ui/toast";
import { requestPermissionAndGetToken } from "@/lib/fcmToken";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const isAdmin =
    Boolean((currentUser as any)?.is_admin) ||
    Boolean((currentUser as any)?.raw_app_meta_data?.is_admin);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!isAdmin) {
      router.replace("/employee/dashboard");
      return;
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      requestPermissionAndGetToken({ type: "admin" });
    }
  }, []);

  const { addToast } = useToast();

 useEffect(() => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    const unsubscribe = onMessage(messaging as Messaging, (payload: any) => {
      console.log("🔥 FCM FOREGROUND PAYLOAD:", payload);

      // Safe access
      const title = payload.notification?.title || "Notification";
      const body = payload.notification?.body || "";

      // Show toast
      addToast({
        title,
        description: body,
        variant: "success",
      });

      // Optional: alert to confirm
      alert(`FCM Received!\nTitle: ${title}\nBody: ${body}`);
    });

    return () => {
      unsubscribe();
    };
  }
}, []);

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

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminHeader
          currentUser={currentUser!}
          onShowProfile={() => setShowProfile(true)}
          onShowChangePassword={() => setShowChangePassword(true)}
        />

        <main className="px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>

      {showProfile && currentUser && (
        <ProfilePopup
          employee={currentUser}
          onClose={() => setShowProfile(false)}
          onChangePassword={() => {
            setShowProfile(false);
            setShowChangePassword(true);
          }}
        />
      )}

      {showChangePassword && currentUser && (
        <ChangePasswordPopup
          employee={currentUser}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
