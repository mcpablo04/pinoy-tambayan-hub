// src/pages/stories/index.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/clientApp";
import ReactionBar from "../../components/ReactionBar";

type Story = {
  id: string;
  title: string;
  slug?: string | null;
  authorName: string;
  authorHandle?: string | null;
  tags?: string[];
  counts?: { reactions: number; comments: number; reads: number };
  createdAt?: Timestamp;
};

function slugOrId(s: Story) {
  return s.slug && s.slug.length > 0 ? s.slug : s.id;
}

export default function StoriesFeed() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, "stories"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      const list: Story[] = [];
      snap.forEach((d) => {
        const s = d.data() as any;
        if (s.status !== "published" || s.visibility === "private") return;
        list.push({
          id: d.id,
          title: s.title,
          slug: s.slug ?? null,
          authorName: s.authorName,
          authorHandle: s.authorHandle ?? null,
          tags: s.tags || [],
          counts: s.counts || { reactions: 0, comments: 0, reads: 0 },
          createdAt: s.createdAt,
        });
      });
      setStories(list);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="pt-20 sm:pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-white">Stories</h1>
          <Link
            href="/stories/new"
            className="px-3 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90"
          >
            Write a Story
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-300">Loading…</p>
        ) : stories.length === 0 ? (
          <p className="text-gray-300">No stories yet. Be the first to write!</p>
        ) : (
          <ul className="grid gap-4">
            {stories.map((s) => (
              <li
                key={s.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/stories/${slugOrId(s)}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/stories/${slugOrId(s)}`);
                  }
                }}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <h2 className="text-lg font-medium text-white">
                  {/* Stop propagation so clicking the title doesn’t double-navigate */}
                  <a
                    href={`/stories/${slugOrId(s)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline"
                  >
                    {s.title}
                  </a>
                </h2>

                <p className="text-sm text-gray-300 mt-1">
                  by{" "}
                  <span className="font-medium text-white">{s.authorName}</span>
                  {s.authorHandle ? (
                    <>
                      {" "}
                      ·{" "}
                      <Link
                        href={`/u/${s.authorHandle}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        @{s.authorHandle}
                      </Link>
                    </>
                  ) : null}
                </p>

                {s.tags && s.tags.length > 0 ? (
                  <div
                    className="mt-2 flex flex-wrap gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-200"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Inline reactions (compact). Stop propagation so clicks don’t open the story. */}
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <ReactionBar storyId={s.id} compact />
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  {s.counts?.reads ?? 0} reads · {s.counts?.comments ?? 0} comments
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
