// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

export { app, analytics, messaging, getToken, onMessage };
