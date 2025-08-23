// src/pages/stories/[slug].tsx
"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!slug) return;
    const _id = getIdFromSlug(slug);
    setId(_id);

    (async () => {
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

      // Count a read once per session (non-blocking)
      try {
        const key = `read:${_id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          await updateDoc(ref, { "counts.reads": increment(1) });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <main className="pt-20 sm:pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="h-4 w-24 rounded bg-gray-700/50 mb-4 animate-pulse" />
          <div className="h-6 w-3/4 rounded bg-gray-700/60 mb-3 animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-gray-700/60 mb-6 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-gray-800/60 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!story || !id) {
    return (
      <main className="pt-20 sm:pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 text-gray-300">
          Story not found.
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 sm:pt-24 pb-[110px] sm:pb-24"> 
      {/* pb includes a bit of safe area so bottom UI doesn’t crowd on phones */}
      <article className="mx-auto max-w-3xl px-4">
        {/* Back link: bigger tap target on mobile */}
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
              <Link
                href={`/u/${story.authorHandle}`}
                className="text-blue-400 hover:underline"
              >
                @{story.authorHandle}
              </Link>
            </>
          ) : null}
        </div>

        {/* Tags: horizontal scroll on very small screens to avoid wrapping tall stacks */}
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

        {/* Content: readable measure & comfy line-height on mobile */}
        <div className="mt-6 sm:mt-8">
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-[15px] sm:text-base text-gray-200">
              {story.content.body}
            </p>
          </div>
        </div>

        {/* Reactions: stick to bottom on mobile for easy access */}
        <div className="mt-6 sm:mt-8">
          <div className="block sm:hidden fixed inset-x-0 bottom-0 z-40">
            <div className="mx-auto max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
              <div className="rounded-t-xl bg-gray-900/95 border-t border-white/10 backdrop-blur-sm p-3">
                <ReactionBar storyId={id} />
              </div>
            </div>
          </div>

          {/* Desktop / tablet inline bar */}
          <div className="hidden sm:block">
            <ReactionBar storyId={id} />
          </div>
        </div>

        {/* Comments */}
        <div className="mt-6 sm:mt-8">
          <Comments storyId={id} />
        </div>
      </article>
    </main>
  );
}
