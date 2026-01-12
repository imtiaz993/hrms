// public/firebase-messaging-sw.js

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDjh7isxVoGEEYhFcvqW6kbnZVmt3dR-6Q",
  authDomain: "employee-management-syst-e715f.firebaseapp.com",
  projectId: "employee-management-syst-e715f",
  storageBucket: "employee-management-syst-e715f.firebasestorage.app",
  messagingSenderId: "732424393576",
  appId: "1:732424393576:web:5dace9ba660c55b51bfcdd",
  measurementId: "G-VZFBFNHJ28"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Optional: handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
});
