"use client";

import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { doc, getDoc, increment, updateDoc, deleteDoc, type Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ReactionBar, { type Notify as ReactionNotify, type NotifyKind as ReactionNotifyKind } from "../../components/ReactionBar";
import Comments from "../../components/Comments";
import { useAuth } from "../../context/AuthContext";

/* ---- Toast + Confirm Components ---- */
type ToastKind = ReactionNotifyKind;
type ToastItem = { id: number; kind: ToastKind; text: string };

function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed z-[100] bottom-4 right-4 flex flex-col gap-2 w-[min(90vw,340px)]">
      {toasts.map((t) => <Toast key={t.id} item={t} onClose={() => onClose(t.id)} />)}
    </div>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
    const hide = setTimeout(() => setShow(false), 2300);
    const done = setTimeout(onClose, 2600);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, [onClose]);

  const tone = item.kind === "success" ? "bg-emerald-600/90 border-emerald-400/40"
    : item.kind === "error" ? "bg-red-600/90 border-red-400/40"
    : "bg-gray-800/90 border-white/10";

  return (
    <div className={`rounded-lg border text-white shadow-xl backdrop-blur-sm px-3 py-2 text-sm transition-all duration-300
      ${tone} ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`} role="status">
      <div className="flex items-start gap-2">
        <div className="flex-1">{item.text}</div>
        <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">✕</button>
      </div>
    </div>
  );
}

type ConfirmState = {
  open: boolean; title: string; message: string; confirmText?: string; danger?: boolean;
  resolve?: (ok: boolean) => void;
};

