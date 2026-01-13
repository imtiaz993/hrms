import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyDjh7isxVoGEEYhFcvqW6kbnZVmt3dR-6Q",
  authDomain: "employee-management-syst-e715f.firebaseapp.com",
  projectId: "employee-management-syst-e715f",
  storageBucket: "employee-management-syst-e715f.firebasestorage.app",
  messagingSenderId: "732424393576",
  appId: "1:732424393576:web:5dace9ba660c55b51bfcdd",
  measurementId: "G-VZFBFNHJ28",
};
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const analytics =
  typeof window !== "undefined" ? getAnalytics(firebaseApp) : null;

export const messaging =
  typeof window !== "undefined" ? getMessaging(firebaseApp) : null;

//  Firebase Cloud Messaging (safe check)
export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (!supported) return null;

  return getMessaging(firebaseApp);
};
