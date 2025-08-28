"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext";

/* ----------------- types ----------------- */
type FireTs = { toDate?: () => Date; seconds?: number } | null | undefined;
type Comment = { id: string; authorId: string; body: string; createdAt?: FireTs };
type Notify = (kind: "success" | "error" | "info", text: string) => void;

type Props = {
  storyId: string;
  onPosted?: () => void;
  onDeleted?: () => void;
  initialBatch?: number;
  /** show delete buttons (default true) */
  enableDelete?: boolean;
  /** optional toast hook (slug page passes this) */
  notify?: Notify;
};

function fmtDate(ts?: FireTs) {
  try {
    if (!ts) return "";
    if (typeof ts?.toDate === "function") {
      const d = ts.toDate!();
      return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    }
    if (typeof ts?.seconds === "number") {
      const d = new Date(ts.seconds * 1000);
      return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    }
    return "";
  } catch {
    return "";
  }
}

/* ----------------- pretty confirm ----------------- */
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

  // Close on Esc
  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`fixed inset-0 z-[90] ${state.open ? "" : "pointer-events-none"}`}
      aria-hidden={!state.open}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${state.open ? "opacity-100" : "opacity-0"}`}
        onClick={() => close(false)}
      />
      <div
        className={`absolute inset-0 flex items-end sm:items-center justify-center p-4 transition-all duration-200
        ${state.open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0b0f19] p-5 shadow-2xl">
          <h3 className="text-lg font-semibold text-white">{state.title}</h3>
          <p className="mt-2 text-sm text-gray-300">{state.message}</p>
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <button
              onClick={() => close(false)}
              className="px-4 py-2 rounded-md border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() => close(true)}
              className={`px-4 py-2 rounded-md text-white ${
                state.danger ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {state.confirmText ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const askConfirm = (
  setState: (s: ConfirmState) => void,
  opts: Omit<ConfirmState, "open" | "resolve">
) => new Promise<boolean>((resolve) => setState({ ...opts, open: true, resolve }));

/* ----------------- component ----------------- */
export default function Comments({
  storyId,
  onPosted,
  onDeleted,
  initialBatch = 5,
  enableDelete = true,
  notify,
}: Props) {
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [moreCursor, setMoreCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [storyOwner, setStoryOwner] = useState<string | null>(null);

  // Confirm modal state
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    message: "",
  });

  // who owns the story (so owner can delete any comment)
  useEffect(() => {
    (async () => {
      try {
        const s = await getDoc(doc(db, "stories", storyId));
        setStoryOwner((s.data()?.authorId as string) ?? null);
      } catch {
        setStoryOwner(null);
      }
    })();
  }, [storyId]);

  // live first page
  useEffect(() => {
    setLoading(true);
    const base = query(
      collection(db, "stories", storyId, "comments"),
      orderBy("createdAt", "desc"),
      limit(initialBatch)
    );
    const unsub = onSnapshot(
      base,
      (snap) => {
        const firstBatch: Comment[] = snap.docs.map((d) => {
          const data = d.data() as DocumentData;
          return {
            id: d.id,
            authorId: String(data.authorId ?? ""),
            body: String(data.body ?? ""),
            createdAt: (data.createdAt as FireTs) ?? null,
          };
        });

        // dedup by id (server data wins)
        setItems((prev) => {
          const serverIds = new Set(firstBatch.map((c) => c.id));
          const older = prev.filter((c) => !serverIds.has(c.id));
          return [...firstBatch, ...older];
        });

        setMoreCursor(snap.docs.length === initialBatch ? snap.docs[snap.docs.length - 1] : null);
        setLoading(false);
      },
      () => {
        setItems([]);
        setMoreCursor(null);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [storyId, initialBatch]);

  // resolve author names
  useEffect(() => {
    (async () => {
      const need = Array.from(new Set(items.map((i) => i.authorId))).filter((uid) => uid && !authors[uid]);
      if (!need.length) return;
      const updates: Record<string, string> = {};
      for (const uid of need) {
        try {
          const s = await getDoc(doc(db, "users", uid));
          updates[uid] = (s.data()?.displayName as string) || "User";
        } catch {
          updates[uid] = "User";
        }
      }
      if (Object.keys(updates).length) setAuthors((prev) => ({ ...prev, ...updates }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // older pages
  const loadMore = useCallback(async () => {
    if (!moreCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const q2 = query(
        collection(db, "stories", storyId, "comments"),
        orderBy("createdAt", "desc"),
        startAfter(moreCursor),
        limit(initialBatch)
      );
      const snap = await getDocs(q2);
      const add: Comment[] = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          authorId: String(data.authorId ?? ""),
          body: String(data.body ?? ""),
          createdAt: (data.createdAt as FireTs) ?? null,
        };
      });

      setItems((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        const merged = [...prev];
        for (const c of add) if (!seen.has(c.id)) merged.push(c);
        return merged;
      });

      setMoreCursor(snap.docs.length === initialBatch ? snap.docs[snap.docs.length - 1] : null);
    } finally {
      setLoadingMore(false);
    }
  }, [storyId, moreCursor, loadingMore, initialBatch]);

  // post (pre-generate id to avoid duplicates)
  const onPost = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!user?.uid) { notify?.("error", "Please log in to comment."); return; }
    if (!body) return;

    setText("");

    const ref = doc(collection(db, "stories", storyId, "comments"));
    setItems((prev) => [{ id: ref.id, authorId: user.uid, body, createdAt: null }, ...prev]);

    try {
      await setDoc(ref, { authorId: user.uid, body, createdAt: serverTimestamp() });
      onPosted?.();
      notify?.("success", "Comment posted");
    } catch {
      setItems((prev) => prev.filter((c) => c.id !== ref.id));
      notify?.("error", "Failed to post comment.");
    }
  };

  // delete (author OR story owner) with pretty confirm
  const remove = async (cid: string) => {
    if (!user?.uid) return;
    const c = items.find((i) => i.id === cid);
    if (!c) return;

    const canDelete = enableDelete && (user.uid === c.authorId || (storyOwner && user.uid === storyOwner));
    if (!canDelete) return;

    const ok = await askConfirm(setConfirm, {
      title: "Delete this comment?",
      message: "This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "stories", storyId, "comments", cid));
      setItems((prev) => prev.filter((i) => i.id !== cid));
      onDeleted?.();
      notify?.("success", "Comment deleted");
    } catch {
      notify?.("error", "Failed to delete comment.");
    }
  };

  const empty = !loading && items.length === 0;

  return (
    <section className="mt-10">
      {/* Confirm modal */}
      <ConfirmDialog state={confirm} setState={setConfirm} />

      <h3 className="text-lg font-semibold text-white mb-3">Comments</h3>

      {/* Write form */}
      <form onSubmit={onPost} className="mb-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Write a comment…" : "Log in to comment"}
          disabled={!user}
          className="flex-1 rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-gray-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!user || !text.trim()}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
        >
          Post
        </button>
      </form>

      {/* List */}
      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: initialBatch }).map((_, i) => (
            <li key={i} className="rounded-lg border border-white/10 bg-white/5 p-3 animate-pulse">
              <div className="h-4 w-40 bg-white/10 rounded mb-2" />
              <div className="h-4 w-full bg-white/10 rounded" />
            </li>
          ))}
        </ul>
      ) : empty ? (
        <p className="text-gray-400">Be the first to comment.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => {
            const canDelete = enableDelete && user?.uid && (user.uid === c.authorId || (storyOwner && user.uid === storyOwner));
            return (
              <li key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-300">
                      <span className="font-medium text-white">{authors[c.authorId] ?? "User"}</span>
                      <span className="ml-2 text-xs text-gray-400">{fmtDate(c.createdAt)}</span>
                    </div>
                    <div className="mt-1 text-gray-100 whitespace-pre-wrap break-words">
                      {c.body}
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => remove(c.id)}
                      className="shrink-0 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5"
                      title="Delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Load more */}
      {moreCursor && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {!user && (
        <p className="mt-3 text-xs text-gray-400">
          <Link href="/login" className="text-blue-400 hover:underline">Log in</Link> to join the discussion.
        </p>
      )}
    </section>
  );
}