function ConfirmDialog({ state, setState }: { state: ConfirmState; setState: (s: ConfirmState) => void }) {
  const close = (ok: boolean) => { state.resolve?.(ok); setState({ ...state, open: false }); };
  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-200 ${state.open ? "visible" : "invisible"}`}>
      <div className={`absolute inset-0 bg-black/70 transition-opacity ${state.open ? "opacity-100" : "opacity-0"}`} onClick={() => close(false)} />
      <div className={`relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0f19] p-6 shadow-2xl transition-all ${state.open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <h3 className="text-xl font-bold text-white">{state.title}</h3>
        <p className="mt-2 text-gray-400 leading-relaxed">{state.message}</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          <button onClick={() => close(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={() => close(true)} className={`px-5 py-2.5 rounded-xl text-white font-medium transition-colors ${state.danger ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"}`}>
            {state.confirmText ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

const askConfirm = (setState: (s: ConfirmState) => void, opts: Omit<ConfirmState, "open" | "resolve">) =>
  new Promise<boolean>((resolve) => setState({ ...opts, open: true, resolve }));

/* ---- Logic Helpers ---- */
type StoryDoc = {
  title: string;
  authorId: string;
  authorName: string;
  authorHandle?: string | null;
  content: { type: "single"; body: string };
  tags?: string[];
  counts?: { reactions: number; comments: number; reads: number };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const SITE_URL = "https://pinoytambayanhub.com";
const getIdFromSlug = (slugOrId: string) => slugOrId.split("-").pop() as string;

const fmtDate = (ts?: Timestamp) => {
  if (!ts) return "";
  const d = (ts as any).toDate ? (ts as any).toDate() : new Date((ts as any).seconds * 1000);
  return d.toISOString();
};

const fmtDatePretty = (ts?: Timestamp) => {
  if (!ts) return "";
  const d = (ts as any).toDate ? (ts as any).toDate() : new Date((ts as any).seconds * 1000);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
};

function makeDescription(body?: string, max = 160) {
  if (!body) return "Read a community-written Pinoy story on Pinoy Tambayan Hub.";
  const text = body.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export default function StoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { slug } = router.query as { slug?: string };

  const [story, setStory] = useState<StoryDoc | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: "", message: "" });
  
  const topRef = useRef<HTMLDivElement | null>(null);

  const pushToast: ReactionNotify = (kind, text) =>
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), kind, text }]);
  const popToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Calculate Read Time (Avg 200 words per minute)
  const readTime = useMemo(() => {
    if (!story?.content.body) return 0;
    const words = story.content.body.trim().split(/\s+/).length;
    return Math.ceil(words / 200);
  }, [story?.content.body]);

  const scrollToTopSafe = useCallback(() => {
    const navH = window.innerWidth >= 768 ? 96 : 80;
    const y = (topRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - navH - 6;
    window.scrollTo({ top: Math.max(0, y), left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!slug) return;
    const _id = getIdFromSlug(slug);
    setId(_id);

    (async () => {
      setLoading(true);
      try {
        const ref = doc(db, "stories", _id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setStory(null);
        } else {
          setStory(snap.data() as StoryDoc);
          // Increment views
          const key = `read:${_id}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            updateDoc(ref, { "counts.reads": increment(1) }).catch(() => {});
          }
        }
      } catch (err) {
        pushToast("error", "Error loading story.");
      } finally {
        setLoading(false);
        requestAnimationFrame(scrollToTopSafe);
      }
    })();
  }, [slug, scrollToTopSafe]);

  const onDeleteStory = useCallback(async () => {
    if (!id || !story || !user || story.authorId !== user.uid) return;
    const ok = await askConfirm(setConfirm, {
      title: "Delete story?",
      message: "This action cannot be undone. All reactions and comments will be lost.",
      confirmText: "Delete Permanently",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "stories", id));
      pushToast("success", "Story deleted successfully.");
      setTimeout(() => router.replace("/stories"), 500);
    } catch {
      pushToast("error", "Failed to delete story.");
    }
  }, [id, story, user, router]);

  // SEO
  const canonicalUrl = `${SITE_URL}/stories/${slug}`;
  const metaTitle = story?.title ? `${story.title} | Pinoy Tambayan Hub` : "Story";
  const metaDesc = makeDescription(story?.content?.body);

  if (loading) {
    return (
      <section className="section animate-pulse">
        <article className="container-page max-w-3xl">
          <div className="h-4 w-24 bg-white/5 rounded mb-8" />
          <div className="h-10 w-3/4 bg-white/10 rounded mb-4" />
          <div className="h-4 w-1/2 bg-white/5 rounded mb-12" />
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-4 w-full bg-white/5 rounded" />)}
          </div>
        </article>
      </section>
    );
  }

  if (!story) return <div className="section container-page text-center py-20 text-gray-400">Story not found.</div>;

  const isOwner = user?.uid === story.authorId;

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={story.title} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${SITE_URL}/brand/og-cover.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        {fmtDate(story.createdAt) && <meta property="article:published_time" content={fmtDate(story.createdAt)} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": story.title,
          "author": { "@type": "Person", "name": story.authorName },
          "datePublished": fmtDate(story.createdAt),
          "publisher": { "@type": "Organization", "name": "Pinoy Tambayan Hub" }
        })}} />
      </Head>

      <section className="section pb-20">
        <article className="container-page max-w-3xl">
          <ConfirmDialog state={confirm} setState={setConfirm} />
          <ToastViewport toasts={toasts} onClose={popToast} />
          <div ref={topRef} className="scroll-mt-32" />

          {/* Header Actions */}
          <div className="mb-8 flex items-center justify-between">
            <Link href="/stories" className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Stories
            </Link>
            {isOwner && (
              <div className="flex gap-2">
                <Link href={`/stories/edit/${id}`} className="px-4 py-1.5 rounded-xl border border-white/10 text-sm hover:bg-white/5">Edit</Link>
                <button onClick={onDeleteStory} className="px-4 py-1.5 rounded-xl bg-red-600/10 text-red-500 text-sm hover:bg-red-600 hover:text-white transition-all">Delete</button>
              </div>
            )}
          </div>

          {/* Title Section */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4">
            {story.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-8 border-b border-white/5 pb-6">
            <span className="text-white font-bold">{story.authorName}</span>
            {story.authorHandle && <Link href={`/u/${story.authorHandle}`} className="text-blue-400 hover:underline">@{story.authorHandle}</Link>}
            <span className="opacity-30">|</span>
            <span>{fmtDatePretty(story.createdAt)}</span>
            <span className="opacity-30">|</span>
            <span className="bg-white/5 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">{readTime} min read</span>
          </div>

          {/* Story Body */}
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-[1.8] text-[17px] text-gray-200 antialiased selection:bg-blue-500/30">
              {story.content.body}
            </p>
          </div>

          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {story.tags.map(t => (
                <span key={t} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">#{t}</span>
              ))}
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-white/5">
            <ReactionBar storyId={id!} notify={pushToast} />
          </div>

          <div className="mt-12">
            <Comments storyId={id!} initialBatch={5} enableDelete notify={pushToast} />
          </div>
        </article>
      </section>
    </>
  );
}