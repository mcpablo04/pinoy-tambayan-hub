// src/components/ChatBox.tsx
"use client";

import { useEffect, useRef, useState, FormEvent, useLayoutEffect } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext";

type Msg = {
  id: string;
  uid?: string | null;
  name: string;
  text: string;
  createdAt?: { seconds: number } | null;
};

export default function ChatBox() {
  const { user, profile, loading } = useAuth();

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Prefill display name for signed-in users (don’t overwrite manual edits)
  useEffect(() => {
    if (profile?.displayName && !name) setName(profile.displayName);
  }, [profile?.displayName, name]);

  // Scrollable container for messages (not the page)
  const listRef = useRef<HTMLDivElement | null>(null);
  const didInitialSnapshot = useRef(false);

  // realtime messages (last 200, oldest → newest)
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const list: Msg[] = [];
      snap.forEach((d) => {
        const data = d.data() as DocumentData;
        list.push({
          id: d.id,
          uid: (data.uid ?? null) as string | null,
          name: (data.name ?? "").toString(),
          text: (data.text ?? "").toString(),
          createdAt: data.createdAt ?? null,
        });
      });
      setMessages(list);
      if (!didInitialSnapshot.current) didInitialSnapshot.current = true;
    });
    return () => unsub();
  }, []);

  // Keep the internal list scrolled to bottom when new messages arrive
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    if (nearBottom || !didInitialSnapshot.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!user) {
      setErr("Please sign in to chat.");
      return;
    }

    const trimmedName = name.trim().slice(0, 40);
    const trimmedText = text.trim().slice(0, 500);
    if (!trimmedName || !trimmedText) return;

    await addDoc(collection(db, "messages"), {
      uid: user.uid,
      name: trimmedName,
      text: trimmedText,
      createdAt: serverTimestamp(),
    });

    setText("");

    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  const disabled = loading || !user;

  return (
    <div className="rounded-xl bg-gray-800/80 p-4 sm:p-6 shadow-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-3 sm:mb-4">Live Chat</h3>

      {/* Scroll area */}
      <div
        ref={listRef}
        className="rounded-md bg-gray-900/60 border border-gray-700 p-3 sm:p-4 
                   max-h-[46vh] sm:max-h-80 overflow-y-auto"
        style={{ overscrollBehavior: "contain", scrollBehavior: "auto" }}
      >
        <ul className="space-y-2 text-sm sm:text-base">
          {messages.map((m) => (
            <li key={m.id}>
              <span className="text-blue-400 font-medium">{m.name}</span>
              <span className="ml-2 text-gray-200 break-words">{m.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Input row */}
      <form onSubmit={onSend} className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          disabled={disabled}
          className="w-full sm:w-40 rounded-md bg-gray-700/90 text-white px-3 py-2 
                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Message..." : "Sign in to chat"}
          disabled={disabled}
          className="flex-1 rounded-md bg-gray-700/90 text-white px-3 py-2 
                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white 
                     hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>

      {!user && !loading && (
        <div className="mt-2 text-xs text-gray-400">
          Please <Link href="/login" className="underline">sign in</Link> to participate in the chat.
        </div>
      )}
      {err && <div className="mt-2 text-sm text-amber-300">{err}</div>}
    </div>
  );
}
