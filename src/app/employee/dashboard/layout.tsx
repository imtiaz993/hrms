"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Loader from "@/components/loader";
import { Messaging, onMessage } from "firebase/messaging";
import { messaging } from "../../../firebase";
import { useToast } from "@/components/ui/toast";
import { requestPermissionAndGetToken } from "@/lib/fcmToken";

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
      router.replace("/login");
      return;
    }

    if (isAdmin) {
      router.replace("/admin/dashboard");
      return;
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

// useEffect(() => {
//   if (typeof window === "undefined") return;
//   if (!("Notification" in window)) return;

//   Notification.requestPermission().then((permission) => {
//     console.log("Notification permission:", permission);
//   });

//   const unsubscribe = onMessage(messaging as Messaging, (payload: any) => {
//     console.log("FCM Foreground payload:", payload);

//     // Toast (UI)
//     addToast({
//       title: payload.notification?.title ?? "New Notification",
//       description: payload.notification?.body ?? "",
//       variant: "success",
//     });

//     // Optional: Browser notification too
//     if (Notification.permission === "granted") {
//       new Notification(payload.notification.title, {
//         body: payload.notification.body,
//       });
//     }
//   });

//   return () => unsubscribe();
// }, []);

  const { addToast } = useToast();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      !isLoading &&
      isAuthenticated &&
      !isAdmin
    ) {
      requestPermissionAndGetToken({ type: "employee" });
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const unsubscribe = onMessage(messaging as Messaging, (payload: any) => {
        console.log(payload);
        addToast({
          title: payload.title,
          description: payload.body,
          variant: "success",
        });
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  // While redirecting, render nothing
  if (!isAuthenticated || isAdmin) {
    return null;
  }

  return <>{children}</>;
}
