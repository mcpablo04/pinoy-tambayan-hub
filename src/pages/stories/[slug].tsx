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
      const snap = await getDoc(doc(db, "stories", _id));
      if (!snap.exists()) {
        setStory(null);
        setLoading(false);
        return;
      }
      const data = snap.data() as StoryDoc;
      setStory(data);
      setLoading(false);

      // count a read once per session
      try {
        const key = `read:${_id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          await updateDoc(doc(db, "stories", _id), { "counts.reads": increment(1) });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <main className="pt-20 sm:pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 text-gray-300">Loading…</div>
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
    <main className="pt-20 sm:pt-24 pb-24">
      <article className="mx-auto max-w-3xl px-4">
        <div className="mb-6">
          <Link href="/stories" className="text-sm text-gray-300 hover:underline">← Back to Stories</Link>
        </div>

        <h1 className="text-3xl font-semibold text-white">{story.title}</h1>
        <p className="text-sm text-gray-300 mt-2">
          by <span className="font-medium text-white">{story.authorName}</span>
          {story.authorHandle ? (
            <> · <Link href={`/u/${story.authorHandle}`} className="hover:underline">@{story.authorHandle}</Link></>
          ) : null}
        </p>

        {story.tags && story.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {story.tags.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-200">
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        {/* Content */}
        <div className="prose prose-invert max-w-none mt-8">
          <p style={{ whiteSpace: "pre-wrap" }}>{story.content.body}</p>
        </div>

        {/* Reactions */}
        <ReactionBar storyId={id} />

        {/* Comments */}
        <Comments storyId={id} />
      </article>
    </main>
  );
}
