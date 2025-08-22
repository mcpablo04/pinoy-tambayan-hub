// src/components/Comments.tsx
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext";

type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt?: { seconds: number } | null;
};

const PAGE = 20;

export default function Comments({ storyId }: { storyId: string }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [authors, setAuthors] = useState<Record<string, string>>({}); // uid -> displayName

  // Load first page live
  useEffect(() => {
    const base = query(
      collection(db, "stories", storyId, "comments"),
      orderBy("createdAt", "desc"),
      limit(PAGE)
    );
    const unsub = onSnapshot(base, (snap) => {
      const list: Comment[] = [];
      snap.forEach((d) => {
        const data = d.data() as DocumentData;
        list.push({
          id: d.id,
          authorId: (data.authorId ?? "").toString(),
          body: (data.body ?? "").toString(),
          createdAt: data.createdAt ?? null,
        });
      });
      setItems(list);
      setLoading(false);
      setMore(snap.docs.length === PAGE ? snap.docs[snap.docs.length - 1] : null);
    });
    return () => unsub();
  }, [storyId]);

  // Resolve author display names (reads public /users docs)
  useEffect(() => {
    (async () => {
      const need = Array.from(new Set(items.map(i => i.authorId))).filter(uid => !authors[uid]);
      const updated: Record<string, string> = {};
      for (const uid of need) {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          const name = (snap.data()?.displayName ?? "User") as string;
          updated[uid] = name;
        } catch {
          updated[uid] = "User";
        }
      }
      if (Object.keys(updated).length) setAuthors(prev => ({ ...prev, ...updated }));
    })();
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    if (!more) return;
    const q2 = query(
      collection(db, "stories", storyId, "comments"),
      orderBy("createdAt", "desc"),
      startAfter(more),
      limit(PAGE)
    );
    const snap = await getDocs(q2);
    const add: Comment[] = [];
    snap.forEach((d) => {
      const data = d.data() as DocumentData;
      add.push({
        id: d.id,
        authorId: (data.authorId ?? "").toString(),
        body: (data.body ?? "").toString(),
        createdAt: data.createdAt ?? null,
      });
    });
    setItems(prev => [...prev, ...add]);
    setMore(snap.docs.length === PAGE ? snap.docs[snap.docs.length - 1] : null);
  };

  const onPost = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!user?.uid) return alert("Please log in to comment.");
    if (!body) return;

    await addDoc(collection(db, "stories", storyId, "comments"), {
      authorId: user.uid,
      body,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  const prettyDate = (ts?: { seconds: number } | null) => {
    if (!ts?.seconds) return "";
    return new Date(ts.seconds * 1000).toLocaleString();
    };

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
        <p className="text-gray-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">Be the first to comment.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">
                  {authors[c.authorId] ?? "User"}
                </span>
                <span className="ml-2 text-xs text-gray-400">{prettyDate(c.createdAt)}</span>
              </div>
              <div className="mt-1 text-gray-100 whitespace-pre-wrap break-words">
                {c.body}
              </div>
            </li>
          ))}
        </ul>
      )}

      {more && (
        <div className="mt-4">
          <button
            onClick={loadMore}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-200 hover:bg-gray-700"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
}
