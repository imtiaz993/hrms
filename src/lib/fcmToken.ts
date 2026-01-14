import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "../firebase";
import { supabase } from "@/lib/supabaseUser";

export const requestPermissionAndGetToken = async (data: any) => {
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
    if (!messaging) return;
    //  Register the service worker
    const swRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    // Get the FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.VPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    await fetch("/api/save-fcm-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, userId: user.id, type: data.type }),
    });
  } catch (err) {
    console.error("Error generating FCM token:", err);
  }
};
