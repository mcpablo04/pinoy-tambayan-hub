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
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  limit as fsLimit,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import CommentItem, { Comment } from "../../components/Forum/Comment";
import Sidebar from "../../components/Forum/Sidebar";
import WidgetCard from "../../components/Forum/WidgetCard";
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

  const endRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const tSnap = await getDoc(doc(db, "threads", id));
      if (!tSnap.exists()) {
        setThread(null);
        setLoading(false);
        return;
      }
      setThread({ id: tSnap.id, ...(tSnap.data() as any) });

      const cSnap = await getDocs(query(collection(db, "threads", id, "comments"), orderBy("createdAt", "asc")));
      setComments(cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Comment[]);
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    })();
  }, [id]);

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || text.trim().length === 0) return;
    setBusy(true);
    try {
      const payload = {
        body: text.trim(),
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || "User",
        authorPhoto: profile?.photoURL || user.photoURL || "",
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "threads", id, "comments"), payload);
      await updateDoc(doc(db, "threads", id), {
        replyCount: increment(1),
        lastReplyAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setComments((prev) => [...prev, { id: Math.random().toString(36).slice(2), ...payload } as any]);
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
      await updateDoc(doc(db, "threads", id), {
        replyCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
      setComments((prev) => prev.filter((c) => c.id !== cid));
      toast.success("Comment deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to delete comment.");
    }
  };

  const deleteThread = async () => {
    if (!user || !thread) return;

    const ok = await confirmToast({
      title: "Delete this thread?",
      description: "The thread will be removed from the forum.",
      confirmText: "Delete thread",
      variant: "destructive",
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "threads", thread.id));
      toast.success("Thread deleted");
      router.push("/forums");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to delete thread.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-5">
        <div className="text-gray-400">Loading thread…</div>
      </main>
    );
  }
  if (!thread) {
    return (
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-5">
        <Head>
          <title>Thread not found — Forums | Pinoy Tambayan Hub</title>
          <meta name="robots" content="noindex" />
        </Head>
        <h1 className="text-xl font-semibold text-gray-100">Thread not found</h1>
        <Link href="/forums" className="text-blue-400 underline mt-2 inline-block">
          Back to Forums
        </Link>
      </main>
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

  return (
    <main className="max-w-7xl mx-auto px-3 md:px-4 py-5">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
      </Head>

      {/* top bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <Link href="/forums" className="text-sm text-gray-400 hover:text-gray-200">
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/forums/new"
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-sm font-medium"
          >
            Post thread
          </Link>
          {canDeleteThread && (
            <button
              onClick={deleteThread}
              disabled={deleting}
              className="text-sm px-3 py-1.5 rounded-lg border border-red-700 text-red-300 hover:bg-red-900/30 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px,minmax(0,1fr),320px] gap-4">
        {/* LEFT */}
        <div className="md:sticky md:top-24 h-fit">
          <Sidebar />
        </div>

        {/* CENTER: thread + comments */}
        <div className="space-y-4">
          <article className="rounded-2xl bg-[#1f2430] border border-gray-800 p-5">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                {thread.authorPhoto ? (
                  <Image
                    src={thread.authorPhoto}
                    alt={thread.authorName}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
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
              {thread.category && (
                <Link
                  href={{ pathname: "/forums", query: { cat: thread.category } }}
                  className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700"
                >
                  #{thread.category}
                </Link>
              )}
              {(thread.tags || []).map((tg) => (
                <span
                  key={tg}
                  className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700"
                >
                  #{tg}
                </span>
              ))}
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-bold text-gray-100">{thread.title}</h1>

            <div className="prose prose-invert max-w-none mt-4">
              <p className="whitespace-pre-wrap text-gray-100">{thread.body}</p>
            </div>
          </article>

          <section>
            <h2 className="text-lg font-semibold text-gray-100">
              {thread.replyCount ?? comments.length} {(thread.replyCount ?? comments.length) === 1 ? "Reply" : "Replies"}
            </h2>
            <div className="mt-3 grid gap-3">
              {comments.map((c) => {
                const canDelete = user?.uid === c.authorId || isAdmin || isThreadAuthor;
                return <CommentItem key={c.id} c={c} canDelete={!!canDelete} onDelete={removeComment} />;
              })}
              <div ref={endRef} />
            </div>
          </section>

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
        </div>

        {/* RIGHT */}
        <div className="space-y-4 md:sticky md:top-24 h-fit">
          <WidgetCard title="Featured content">
            <ul className="space-y-2">
              {featured.map((t) => (
                <li key={t.id}>
                  <Link href={`/forums/${t.id}`} className="text-sm text-gray-200 hover:text-white">
                    {t.title}
                  </Link>
                  <div className="text-xs text-gray-500">{(t.replyCount ?? 0)} replies</div>
                </li>
              ))}
              {featured.length === 0 && <div className="text-sm text-gray-400">No featured threads yet.</div>}
            </ul>
          </WidgetCard>

          <WidgetCard title="New Topics">
            <ul className="space-y-2">
              {recent.map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs">🟦</span>
                  <div>
                    <Link href={`/forums/${t.id}`} className="text-sm text-gray-200 hover:text-white">
                      {t.title}
                    </Link>
                    <div className="text-xs text-gray-500">{(t.tags || []).slice(0, 2).map((x) => `#${x}`).join(" ")}</div>
                  </div>
                </li>
              ))}
              {recent.length === 0 && <div className="text-sm text-gray-400">No topics yet.</div>}
            </ul>
          </WidgetCard>
        </div>
      </div>
    </main>
  );
}
