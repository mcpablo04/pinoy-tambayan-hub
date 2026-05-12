"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { Trash2, Send, MessageCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

/* ----------------- Types ----------------- */
type FireTs = { toDate?: () => Date; seconds?: number } | null | undefined;

export type StoryComment = { 
  id: string; 
  authorId: string; 
  body: string; 
  createdAt?: FireTs;
};

export type Notify = (kind: "success" | "error" | "info", text: string) => void;

interface CommentsProps {
  storyId: string;
  onPosted?: () => void;
  onDeleted?: () => void;
  initialBatch?: number;
  notify?: Notify;
  enableDelete?: boolean;
}

/* ----------------- Helpers ----------------- */
function fmtDate(ts?: FireTs) {
  try {
    if (!ts) return "Just now";
    const date = typeof ts?.toDate === "function"
      ? ts.toDate()
      : new Date(ts!.seconds! * 1000);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return ""; }
}

/* ----------------- Confirm Dialog ----------------- */
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
      <div className="absolute inset-0 bg-black/80" onClick={() => close(false)} />
      <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-white font-bold text-lg mb-2">{state.title}</h3>
        <p className="text-gray-400 text-sm mb-6">{state.message}</p>
        <div className="flex gap-2">
          <button onClick={() => close(false)} className="flex-1 py-2 bg-white/10 rounded-lg text-white">Cancel</button>
          <button onClick={() => close(true)} className="flex-1 py-2 bg-red-600 rounded-lg text-white">
            {state.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

const askConfirm = (setState: (s: ConfirmState) => void, opts: Omit<ConfirmState, "open" | "resolve">) =>
  new Promise<boolean>((resolve) => setState({ ...opts, open: true, resolve }));

/* ----------------- Component ----------------- */
export default function Comments({
  storyId,
  onPosted,
  onDeleted,
  initialBatch = 10,
  notify,
  enableDelete = true
}: CommentsProps) {

  const { user } = useAuth();
  const [text, setText] = useState("");
  const [items, setItems] = useState<StoryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [storyOwner, setStoryOwner] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: "", message: "" });
  const lastSubmitRef = useRef(0);

  const storyRef = useMemo(() => doc(db, "stories", storyId), [storyId]);

  /* Load story owner */
  useEffect(() => {
    getDoc(storyRef).then(s => setStoryOwner(s.data()?.authorId ?? null));
  }, [storyRef]);

  /* Load comments */
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "stories", storyId, "comments"),
      orderBy("createdAt", "desc"),
      limit(initialBatch)
    );

    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as StoryComment[];
      setItems(data);
      setLoading(false);
    });

    return () => unsub();
  }, [storyId, initialBatch]);

  /* POST COMMENT */
  const onPost = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || !text.trim() || Date.now() - lastSubmitRef.current < 1500) return;

    lastSubmitRef.current = Date.now();
    const body = text.trim();
    setText("");

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(storyRef);
        if (!snap.exists()) throw new Error("Story not found");

        const count = snap.data().counts?.comments || 0;
        const newRef = doc(collection(db, "stories", storyId, "comments"));

        tx.set(newRef, {
          authorId: user.uid,
          body,
          parentKind: "story",
          createdAt: serverTimestamp(),
        });

        tx.update(storyRef, {
          "counts.comments": count + 1,
          updatedAt: serverTimestamp()
        });
      });

      notify?.("success", "Comment posted");
      onPosted?.();

    } catch (err) {
      console.error("Comment post error:", err);
      notify?.("error", "Failed to post");
    }
  };

  /* DELETE COMMENT */
  const remove = async (cid: string) => {
    const ok = await askConfirm(setConfirm, {
      title: "Delete comment?",
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true
    });
    if (!ok) return;

    try {
      await runTransaction(db, async (tx) => {
        const commentRef = doc(db, "stories", storyId, "comments", cid);
        const snap = await tx.get(storyRef);

        tx.delete(commentRef);

        if (snap.exists()) {
          const count = snap.data().counts?.comments || 0;

          tx.update(storyRef, {
            "counts.comments": Math.max(0, count - 1),
            updatedAt: serverTimestamp()
          });
        }
      });

      notify?.("success", "Deleted");
      onDeleted?.();

    } catch (err) {
      console.error("Comment delete error:", err);
      notify?.("error", "Delete failed");
    }
  };

  return (
    <section className="mt-10 space-y-6">
      <ConfirmDialog state={confirm} setState={setConfirm} />

      <h3 className="text-white font-bold flex items-center gap-2">
        <MessageCircle size={18}/> Comments ({items.length})
      </h3>

      <form onSubmit={onPost} className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Write a comment..." : "Login first"}
          disabled={!user}
          className="w-full p-3 rounded-lg bg-[#0f172a] border border-white/10 text-white"
        />
        <button className="absolute right-3 top-3 text-blue-500">
          <Send size={18}/>
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : items.map(c => (
        <div key={c.id} className="flex justify-between p-3 border border-white/5 rounded-lg">
          <div>
            <p className="text-white">{c.body}</p>
            <span className="text-xs text-gray-500">{fmtDate(c.createdAt)}</span>
          </div>

          {enableDelete && (user?.uid === c.authorId || user?.uid === storyOwner) && (
            <button onClick={() => remove(c.id)} className="text-red-500">
              <Trash2 size={16}/>
            </button>
          )}
        </div>
      ))}
    </section>
  );
}