"use client";

import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Send, LogIn, Sparkles } from "lucide-react";
import { db } from "../lib/firebase";
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
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(
    () => (profile?.displayName || user?.displayName || "").trim(),
    [profile?.displayName, user?.displayName]
  );

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc"),
      limitToLast(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Msg[] = [];
      snap.forEach((d) => {
        const data = d.data() as DocumentData;
        list.push({
          id: d.id,
          uid: data.uid ?? null,
          name: data.name ?? "User",
          photoURL: data.photoURL ?? null,
          text: data.text ?? "",
          createdAt: data.createdAt ?? null,
        });
      });
      setMessages(list);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsub();
  }, []);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!user || !displayName || !text.trim()) return;

    const messageContent = text.trim();
    setText("");

    try {
      await addDoc(collection(db, "messages"), {
        uid: user.uid,
        name: displayName.slice(0, 40),
        photoURL: user.photoURL || profile?.photoURL || null,
        text: messageContent.slice(0, 500),
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      setErr("Message failed to send.");
      setText(messageContent);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0f1a]/50 backdrop-blur-md overflow-hidden rounded-[2.5rem]">
      {/* Polished Header: Added rounded-t-[2.5rem] to match parent */}
      <div className="p-5 border-b border-white/5 bg-white/[0.04] flex items-center justify-between rounded-t-[2.5rem]">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Live Community</span>
        </div>
        <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">
          {messages.length} Active
        </div>
      </div>

      {/* Messages: Added extra padding-right to avoid scrollbar clashing with curves */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide scroll-smooth"
      >
        {messages.map((m) => {
          const isMe = m.uid === user?.uid;
          return (
            <div key={m.id} className="group flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-500">
              <div className="shrink-0 pt-0.5">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-slate-800 shadow-inner">
                  {m.photoURL ? (
                    <Image 
                      src={m.photoURL} 
                      alt={m.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[11px] font-black text-blue-400 bg-blue-500/10">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[11px] font-black tracking-wide ${isMe ? 'text-blue-400' : 'text-slate-400'}`}>
                    {m.name}
                  </span>
                  {isMe && <Sparkles size={10} className="text-blue-500" />}
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl rounded-tl-none p-3.5 inline-block max-w-full group-hover:bg-white/[0.05] transition-colors shadow-sm">
                  <p className="text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                    {m.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Polished Footer: Added rounded-b-[2.5rem] to match parent */}
      <div className="p-5 bg-slate-900/40 border-t border-white/5 rounded-b-[2.5rem]">
        {!user ? (
          <div className="py-4 px-6 rounded-2xl bg-blue-600/5 border border-blue-500/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60 mb-3">Sign in to join the chat</p>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <LogIn size={14} /> Connect Now
            </Link>
          </div>
        ) : (
          <form onSubmit={onSend} className="relative group">
            <input 
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              placeholder="Message community..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-all"
            />
            <button 
              type="submit"
              disabled={loading || !text.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-500 transition-all active:scale-90 disabled:opacity-30 disabled:grayscale shadow-lg shadow-blue-600/10"
            >
              <Send size={16} />
            </button>
          </form>
        )}
        {err && <p className="text-[9px] text-red-500 mt-2 font-bold text-center uppercase tracking-tighter">{err}</p>}
      </div>
    </div>
  );
}