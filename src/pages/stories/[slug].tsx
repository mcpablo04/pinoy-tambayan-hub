"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { doc, getDoc, increment, updateDoc, deleteDoc, type Timestamp } from "firebase/firestore";
import { db } from "../../firebase/clientApp";
import ReactionBar, { type Notify as ReactionNotify, type NotifyKind as ReactionNotifyKind } from "../../components/ReactionBar";
import Comments from "../../components/Comments";
import { useAuth } from "../../context/AuthContext";

/* ---- Toast + Confirm ---- */
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
  const tone =
    item.kind === "success" ? "bg-emerald-600/90 border-emerald-400/40"
    : item.kind === "error" ? "bg-red-600/90 border-red-400/40"
    : "bg-gray-800/90 border-white/10";
  return (
    <div className={`rounded-lg border text-white shadow-xl backdrop-blur-sm px-3 py-2 text-sm transition-all duration-300
      ${tone} ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`} role="status" aria-live="polite">
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
    <div className={`fixed inset-0 z-[90] ${state.open ? "" : "pointer-events-none"}`} aria-hidden={!state.open}>
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${state.open ? "opacity-100" : "opacity-0"}`} onClick={() => close(false)} />
      <div className={`absolute inset-0 flex items-end sm:items-center justify-center p-4 transition-all duration-200 ${state.open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0b0f19] p-5 shadow-2xl">
          <h3 className="text-lg font-semibold text-white">{state.title}</h3>
          <p className="mt-2 text-sm text-gray-300">{state.message}</p>
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <button onClick={() => close(false)} className="px-4 py-2 rounded-md border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10">Cancel</button>
            <button onClick={() => close(true)} className={`px-4 py-2 rounded-md text-white ${state.danger ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"}`}>
              {state.confirmText ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
const askConfirm = (setState: (s: ConfirmState) => void, opts: Omit<ConfirmState, "open" | "resolve">) =>
  new Promise<boolean>((resolve) => setState({ ...opts, open: true, resolve }));

/* ---- Types ---- */
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

const getIdFromSlug = (slugOrId: string) => slugOrId.split("-").pop() as string;
const fmtDate = (ts?: Timestamp) => {
  try {
    if (!ts) return "";
    const d = (ts as any).toDate ? (ts as any).toDate() as Date : new Date((ts as any).seconds * 1000);
    return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
  } catch { return ""; }
};

export default function StoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { slug } = router.query as { slug?: string };

  const [story, setStory] = useState<StoryDoc | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast: ReactionNotify = (kind, text) =>
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), kind, text }]);
  const popToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: "", message: "" });

  // anchor below fixed header
  const topRef = useRef<HTMLDivElement | null>(null);
  const scrollToTopSafe = useCallback(() => {
    const navH = window.matchMedia("(min-width: 768px)").matches ? 96 : 80;
    const y = (topRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - navH - 6;
    window.scrollTo({ top: Math.max(0, y), left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!slug) return;
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    requestAnimationFrame(scrollToTopSafe);
  }, [slug, scrollToTopSafe]);

  // load story
  useEffect(() => {
    if (!slug) return;
    const _id = getIdFromSlug(slug);
    setId(_id);

    (async () => {
      setLoading(true);
      const ref = doc(db, "stories", _id);
      const snap = await getDoc(ref);
      if (!snap.exists()) { setStory(null); setLoading(false); return; }

      setStory(snap.data() as StoryDoc);
      setLoading(false);

      try {
        const key = `read:${_id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          await updateDoc(ref, { "counts.reads": increment(1) });
        }
      } catch {}
      requestAnimationFrame(scrollToTopSafe);
    })();
  }, [slug, scrollToTopSafe]);

  const onDeleteStory = useCallback(async () => {
    if (!id || !story || !user || story.authorId !== user.uid) return;
    const ok = await askConfirm(setConfirm, {
      title: "Delete story?",
      message: "This will remove the story. This cannot be undone.",
      confirmText: "Delete story",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "stories", id));
      pushToast("success", "Story deleted.");
      setTimeout(() => router.replace("/stories"), 300);
    } catch {
      pushToast("error", "Failed to delete story. Please try again.");
    }
  }, [id, story, user, router]);

  if (loading) {
    return (
      <section className="section">
        <article className="container-page max-w-3xl">
          <div className="h-4 w-24 rounded bg-gray-700/50 mb-4 animate-pulse" />
          <div className="h-6 w-3/4 rounded bg-gray-700/60 mb-3 animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-gray-700/60 mb-6 animate-pulse" />
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-gray-800/60 animate-pulse" />
          ))}</div>
        </article>
      </section>
    );
  }

  if (!story || !id) {
    return (
      <section className="section">
        <article className="container-page max-w-3xl text-gray-300">Story not found.</article>
      </section>
    );
  }

  const isOwner = !!user && user.uid === story.authorId;

  return (
    <section className="section">
      <article className="container-page max-w-3xl">
        {/* overlays */}
        <ConfirmDialog state={confirm} setState={setConfirm} />
        <ToastViewport toasts={toasts} onClose={popToast} />

        {/* anchor for header offset */}
        <div ref={topRef} style={{ scrollMarginTop: "110px" }} />

        {/* Back + actions */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <Link href="/stories" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white px-2 py-1 -mx-2 rounded hover:bg-white/5">
            <span aria-hidden>←</span> Back to Stories
          </Link>

          {isOwner && (
            <div className="flex items-center gap-2">
              <Link href={`/stories/edit/${id}`} className="px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 text-sm">Edit</Link>
              <button onClick={onDeleteStory} className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm">Delete</button>
            </div>
          )}
        </div>

        {/* Title + meta */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-tight">{story.title}</h1>

        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-300">
          <span>by <span className="font-medium text-white">{story.authorName}</span></span>
          {story.authorHandle && (
            <>
              <span className="text-gray-500">·</span>
              <Link href={`/u/${story.authorHandle}`} className="text-blue-400 hover:underline">@{story.authorHandle}</Link>
            </>
          )}
          {story.createdAt && (
            <>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{fmtDate(story.createdAt)}</span>
            </>
          )}
        </div>

        {/* Tags */}
        {story.tags?.length ? (
          <div className="-mx-4 px-4 mt-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {story.tags.map((t) => (
                <span key={t} className="shrink-0 text-xs px-2 py-1 rounded-full bg-white/10 text-gray-200">#{t}</span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className="mt-6 sm:mt-8">
          <p className="whitespace-pre-wrap leading-relaxed text-[15px] sm:text-base text-gray-200">
            {story.content.body}
          </p>
        </div>

        {/* Reactions — INLINE on all screens (no sticky footer) */}
        <div className="mt-6 sm:mt-8">
          <ReactionBar storyId={id} notify={pushToast} />
        </div>

        {/* Comments */}
        <div className="mt-6 sm:mt-8">
          <Comments storyId={id} initialBatch={5} enableDelete notify={pushToast} />
        </div>
      </article>
    </section>
  );
}
