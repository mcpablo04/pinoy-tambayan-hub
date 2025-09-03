// src/components/ChatBox.tsx
"use client";

import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  limitToLast,
} from "firebase/firestore";
import { db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext";

type Msg = {
  id: string;
  uid?: string | null;
  name: string;
  photoURL?: string | null;
  text: string;
  createdAt?: { seconds: number } | null;
};

export default function ChatBox() {
  const { user, profile, loading } = useAuth();

  // Fixed, non-editable display name. If empty, user must set it in their profile.
  const displayName = useMemo(
    () => (profile?.displayName || user?.displayName || "").trim(),
    [profile?.displayName, user?.displayName]
  );

  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  // Hard pin to bottom (instant — no smooth)
  const hardScrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
  };

  // Live messages — only last 20; newest at bottom
  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc"),
      limitToLast(20)
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const list: Msg[] = [];
        snap.forEach((d) => {
          const data = d.data() as DocumentData;
          list.push({
            id: d.id,
            uid: (data.uid ?? null) as string | null,
            name: (data.name ?? "").toString(),
            photoURL: (data.photoURL ?? null) as string | null,
            text: (data.text ?? "").toString(),
            createdAt: data.createdAt ?? null,
          });
        });

        setMessages(list);
        hardScrollToBottom();
      },
      (e) => setErr(e?.message || "Failed to load chat.")
    );

    return () => unsub();
  }, []);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    // Require sign-in and a valid (non-empty) display name
    if (!user || !displayName) return;

    const trimmedText = text.trim().slice(0, 500);
    if (!trimmedText) return;

    try {
      await addDoc(collection(db, "messages"), {
        uid: user.uid,
        name: displayName.slice(0, 40),
        photoURL: user.photoURL || profile?.photoURL || null,
        text: trimmedText,
        createdAt: serverTimestamp(),
      });

      setText("");
      hardScrollToBottom();
    } catch (e: any) {
      setErr(e?.message || "Failed to send. Check Firestore rules/project config.");
    }
  }

  const disabled = loading || !user;
  const mePhoto = user?.photoURL || profile?.photoURL || undefined;
  const meInitial = (displayName || "?").charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl bg-gradient-to-b from-gray-900/90 to-gray-950/90 p-4 sm:p-6 shadow-xl border border-gray-800">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative h-2.5 w-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">Live Chat</h3>
      </div>

      {/* Fixed-height scroll area */}
      <div
        ref={listRef}
        className="rounded-xl bg-gray-950/60 border border-gray-800 p-3 sm:p-4
                   h-80 sm:h-96 overflow-y-auto min-h-0"
      >
        <ul className="space-y-3 text-sm sm:text-base">
          {messages.map((m) => (
            <li key={m.id} className="flex items-start gap-3">
              {m.photoURL ? (
                <div className="avatar avatar-sm shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.photoURL} alt={m.name} draggable={false} loading="lazy" />
                </div>
              ) : (
                <div className="avatar avatar-sm grid place-items-center text-xs text-gray-300">
                  {m.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-blue-400 font-medium">{m.name}</span>
                <p className="text-gray-200 break-words">{m.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Composer */}
      <div className="mt-3 sm:mt-4">
        {!user ? (
          // Sign-in gate (no guest posting)
          <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 text-sm text-gray-300">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="avatar avatar-md grid place-items-center text-sm text-gray-300">?</div>
                <div>
                  <div className="font-medium">Sign in to join the chat</div>
                  <div className="text-xs text-gray-400">Only signed-in users can send messages.</div>
                </div>
              </div>
              <Link
                href="/login"
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSend}
            className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {mePhoto ? (
                <div className="avatar avatar-md shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mePhoto} alt="You" draggable={false} />
                </div>
              ) : (
                <div className="avatar avatar-md grid place-items-center text-sm text-gray-300">
                  {meInitial}
                </div>
              )}
              <span className="rounded-md bg-gray-800/80 text-gray-200 text-xs px-2 py-1 border border-white/10">
                {displayName || "Unnamed"}
              </span>
            </div>

            {/* Name removed (locked). Message input only. */}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              disabled={disabled}
              maxLength={500}
              className="flex-1 rounded-md bg-gray-800/80 text-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />

            <button
              type="submit"
              disabled={disabled || !text.trim()}
              className="shrink-0 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        )}
      </div>

      {err && <div className="mt-2 text-sm text-amber-300">{err}</div>}
    </div>
  );
}
