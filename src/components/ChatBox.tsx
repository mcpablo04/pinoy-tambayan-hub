// src/components/ChatBox.tsx
"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { db } from "../firebase/clientApp";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

interface Msg {
  id: string;
  name: string;
  text: string;
  createdAt: { seconds: number } | null;
}

export default function ChatBox() {
  // Persist name
  const [name, setName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("chatName") || "";
    }
    return "";
  });
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Save name → localStorage
  useEffect(() => {
    if (name.trim()) {
      localStorage.setItem("chatName", name.trim());
    }
  }, [name]);

  // Subscribe to Firestore
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Msg[] = [];
      snap.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const d = doc.data();
        arr.push({ id: doc.id, name: d.name, text: d.text, createdAt: d.createdAt ?? null });
      });
      setMsgs(arr);
    });
    return () => unsub();
  }, []);

  // Auto-scroll whenever msgs changes (i.e. on any new incoming message)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Send handler
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    await addDoc(collection(db, "messages"), {
      name: name.trim(),
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-white mb-2">Live Chat</h3>
      <div className="h-64 overflow-y-auto mb-4 space-y-2">
        {msgs.map((m) => (
          <div key={m.id} className="flex flex-col">
            <span className="text-sm text-blue-300">{m.name}</span>
            <span className="text-gray-200">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-24 p-2 rounded bg-gray-700 text-white focus:outline-none"
        />
        <input
          type="text"
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-grow p-2 rounded bg-gray-700 text-white focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
}
