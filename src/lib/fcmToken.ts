import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "../firebase";
import { supabase } from "@/lib/supabaseUser";

export const requestPermissionAndGetToken = async (data: { type: "admin" | "employee" }) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return console.log("User not logged in");

    if (!("Notification" in window))
      return console.log("Browser not supported");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return;
    }
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.log("FCM Messaging not supported in this browser");
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("❌ NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing in env!");
      return;
    }

    const swRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log("✅ FCM Token generated:", token);
      await fetch("/api/save-fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId: user.id, type: data.type }),
      });
    } else {
      console.log("⚠️ No registration token available. Request permission to generate one.");
    }
  } catch (err) {
    console.error("❌ Error generating FCM token:", err);
  }
};
