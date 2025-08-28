// src/pages/stories/[slug].tsx
"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  doc,
  getDoc,
  increment,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/clientApp";
import ReactionBar from "../../components/ReactionBar";
import Comments from "../../components/Comments";

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

const getIdFromSlug = (slugOrId: string) => {
  const parts = slugOrId.split("-");
  return parts[parts.length - 1];
};

export default function StoryPage() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };

  const [story, setStory] = useState<StoryDoc | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // anchor to avoid being hidden under the fixed navbar
  const topRef = useRef<HTMLDivElement | null>(null);

  const scrollToTopSafe = useCallback(() => {
    const navH = window.matchMedia("(min-width: 768px)").matches ? 96 : 80; // pt-24 / pt-20
    const y =
      (topRef.current?.getBoundingClientRect().top ?? 0) +
      window.scrollY -
      navH -
      6;
    window.scrollTo({ top: Math.max(0, y), left: 0, behavior: "auto" });
  }, []);

  // force top on mount + whenever slug changes
  useEffect(() => {
    if (!slug) return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    requestAnimationFrame(scrollToTopSafe);
  }, [slug, scrollToTopSafe]);

  useEffect(() => {
    if (!slug) return;
    const _id = getIdFromSlug(slug);
    setId(_id);

    (async () => {
      setLoading(true);
      const ref = doc(db, "stories", _id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setStory(null);
        setLoading(false);
        return;
      }

      const data = snap.data() as StoryDoc;
      setStory(data);
      setLoading(false);

      // Count a read once per session (may be blocked by your rules if counts isn't allowed)
      try {
        const key = `read:${_id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          await updateDoc(ref, { "counts.reads": increment(1) });
        }
      } catch {
        /* ignore */
      }

      requestAnimationFrame(scrollToTopSafe);
    })();
  }, [slug, scrollToTopSafe]);

  if (loading) {
    return (
      <section className="section">
        <article className="container-page max-w-3xl">
          <div className="h-4 w-24 rounded bg-gray-700/50 mb-4 animate-pulse" />
          <div className="h-6 w-3/4 rounded bg-gray-700/60 mb-3 animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-gray-700/60 mb-6 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-gray-800/60 animate-pulse" />
            ))}
          </div>
        </article>
      </section>
    );
  }

  if (!story || !id) {
    return (
      <section className="section">
        <article className="container-page max-w-3xl text-gray-300">
          Story not found.
        </article>
      </section>
    );
  }

  return (
    <section className="section">
      <article className="container-page max-w-3xl">
        {/* anchor so we can scroll with header offset */}
        <div ref={topRef} style={{ scrollMarginTop: "110px" }} />

        {/* Back link */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white px-2 py-1 -mx-2 rounded hover:bg-white/5"
          >
            <span aria-hidden>←</span> Back to Stories
          </Link>
        </div>

        {/* Title & author */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-tight">
          {story.title}
        </h1>

        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-300">
          <span>
            by <span className="font-medium text-white">{story.authorName}</span>
          </span>
          {story.authorHandle ? (
            <>
              <span className="text-gray-500">·</span>
              <Link href={`/u/${story.authorHandle}`} className="text-blue-400 hover:underline">
                @{story.authorHandle}
              </Link>
            </>
          ) : null}
        </div>

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="-mx-4 px-4 mt-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {story.tags.map((t) => (
                <span
                  key={t}
                  className="shrink-0 text-xs px-2 py-1 rounded-full bg-white/10 text-gray-200"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mt-6 sm:mt-8">
          <p className="whitespace-pre-wrap leading-relaxed text-[15px] sm:text-base text-gray-200">
            {story.content.body}
          </p>
        </div>

        {/* Reactions */}
        <div className="mt-6 sm:mt-8">
          {/* Mobile sticky */}
          <div className="block sm:hidden fixed inset-x-0 bottom-0 z-40">
            <div className="mx-auto max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
              <div className="rounded-t-xl bg-gray-900/95 border-t border-white/10 backdrop-blur-sm p-3">
                <ReactionBar storyId={id} />
              </div>
            </div>
          </div>
          {/* Desktop inline */}
          <div className="hidden sm:block">
            <ReactionBar storyId={id} />
          </div>
        </div>

        {/* Comments – live first 5 + Load more */}
        <div className="mt-6 sm:mt-8">
          <Comments storyId={id} initialBatch={5} />
        </div>

        {/* Spacer so the fixed mobile bar doesn't cover the bottom */}
        <div className="pb-[110px] sm:pb-0" />
      </article>
    </section>
  );
}
