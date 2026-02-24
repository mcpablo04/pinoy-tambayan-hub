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
import { Send, User as UserIcon, LogIn, Sparkles } from "lucide-react";
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
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(
    () => (profile?.displayName || user?.displayName || "").trim(),
    [profile?.displayName, user?.displayName]
  );

  const hardScrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc"),
      limitToLast(25)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Msg[] = [];
      snap.forEach((d) => {
        const data = d.data() as DocumentData;
        list.push({
          id: d.id,
          uid: data.uid ?? null,
          name: data.name ?? "",
          photoURL: data.photoURL ?? null,
          text: data.text ?? "",
          createdAt: data.createdAt ?? null,
        });
      });
      setMessages(list);
      hardScrollToBottom();
    });

    return () => unsub();
  }, []);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!user || !displayName || !text.trim()) return;

    try {
      await addDoc(collection(db, "messages"), {
        uid: user.uid,
        name: displayName.slice(0, 40),
        photoURL: user.photoURL || profile?.photoURL || null,
        text: text.trim().slice(0, 500),
        createdAt: serverTimestamp(),
      });
      setText("");
      hardScrollToBottom();
    } catch (e: any) {
      setErr("Failed to send message.");
    }
  }

  const disabled = loading || !user;

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header Info (Mobile only or for visual flair) */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 italic">Live Stream Chat</span>
        </div>
        <div className="text-slate-500 text-[10px] font-bold">{messages.length} recent messages</div>
      </div>

      {/* Messages List */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide"
      >
        {messages.map((m) => {
          const isMe = m.uid === user?.uid;
          return (
            <div key={m.id} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className="shrink-0 pt-1">
                {m.photoURL ? (
                  <img src={m.photoURL} className="w-8 h-8 rounded-xl object-cover border border-white/10" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400 uppercase">
                    {m.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isMe ? 'text-blue-400' : 'text-slate-400'}`}>
                    {m.name}
                  </span>
                  {isMe && <Sparkles size={10} className="text-blue-500" />}
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 inline-block max-w-full">
                  <p className="text-sm text-slate-200 leading-relaxed break-words">{m.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Input Area */}
      <div className="p-4 pt-2 border-t border-white/5 bg-slate-900/40">
        {!user ? (
          <div className="p-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3 italic">Join the Conversation</p>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <LogIn size={14} /> Sign In to Chat
            </Link>
          </div>
        ) : (
          <form onSubmit={onSend} className="relative">
            <input 
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled}
              placeholder="Say something to the community..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
            />
            <button 
              type="submit"
              disabled={disabled || !text.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:grayscale"
            >
              <Send size={16} />
            </button>
          </form>
        )}
        {err && <p className="text-[10px] text-red-400 mt-2 font-bold text-center">{err}</p>}
      </div>
    </div>
  );
}