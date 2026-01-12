"use client"; // Next.js 13+ app directory

import { useEffect, useState } from "react";
import { getFirebaseMessaging } from "../../../firebase";
import { getToken } from "firebase/messaging";

export default function FCMTokenManager() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const requestPermissionAndGetToken = async () => {
      try {
        if (!("Notification" in window)) return console.log("Browser not supported");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission denied");
          return;
        }
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;
        //  Register the service worker
        const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        // Get the FCM token
        const token = await getToken(messaging, {
          vapidKey: "BLJaC9ebeDDCWMDUspWw0N-4q-UKZ5nQfcNDBoEPYeQbU9UsFZaUtdqSF6tR6WvtVxv-J4kpBHTlJyRqk2z5jZc", // <- Replace with your actual VAPID key
          serviceWorkerRegistration: swRegistration,
        });

        if (token) {
          console.log(" FCM registration token:", token);
          setFcmToken(token);
        }
      } catch (err) {
        console.error("Error generating FCM token:", err);
      }
    };

    requestPermissionAndGetToken();
  }, []);

  return (
    <div>
      {fcmToken ? (
        <p className="text-green-600">FCM Token generated ✔️</p>
      ) : (
        <p className="text-gray-600">Waiting for notification permission...</p>
      )}
    </div>
  );
}

