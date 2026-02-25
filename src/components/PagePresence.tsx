"use client";

import { useEffect, useRef } from "react";
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

function anonId() {
  const KEY = "pth_session_id";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      const rand = (globalThis.crypto?.randomUUID?.()) ?? Math.random().toString(36).slice(2);
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
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentId = user?.uid ?? anonId();
    const ref = doc(db, "page_presence", currentId);

    // 1. Cleanup old ID if user just logged in (prevents double counting)
    if (lastIdRef.current && lastIdRef.current !== currentId) {
      const oldRef = doc(db, "page_presence", lastIdRef.current);
      deleteDoc(oldRef).catch(() => {});
    }
    lastIdRef.current = currentId;

    const initPresence = async () => {
      try {
        await setDoc(ref, {
          id: currentId,
          uid: user?.uid ?? null,
          displayName: user?.displayName ?? "Ka-Tambayan",
          photoURL: user?.photoURL ?? null,
          path,
          lastActive: serverTimestamp(),
          since: serverTimestamp(),
          isOnline: true
        }, { merge: true });
      } catch (e) {
        console.warn("Presence init failed:", e);
      }
    };

    initPresence();

    // 2. Optimized Heartbeat (Only runs if tab is active)
    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateDoc(ref, {
          lastActive: serverTimestamp(),
          path,
          uid: user?.uid ?? null,
        }).catch(() => {});
      }
    }, 30_000); // 30s is the "sweet spot" for Firebase usage vs accuracy

    // 3. Activity Listener (Bumps presence on interaction)
    const bumpPresence = () => {
      if (document.visibilityState === 'visible') {
        updateDoc(ref, { lastActive: serverTimestamp() }).catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", bumpPresence);
    window.addEventListener("focus", bumpPresence);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", bumpPresence);
      window.removeEventListener("focus", bumpPresence);
      
      // Mark as offline on unmount
      updateDoc(ref, { 
        isOnline: false,
        lastActive: serverTimestamp() 
      }).catch(() => {});
    };
  }, [user?.uid, path]);

  return null;
}