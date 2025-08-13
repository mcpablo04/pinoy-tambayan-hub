"use client";

import { useEffect, useRef, useState, FormEvent, useLayoutEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext"; // 🔹 NEW

type Msg = {
  id: string;
  name: string;
  text: string;
  createdAt?: { seconds: number } | null;
};

export default function ChatBox() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);

  const { profile } = useAuth(); // 🔹 NEW

  // Prefill name from signed‑in profile (don’t overwrite manual edits)
  useEffect(() => {
    if (profile?.displayName && !name) setName(profile.displayName);
  }, [profile?.displayName, name]); // 🔹 NEW

  // Scrollable container for messages (not the page)
  const listRef = useRef<HTMLDivElement | null>(null);
  const didInitialSnapshot = useRef(false);

  // realtime messages
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: Msg[] = [];
      snap.forEach((d) => {
        const data = d.data() as DocumentData;
        list.push({
          id: d.id,
          name: (data.name ?? "").toString(),
          text: (data.text ?? "").toString(),
          createdAt: data.createdAt ?? null,
        });
      });
      setMessages(list);
      if (!didInitialSnapshot.current) {
        didInitialSnapshot.current = true;
      }
    });
    return () => unsub();
  }, []);

  // Keep the internal list scrolled to bottom when new messages arrive
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    if (nearBottom || !didInitialSnapshot.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim().slice(0, 40);
    const trimmedText = text.trim().slice(0, 500);
    if (!trimmedName || !trimmedText) return;

    await addDoc(collection(db, "messages"), {
      name: trimmedName,
      text: trimmedText,
      createdAt: serverTimestamp(),
    });

    setText("");

    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

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
          className="w-full sm:w-40 rounded-md bg-gray-700/90 text-white px-3 py-2 
                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 rounded-md bg-gray-700/90 text-white px-3 py-2 
                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white 
                     hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Send
        </button>
      </form>
    </div>
  );
}
