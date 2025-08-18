// src/components/ChatBox.tsx
"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
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

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const display = profile?.displayName || user?.displayName || "";
    if (display && !name) setName(display);
  }, [profile?.displayName, user?.displayName, name]);

  // Hard pin to bottom (instant — no smooth)
  const hardScrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    // double RAF: wait for DOM paint before measuring
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
        hardScrollToBottom(); // always pin after new snapshot
      },
      (e) => setErr(e?.message || "Failed to load chat.")
    );

    return () => unsub();
  }, []);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    const trimmedName = name.trim().slice(0, 40);
    const trimmedText = text.trim().slice(0, 500);
    if (!trimmedName || !trimmedText) return;

    try {
      if (user) {
        await addDoc(collection(db, "messages"), {
          uid: user.uid,
          name: trimmedName,
          photoURL: user.photoURL || profile?.photoURL || null,
          text: trimmedText,
          createdAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "messages"), {
          name: trimmedName,
          text: trimmedText,
          createdAt: serverTimestamp(),
        });
      }

      setText("");
      hardScrollToBottom(); // pin immediately after your send
    } catch (e: any) {
      setErr(e?.message || "Failed to send. Check Firestore rules/project config.");
    }
  }

  const disabled = loading && !user;
  const mePhoto = user?.photoURL || profile?.photoURL || undefined;
  const meInitial = (profile?.displayName || user?.displayName || name || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="rounded-xl bg-gray-800/80 p-4 sm:p-6 shadow-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-3 sm:mb-4">Live Chat</h3>

      {/* Fixed-height scroll area; a little bottom padding to avoid clipping */}
      <div
        ref={listRef}
        className="rounded-md bg-gray-900/60 border border-gray-700 p-3 sm:p-4
                   h-80 sm:h-96 overflow-y-auto min-h-0 pb-2"
      >
        <ul className="space-y-3 text-sm sm:text-base">
          {messages.map((m) => (
            <li key={m.id} className="flex items-start gap-3">
              {m.photoURL ? (
                <img
                  src={m.photoURL}
                  alt={m.name}
                  className="rounded-full object-cover"
                  width={32} height={32}     // ⬅️ fixed intrinsic size prevents layout shift
                  draggable={false}          // ⬅️ no ghost-drag preview
                  loading="lazy"
                />
              ) : (
                <div
                  className="bg-gray-700 text-gray-300 text-xs grid place-items-center rounded-full"
                  style={{ width: 32, height: 32 }} // ⬅️ same fixed size
                >
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

      {/* Input row */}
      <form
        onSubmit={onSend}
        className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {mePhoto ? (
            <img
              src={mePhoto}
              alt="You"
              className="rounded-full object-cover"
              width={36} height={36}      // ⬅️ fixed size here too
              draggable={false}
            />
          ) : (
            <div
              className="bg-gray-700 text-gray-300 text-sm grid place-items-center rounded-full"
              style={{ width: 36, height: 36 }}
            >
              {meInitial}
            </div>
          )}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          disabled={disabled}
          className="w-full sm:w-40 rounded-md bg-gray-700/90 text-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Message..." : "Message (guest)"}
          disabled={disabled}
          className="flex-1 rounded-md bg-gray-700/90 text-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Send
        </button>
      </form>

      {!user && !loading && (
        <div className="mt-2 text-xs text-gray-400">
          Want your avatar & name auto-filled?{" "}
          <Link href="/login" className="underline">Sign in</Link>.
        </div>
      )}
      {err && <div className="mt-2 text-sm text-amber-300">{err}</div>}
    </div>
  );
}
