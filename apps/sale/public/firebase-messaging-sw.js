// Firebase Cloud Messaging Service Worker
// This service worker handles background push notifications

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVQYWNNgsbGhqTDB9U1jAEu1g6oK2hXfc",
  authDomain: "nam-28831.firebaseapp.com",
  projectId: "nam-28831",
  storageBucket: "nam-28831.firebasestorage.app",
  messagingSenderId: "552206044423",
  appId: "1:552206044423:web:62cb55f3f0d129025ec9a2",
  measurementId: "G-C2V22RS1MZ",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload,
  );

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/logo.png",
    badge: "/logo.png",
    image: payload.notification?.image,
    data: payload.data,
    tag: payload.data?.id || Date.now().toString(),
    requireInteraction: false,
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [],
  };

  // Show notification
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions,
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event);

  event.notification.close();

  // Get the URL to open
  const urlToOpen = event.notification.data?.link || "/";

  // Focus or open the app window
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[firebase-messaging-sw.js] Notification closed:", event);
});
