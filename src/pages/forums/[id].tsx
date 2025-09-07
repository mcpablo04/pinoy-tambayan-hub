"use client";

import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { db } from "../../firebase/clientApp";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import CommentItem, { Comment } from "../../components/Forum/Comment";
import ForumLayout from "../../components/Forum/ForumLayout";
import WidgetCard from "../../components/Forum/WidgetCard";
import CategoryPill from "../../components/Forum/CategoryPill";
import { confirmToast } from "../../components/ToastConfirm";
import { formatDistanceToNow } from "date-fns";

const ADMIN_EMAIL = "markcidricpablo@gmail.com";

type Thread = {
  id: string;
  title: string;
  body: string;
  category?: string;
  tags?: string[];
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
  replyCount?: number;
  lastReplyAt?: { seconds: number; nanoseconds: number };
};

function tsToDate(ts?: { seconds: number; nanoseconds: number }) {
  return ts ? new Date(ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1e6)) : undefined;
}
const clip = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function ThreadDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { user, profile } = useAuth();

  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [featured, setFeatured] = useState<Thread[]>([]);
  const [recent, setRecent] = useState<Thread[]>([]);

  const lastSubmitRef = useRef<number>(0);
  const endRef = useRef<HTMLDivElement>(null);

  // Right-rail lists
  useEffect(() => {
    (async () => {
      const featSnap = await getDocs(
        query(collection(db, "threads"), orderBy("replyCount", "desc"), orderBy("createdAt", "desc"), fsLimit(6))
      );
      setFeatured(featSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Thread[]);
      const recSnap = await getDocs(
        query(collection(db, "threads"), orderBy("createdAt", "desc"), fsLimit(10))
      );
      setRecent(recSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Thread[]);
    })();
  }, []);

  // Real-time thread doc + comments
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    const tRef = doc(db, "threads", id);
    const cRef = collection(db, "threads", id, "comments");
    const cQ = query(cRef, orderBy("createdAt", "asc"));

    const unsubThread = onSnapshot(
      tRef,
      (snap) => {
        if (!snap.exists()) {
          setThread(null);
          setLoading(false);
          return;
        }
        setThread({ id: snap.id, ...(snap.data() as any) });
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubComments = onSnapshot(cQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Comment[];
      setComments(list);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    });

    return () => {
      unsubThread();
      unsubComments();
    };
  }, [id]);

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    const body = text.trim();
    if (!body) return;

    const now = Date.now();
    if (now - lastSubmitRef.current < 600) return;
    lastSubmitRef.current = now;

    setBusy(true);
    try {
      // 🔐 match thread comment rules exactly (no parentId)
      const payload = {
        body,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || "User",
        authorPhoto: profile?.photoURL || user.photoURL || "",
        parentKind: "thread",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "threads", id, "comments"), payload);

      await updateDoc(doc(db, "threads", id), {
        replyCount: increment(1),
        lastReplyAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setText("");
      toast.success("Reply posted");
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to post reply.");
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (cid: string) => {
    if (!user || !id) return;
    const ok = await confirmToast({
      title: "Delete this comment?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "threads", id, "comments", cid));

      // safe decrement (never below 0)
      const tRef = doc(db, "threads", id);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(tRef);
        if (!snap.exists()) return;
        const current = (snap.data().replyCount as number) || 0;
        tx.update(tRef, { replyCount: Math.max(0, current - 1), updatedAt: serverTimestamp() });
      });

      toast.success("Comment deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to delete comment.");
    }
  };

  const cascadeDeleteThread = async (threadId: string) => {
    // delete comments first, then the thread doc
    const cCol = collection(db, "threads", threadId, "comments");
    // batch delete in chunks
    while (true) {
      const snap = await getDocs(query(cCol, fsLimit(400)));
      if (snap.empty) break;
      const batch = (await import("firebase/firestore")).writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      if (snap.size < 400) break;
    }
    await deleteDoc(doc(db, "threads", threadId));
  };

  if (loading) {
    return (
      <ForumLayout>
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-800/40 animate-pulse" />
          ))}
        </div>
      </ForumLayout>
    );
  }
  if (!thread) {
    return (
      <ForumLayout>
        <Head>
          <title>Thread not found — Forums | Pinoy Tambayan Hub</title>
          <meta name="robots" content="noindex" />
        </Head>
        <h1 className="text-xl font-semibold text-gray-100">Thread not found</h1>
        <Link href="/forums" className="text-blue-400 underline mt-2 inline-block">
          Back to Forums
        </Link>
      </ForumLayout>
    );
  }

  const created = tsToDate(thread.createdAt);
  const ago = created ? formatDistanceToNow(created, { addSuffix: true }) : "just now";
  const isAdmin = user?.email === ADMIN_EMAIL;
  const isThreadAuthor = user?.uid === thread.authorId;
  const canDeleteThread = isAdmin || isThreadAuthor;

  const pageTitle = `${thread.title} — Forums | Pinoy Tambayan Hub`;
  const desc = clip(thread.body || thread.title, 160);
  const canonical = `https://pinoytambayanhub.com/forums/${thread.id}`;

  const repliesDisplay = Math.max(0, thread.replyCount ?? comments.length);
  const repliesLabel = repliesDisplay === 1 ? "Reply" : "Replies";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
      </Head>

      <ForumLayout
        rightRail={
          <>
            <WidgetCard title="Featured content">
              <ul className="space-y-2">
                {featured.map((t) => {
                  const cnt = Math.max(0, t.replyCount ?? 0);
                  return (
                    <li key={t.id} className="flex flex-col gap-1">
                      <Link href={`/forums/${t.id}`} className="text-sm text-gray-200 hover:text-white">
                        {t.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CategoryPill cat={(t as any).category} />
                        <span>{cnt} {cnt === 1 ? "reply" : "replies"}</span>
                      </div>
                    </li>
                  );
                })}
                {featured.length === 0 && <div className="text-sm text-gray-400">No featured threads yet.</div>}
              </ul>
            </WidgetCard>

            <WidgetCard title="New Topics">
              <ul className="space-y-2">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-start gap-2">
                    <span className="mt-0.5 text-xs">🟦</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/forums/${t.id}`} className="text-sm text-gray-200 hover:text-white truncate">
                          {t.title}
                        </Link>
                        <CategoryPill cat={(t as any).category} />
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {(t.tags || []).slice(0, 2).map((x) => `#${x}`).join(" ")}
                      </div>
                    </div>
                  </li>
                ))}
                {recent.length === 0 && <div className="text-sm text-gray-400">No topics yet.</div>}
              </ul>
            </WidgetCard>
          </>
        }
      >
        {/* top bar */}
        <div className="flex items-center justify-between gap-3 mb-1">
          <Link href="/forums" className="text-sm text-gray-400 hover:text-gray-200">← Back</Link>
          <div className="flex items-center gap-2">
            <Link href="/forums/new" className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-sm font-medium">
              Post thread
            </Link>
            {canDeleteThread && (
              <button
                onClick={async () => {
                  const ok = await confirmToast({
                    title: "Delete this thread?",
                    description: "The thread and its replies will be removed.",
                    confirmText: "Delete thread",
                    variant: "destructive",
                  });
                  if (!ok) return;
                  setDeleting(true);
                  try {
                    await cascadeDeleteThread(thread.id);
                    toast.success("Thread deleted");
                    router.push("/forums");
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err?.message || "Failed to delete thread.");
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="text-sm px-3 py-1.5 rounded-lg border border-red-700 text-red-300 hover:bg-red-900/30 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        </div>

        {/* Thread */}
        <article className="rounded-2xl bg-[#1f2430] border border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800">
              {thread.authorPhoto ? (
                <Image src={thread.authorPhoto} alt={thread.authorName} fill sizes="40px" className="object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
                  {thread.authorName?.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-sm">
              <div className="text-gray-200 font-medium">{thread.authorName}</div>
              <div className="text-gray-500">{ago}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {thread.category && <CategoryPill cat={thread.category} />}
            {(thread.tags || []).map((tg) => (
              <span key={tg} className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700">
                #{tg}
              </span>
            ))}
          </div>

          <h1 className="mt-3 text-2xl md:text-3xl font-bold text-gray-100">{thread.title}</h1>

          <div className="prose prose-invert max-w-none mt-4">
            <p className="whitespace-pre-wrap text-gray-100">{thread.body}</p>
          </div>
        </article>

        {/* Replies */}
        <section>
          <h2 className="text-lg font-semibold text-gray-100 mt-2">
            {repliesDisplay} {repliesLabel}
          </h2>
          <div className="mt-3 grid gap-3">
            {comments.map((c) => {
              const canDelete = user?.uid === c.authorId || user?.email === ADMIN_EMAIL || user?.uid === thread.authorId;
              return <CommentItem key={c.id} c={c} canDelete={!!canDelete} onDelete={(cid) => removeComment(cid)} />;
            })}
            <div ref={endRef} />
          </div>
        </section>

        {/* Composer */}
        <section className="mt-4">
          {user ? (
            <form onSubmit={postComment} className="rounded-2xl bg-[#1b202b] border border-gray-800 p-4">
              <label className="block text-sm text-gray-400 mb-1">Add a reply</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                maxLength={10000}
                rows={4}
                placeholder="Share your thoughts…"
                className="w-full rounded-xl bg-[#151924] border border-gray-800 px-4 py-3 text-gray-100 outline-none focus:border-blue-500"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={busy || text.trim().length === 0}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-5 py-2.5 font-medium"
                >
                  {busy ? "Posting…" : "Reply"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-gray-400">Please sign in to join the discussion.</div>
          )}
        </section>
      </ForumLayout>
    </>
  );
}
