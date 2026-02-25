// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// --- Fallback Config for Local Development ---
const devCfg = {
  apiKey: "AIzaSyA9C8pmAwqx2QodJ12oImi64NVV9ZG8awo",
  authDomain: "pinot-tambayan.firebaseapp.com",
  projectId: "pinot-tambayan",
  storageBucket: "pinot-tambayan.appspot.com",
  messagingSenderId: "257561318071",
  appId: "1:257561318071:web:8b2f3939f3de17fd55f332",
};

// --- Use Environment Variables if they exist, else use devCfg ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? devCfg.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? devCfg.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? devCfg.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? devCfg.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? devCfg.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? devCfg.appId,
};

// Initialize Firebase (Safe for Next.js HMR)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Exports ---
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// --- Auth Providers ---
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const facebookProvider = new FacebookAuthProvider();

export default app;