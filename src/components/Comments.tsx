// src/components/Comments.tsx
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext";

type FireTs = { toDate?: () => Date; seconds?: number } | null | undefined;

type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt?: FireTs;
};

type Props = {
  storyId: string;
  onPosted?: () => void;        // optional callback
  initialBatch?: number;        // default 5
};

function fmtDate(ts?: FireTs) {
  try {
    if (!ts) return "";
    if (typeof ts?.toDate === "function") {
      const d = ts.toDate!();
      return d.toLocaleString("en-PH", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    }
    if (typeof ts?.seconds === "number") {
      const d = new Date(ts.seconds * 1000);
      return d.toLocaleString("en-PH", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    }
    return "";
  } catch {
    return "";
  }
}

export default function Comments({ storyId, onPosted, initialBatch = 5 }: Props) {
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // cursor for loading older pages
  const [moreCursor, setMoreCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // cache author display names (uid -> name)
  const [authors, setAuthors] = useState<Record<string, string>>({});

  // ---- Live first page ----
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

        // Merge with any older items already loaded; dedupe by id
        setItems((prev) => {
          const firstIds = new Set(firstBatch.map((c) => c.id));
          // also drop any optimistic "temp-*" items once the server data arrives
          const older = prev.filter((c) => !firstIds.has(c.id) && !c.id.startsWith("temp-"));
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

  // ---- Resolve author names (public /users/{uid}) ----
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

  // ---- Load older pages ----
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

  // ---- Post a comment (must match Firestore rules exactly) ----
  const onPost = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!user?.uid) return alert("Please log in to comment.");
    if (!body) return;

    setText("");

    // Optimistic UI (will be replaced by live snapshot)
    const tempId = `temp-${Date.now()}`;
    setItems((prev) => [
      { id: tempId, authorId: user.uid, body, createdAt: null },
      ...prev,
    ]);

    try {
      await addDoc(collection(db, "stories", storyId, "comments"), {
        authorId: user.uid,        // ✅ allowed by rules
        body,                      // ✅ allowed by rules
        createdAt: serverTimestamp(), // ✅ allowed by rules
      });
      onPosted?.();
    } catch {
      setItems((prev) => prev.filter((c) => c.id !== tempId)); // rollback
      alert("Failed to post comment. Please try again.");
    }
  };

  const empty = !loading && items.length === 0;

  return (
    <section className="mt-10">
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
          {items.map((c) => (
            <li key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">{authors[c.authorId] ?? "User"}</span>
                <span className="ml-2 text-xs text-gray-400">{fmtDate(c.createdAt)}</span>
              </div>
              <div className="mt-1 text-gray-100 whitespace-pre-wrap break-words">
                {c.body}
              </div>
            </li>
          ))}
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
