"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  type ActionCodeSettings,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider } from "../firebase/clientApp";

export type Profile = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  handle?: string | null;
  createdAt?: DocumentData;
  updatedAt?: DocumentData;
};

type AuthCtx = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInFacebook: () => Promise<void>;
  registerEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updatePhotoURL: (url: string) => Promise<void>;
  signOutApp: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const upsertProfile = async (u: User) => {
    const ref = doc(db, "users", u.uid);
    const snap = await getDoc(ref);
    const existing = (snap.exists() ? (snap.data() as Partial<Profile>) : {}) || {};

    const base: Profile = {
      uid: u.uid,
      displayName: u.displayName ?? null,
      photoURL: u.photoURL ?? null,
      email: u.email ?? null,
      handle: existing.handle ?? null,
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp() });
    } else {
      await setDoc(ref, base, { merge: true });
    }

    const fresh = await getDoc(ref);
    setProfile(fresh.data() as Profile);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Fixed: Don't block the initial 'loading' state on the Firestore profile fetch.
      // This allows the Radio player to stay mounted while profile data loads.
      if (u) {
        upsertProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await upsertProfile(res.user);
    } catch (err) { console.error(err); }
  };

  const signInFacebook = async () => {
    try {
      const res = await signInWithPopup(auth, facebookProvider);
      await upsertProfile(res.user);
    } catch (err) { console.error(err); }
  };

  const registerEmail = async (email: string, password: string, displayName?: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(user, { displayName });
    await upsertProfile(user);
    const acs: ActionCodeSettings = {
      url: `${window.location.origin}/login?verified=1`,
      handleCodeInApp: false,
    };
    await sendEmailVerification(user, acs);
    await signOut(auth);
  };

  const signInEmail = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    if (!user.emailVerified) {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login?verified=1`,
        handleCodeInApp: false,
      });
      await signOut(auth);
      throw new Error("Please verify your email.");
    }
    await upsertProfile(user);
  };

  const resendVerification = async () => {
    if (!auth.currentUser) throw new Error("Sign in first.");
    await sendEmailVerification(auth.currentUser, {
      url: `${window.location.origin}/login?verified=1`,
      handleCodeInApp: false,
    });
  };

  const updateDisplayName = async (name: string) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName: name });
    await upsertProfile(auth.currentUser);
  };

  const updatePhotoURL = async (url: string) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { photoURL: url });
    await upsertProfile(auth.currentUser);
  };

  const signOutApp = async () => {
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user, profile, loading, signInGoogle, signInFacebook,
      registerEmail, signInEmail, resendVerification,
      updateDisplayName, updatePhotoURL, signOutApp,
    }),
    [user, profile, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider/>");
  return ctx;
};