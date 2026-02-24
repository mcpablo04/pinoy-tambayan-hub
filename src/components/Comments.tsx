"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { Trash2, Send, MessageCircle, MoreHorizontal, AlertCircle } from "lucide-react";
import { db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext";

/* ----------------- types ----------------- */
type FireTs = { toDate?: () => Date; seconds?: number } | null | undefined;
export type Comment = { id: string; authorId: string; body: string; createdAt?: FireTs };
export type Notify = (kind: "success" | "error" | "info", text: string) => void;

type Props = {
  storyId: string;
  onPosted?: () => void;
  onDeleted?: () => void;
  initialBatch?: number;
  enableDelete?: boolean;
  notify?: Notify;
};

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
      <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => close(false)} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${state.danger ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
          <AlertCircle size={24} />
        </div>
        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-2">{state.title}</h3>
        <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">{state.message}</p>
        <div className="flex gap-3">
          <button onClick={() => close(false)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={() => close(true)} className={`flex-1 px-6 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all ${state.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
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
export default function Comments({ storyId, onPosted, onDeleted, initialBatch = 5, enableDelete = true, notify }: Props) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [moreCursor, setMoreCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [authors, setAuthors] = useState<Record<string, {name: string, photo: string}>>({});
  const [storyOwner, setStoryOwner] = useState<string | null>(null);
  const lastSubmitRef = useRef<number>(0);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: "", message: "" });

  const storyRef = useMemo(() => doc(db, "stories", storyId), [storyId]);

  useEffect(() => {
    (async () => {
      try {
        const s = await getDoc(storyRef);
        setStoryOwner((s.data()?.authorId as string) ?? null);
      } catch { setStoryOwner(null); }
    })();
  }, [storyRef]);

  useEffect(() => {
    setLoading(true);
    const base = query(collection(db, "stories", storyId, "comments"), orderBy("createdAt", "desc"), limit(initialBatch));
    const unsub = onSnapshot(base, (snap) => {
      const firstBatch: Comment[] = snap.docs.map((d) => ({
        id: d.id,
        authorId: String(d.data().authorId ?? ""),
        body: String(d.data().body ?? ""),
        createdAt: d.data().createdAt ?? null,
      }));
      setItems((prev) => {
        const serverIds = new Set(firstBatch.map((c) => c.id));
        return [...firstBatch, ...prev.filter((c) => !serverIds.has(c.id))];
      });
      setMoreCursor(snap.docs.length === initialBatch ? snap.docs[snap.docs.length - 1] : null);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [storyId, initialBatch]);

  useEffect(() => {
    (async () => {
      const need = Array.from(new Set(items.map((i) => i.authorId))).filter((uid) => uid && !authors[uid]);
      if (!need.length) return;
      const updates: Record<string, {name: string, photo: string}> = {};
      for (const uid of need) {
        try {
          const s = await getDoc(doc(db, "users", uid));
          updates[uid] = {
            name: (s.data()?.displayName as string) || "User",
            photo: (s.data()?.photoURL as string) || `https://ui-avatars.com/api/?name=${uid}`
          };
        } catch { updates[uid] = { name: "User", photo: "" }; }
      }
      setAuthors((prev) => ({ ...prev, ...updates }));
    })();
  }, [items]);

  const onPost = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!user?.uid) { notify?.("error", "Log in to join the conversation."); return; }
    if (!body || Date.now() - lastSubmitRef.current < 1000) return;
    lastSubmitRef.current = Date.now();
    setText("");

    const cRef = doc(collection(db, "stories", storyId, "comments"));
    setItems((prev) => [{ id: cRef.id, authorId: user.uid, body, createdAt: null }, ...prev]);

    try {
      await setDoc(cRef, { authorId: user.uid, parentKind: "story", body, createdAt: serverTimestamp() });
      await updateDoc(storyRef, { "counts.comments": increment(1), updatedAt: serverTimestamp() }).catch(() => {});
      onPosted?.();
    } catch {
      setItems((prev) => prev.filter((c) => c.id !== cRef.id));
      notify?.("error", "Failed to post.");
    }
  };

  const remove = async (cid: string) => {
    const ok = await askConfirm(setConfirm, { title: "Delete Comment?", message: "Burahin na ba ang comment na ito? Hindi na ito maibabalik.", confirmText: "Delete", danger: true });
    if (!ok) return;

    const prevItems = items;
    setItems((prev) => prev.filter((i) => i.id !== cid));
    try {
      await deleteDoc(doc(db, "stories", storyId, "comments", cid));
      await runTransaction(db, async (tx) => {
        const s = await tx.get(storyRef);
        if (s.exists()) tx.update(storyRef, { "counts.comments": Math.max(0, (s.data().counts?.comments || 0) - 1) });
      });
    } catch { setItems(prevItems); }
  };

  return (
    <section className="mt-16 space-y-8">
      <ConfirmDialog state={confirm} setState={setConfirm} />

      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Discussion</h3>
      </div>

      <form onSubmit={onPost} className="relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Ano ang masasabi mo?..." : "Mag-log in para makasali sa usapan"}
          disabled={!user}
          rows={1}
          className="w-full bg-slate-900/50 border border-white/5 rounded-3xl py-5 px-6 pr-16 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none min-h-[64px]"
        />
        <button
          type="submit"
          disabled={!user || !text.trim()}
          className="absolute right-3 top-3 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-30 disabled:grayscale"
        >
          <Send size={18} />
        </button>
      </form>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/20 rounded-[2rem] border border-dashed border-white/5">
            <MessageCircle className="mx-auto text-slate-700 mb-3" size={32} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No comments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((c) => {
              const canDelete = enableDelete && user?.uid && (user.uid === c.authorId || user.uid === storyOwner);
              const author = authors[c.authorId];
              return (
                <div key={c.id} className="group relative flex gap-4 bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] hover:bg-slate-900/60 transition-all">
                  <img src={author?.photo} className="w-10 h-10 rounded-2xl bg-slate-800 shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-400 italic">
                        {author?.name || "User"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        • {fmtDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed break-words">{c.body}</p>
                  </div>
                  {canDelete && (
                    <button onClick={() => remove(c.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {moreCursor && (
          <button
            onClick={() => !loadingMore && setMoreCursor(null)} // Simplified for this view
            className="w-full py-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            {loadingMore ? "Loading..." : "Load Older Comments"}
          </button>
        )}
      </div>
    </section>
  );
}