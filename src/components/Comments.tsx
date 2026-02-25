"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { Trash2, Send, MessageCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

/* ----------------- Types & Helpers ----------------- */
type FireTs = { toDate?: () => Date; seconds?: number } | null | undefined;
export type Comment = { id: string; authorId: string; body: string; createdAt?: FireTs };
export type Notify = (kind: "success" | "error" | "info", text: string) => void;

function fmtDate(ts?: FireTs) {
  try {
    if (!ts) return "Just now";
    const date = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts.seconds! * 1000);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return ""; }
}

/* ----------------- Premium Confirm Dialog ----------------- */
type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  resolve?: (ok: boolean) => void;
};

function ConfirmDialog({ state, setState }: { state: ConfirmState; setState: (s: ConfirmState) => void }) {
  const close = (ok: boolean) => {
    state.resolve?.(ok);
    setState({ ...state, open: false, resolve: undefined });
  };
  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => close(false)} />
      <div className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${state.danger ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
          <AlertCircle size={28} />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">{state.title}</h3>
        <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">{state.message}</p>
        <div className="flex gap-3">
          <button onClick={() => close(false)} className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={() => close(true)} className={`flex-1 px-6 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${state.danger ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}>
            {state.confirmText ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

const askConfirm = (setState: (s: ConfirmState) => void, opts: Omit<ConfirmState, "open" | "resolve">) => 
  new Promise<boolean>((resolve) => setState({ ...opts, open: true, resolve }));

/* ----------------- Main Component ----------------- */
export default function Comments({ storyId, onPosted, onDeleted, initialBatch = 10, enableDelete = true, notify }: any) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [moreCursor, setMoreCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [authors, setAuthors] = useState<Record<string, {name: string, photo: string}>>({});
  const [storyOwner, setStoryOwner] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: "", message: "" });
  const lastSubmitRef = useRef<number>(0);

  const storyRef = useMemo(() => doc(db, "stories", storyId), [storyId]);

  // Fetch Story Metadata (Owner)
  useEffect(() => {
    getDoc(storyRef).then(s => setStoryOwner(s.data()?.authorId ?? null)).catch(() => {});
  }, [storyRef]);

  // Real-time listener for comments
  useEffect(() => {
    setLoading(true);
    const qBase = query(collection(db, "stories", storyId, "comments"), orderBy("createdAt", "desc"), limit(initialBatch));
    
    const unsub = onSnapshot(qBase, (snap) => {
      const data: Comment[] = snap.docs.map((d) => ({
        id: d.id,
        authorId: d.data().authorId,
        body: d.data().body,
        createdAt: d.data().createdAt,
      }));
      setItems(data);
      setMoreCursor(snap.docs.length === initialBatch ? snap.docs[snap.docs.length - 1] : null);
      setLoading(false);
    });
    return () => unsub();
  }, [storyId, initialBatch]);

  // Author Data Hydration
  useEffect(() => {
    const fetchAuthors = async () => {
      const missingUids = Array.from(new Set(items.map(i => i.authorId))).filter(uid => uid && !authors[uid]);
      if (missingUids.length === 0) return;

      const newAuthors: any = {};
      await Promise.all(missingUids.map(async (uid) => {
        const uDoc = await getDoc(doc(db, "users", uid));
        newAuthors[uid] = {
          name: uDoc.data()?.displayName || "Member",
          photo: uDoc.data()?.photoURL || `https://ui-avatars.com/api/?name=${uid}&background=random`
        };
      }));
      setAuthors(prev => ({ ...prev, ...newAuthors }));
    };
    fetchAuthors();
  }, [items]);

  const onPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || Date.now() - lastSubmitRef.current < 2000) return;
    
    lastSubmitRef.current = Date.now();
    const body = text.trim();
    setText("");

    const cRef = doc(collection(db, "stories", storyId, "comments"));
    try {
      await setDoc(cRef, { 
        authorId: user.uid, 
        body, 
        createdAt: serverTimestamp(),
        parentKind: "story"
      });
      await updateDoc(storyRef, { "counts.comments": increment(1) });
      onPosted?.();
    } catch (err) {
      notify?.("error", "Failed to post comment.");
    }
  };

  const remove = async (cid: string) => {
    const ok = await askConfirm(setConfirm, { 
      title: "Delete Comment?", 
      message: "Are you sure? This action cannot be undone.", 
      confirmText: "Delete", 
      danger: true 
    });
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "stories", storyId, "comments", cid));
      await updateDoc(storyRef, { "counts.comments": increment(-1) });
      onDeleted?.();
    } catch (err) {
      notify?.("error", "Could not delete.");
    }
  };

  return (
    <section className="mt-12 space-y-8 pb-20">
      <ConfirmDialog state={confirm} setState={setConfirm} />

      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-blue-500" />
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">Discussion</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          {items.length} Messages
        </span>
      </div>

      {/* Input Field */}
      <form onSubmit={onPost} className="relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Write a comment..." : "Sign in to join the discussion"}
          disabled={!user}
          className="w-full bg-[#0f172a]/50 border border-white/5 rounded-3xl py-5 px-6 pr-16 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-8 focus:ring-blue-500/5 transition-all resize-none min-h-[80px]"
        />
        <button
          type="submit"
          disabled={!user || !text.trim()}
          className="absolute right-4 top-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-20 disabled:grayscale"
        >
          <Send size={20} />
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white/5 rounded-[2rem]" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">No comments yet</p>
          </div>
        ) : (
          items.map((c) => {
            const isOwner = c.authorId === storyOwner;
            const author = authors[c.authorId];
            return (
              <div key={c.id} className="group relative flex gap-5 bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] hover:bg-white/[0.04] transition-all">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-white/10 shadow-inner">
                  {author?.photo && (
                    <Image src={author.photo} alt="" fill sizes="48px" className="object-cover" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
                      {author?.name || "Member"}
                    </span>
                    {isOwner && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[8px] font-black text-blue-500 uppercase">
                        <ShieldCheck size={10} /> OP
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-600">• {fmtDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">{c.body}</p>
                </div>

                {(user?.uid === c.authorId || user?.uid === storyOwner) && (
                  <button onClick={() => remove(c.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500 transition-all self-start">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}