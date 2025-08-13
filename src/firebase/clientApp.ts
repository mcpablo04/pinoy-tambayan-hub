// src/firebase/clientApp.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const req = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

const firebaseConfig = {
  apiKey: req("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: req("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),          // pinot-tambayan.firebaseapp.com
  projectId: req("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),            // pinot-tambayan
  storageBucket: req("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),    // pinot-tambayan.appspot.com
  messagingSenderId: req("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: req("NEXT_PUBLIC_FIREBASE_APP_ID"),
  // measurementId optional
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
// Optional: force account picker each time
googleProvider.setCustomParameters({ prompt: "select_account" });
