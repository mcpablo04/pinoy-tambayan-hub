"use client";

import { useEffect } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext";

function anonId() {
  const KEY = "pth_session_id";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      const rand =
        (globalThis.crypto?.randomUUID?.() as string | undefined) ??
        Math.random().toString(36).slice(2);
      id = `anon-${rand}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `anon-${Math.random().toString(36).slice(2)}`;
  }
}

type Props = { path: string };

export default function PagePresence({ path }: Props) {
  const { user } = useAuth();

  useEffect(() => {
    // Use UID when signed in, anon-* when signed out (matches rules)
    const id = user?.uid ?? anonId();
    const ref = doc(db, "page_presence", id);

    const base = {
      id,
      uid: user?.uid ?? null, // rules validate this
      path,
      lastActive: serverTimestamp(),
      since: serverTimestamp(),
    };

    // create/merge
    setDoc(ref, base, { merge: true }).catch(() => {});

    // heartbeat
    const t = setInterval(() => {
      updateDoc(ref, {
        lastActive: serverTimestamp(),
        path,
        uid: user?.uid ?? null,
      }).catch(() => {});
    }, 25_000);

    // bump when tab becomes visible
    const onVis = () => {
      if (!document.hidden) {
        updateDoc(ref, { lastActive: serverTimestamp(), path }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      updateDoc(ref, { lastActive: serverTimestamp() }).catch(() => {});
    };
  }, [user?.uid, path]); // switch anon <-> uid correctly

  return null;
}
