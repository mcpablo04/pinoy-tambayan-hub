// src/pages/stories/index.tsx
"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  startAfter,
  endBefore,
  limitToLast,
  type Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
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

const PAGE_SIZE = 10;
const slugOrId = (s: Story) => (s.slug && s.slug.length > 0 ? s.slug : s.id);
const fmtDate = (ts?: Timestamp) => {
  try {
    if (!ts) return "";
    const d = (ts as any).toDate ? ((ts as any).toDate() as Date) : new Date((ts as any).seconds * 1000);
    return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
};

/** Skeleton card */
function SkeletonStoryCard() {
  return (
    <li className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-2/3 rounded bg-white/10" />
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="flex gap-2">
          <div className="h-5 w-14 rounded-full bg-white/10" />
          <div className="h-5 w-16 rounded-full bg-white/10" />
          <div className="h-5 w-10 rounded-full bg-white/10" />
        </div>
        <div className="h-4 w-32 rounded bg-white/10" />
      </div>
    </li>
  );
}

export default function StoriesFeed() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [firstCursors, setFirstCursors] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [lastCursors, setLastCursors] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const topRef = useRef<HTMLDivElement | null>(null);

  const baseQuery = useCallback(() => query(collection(db, "stories"), orderBy("createdAt", "desc")), []);

  const toStory = (d: QueryDocumentSnapshot<DocumentData>): Story | null => {
    const s = d.data() as any;
    if (s.status !== "published" || s.visibility === "private") return null;
    return {
      id: d.id,
      title: s.title,
      slug: s.slug ?? null,
      authorName: s.authorName,
      authorHandle: s.authorHandle ?? null,
      tags: s.tags || [],
      counts: s.counts || { reactions: 0, comments: 0, reads: 0 },
      createdAt: s.createdAt,
    };
  };

  const scrollTopWithOffset = useCallback(() => {
    const el = topRef.current;
    if (!el) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    const rect = el.getBoundingClientRect();
    const yNow = window.pageYOffset || document.documentElement.scrollTop;
    const navH = window.matchMedia("(min-width: 768px)").matches ? 96 : 80;
    const y = rect.top + yNow - navH - 4;
    window.scrollTo({ top: Math.max(0, y), left: 0, behavior: "auto" });
  }, []);

  async function loadPage(direction: "init" | "next" | "prev") {
    setLoading(true);
    let q = baseQuery();
    let snap;

    if (direction === "init") {
      q = query(q, fsLimit(PAGE_SIZE + 1));
      snap = await getDocs(q);
    } else if (direction === "next") {
      const last = lastCursors[page];
      if (!last) {
        setLoading(false);
        return;
      }
      q = query(q, startAfter(last), fsLimit(PAGE_SIZE + 1));
      snap = await getDocs(q);
    } else {
      const first = firstCursors[page];
      if (!first) {
        setLoading(false);
        return;
      }
      q = query(q, endBefore(first), limitToLast(PAGE_SIZE + 1));
      snap = await getDocs(q);
    }

    const docs = snap.docs;
    const mapped = docs.map(toStory).filter(Boolean) as Story[];
    const hasMore = mapped.length > PAGE_SIZE;
    const pageItems = direction === "prev" ? mapped.slice(-PAGE_SIZE) : mapped.slice(0, PAGE_SIZE);
    setStories(pageItems);

    const firstDoc = direction === "prev" ? docs.slice(-PAGE_SIZE)[0] ?? docs[0] : docs[0];
    const lastDoc = direction === "prev" ? docs.slice(-1)[0] : docs[Math.min(PAGE_SIZE - 1, docs.length - 1)];

    if (firstDoc && lastDoc) {
      if (direction === "init") {
        setFirstCursors([firstDoc]);
        setLastCursors([lastDoc]);
        setPage(0);
        setHasNextPage(hasMore);
      } else if (direction === "next") {
        setFirstCursors((p) => {
          const a = p.slice(0, page + 1);
          a.push(firstDoc);
          return a;
        });
        setLastCursors((p) => {
          const a = p.slice(0, page + 1);
          a.push(lastDoc);
          return a;
        });
        setPage((p) => p + 1);
        setHasNextPage(hasMore);
      } else {
        setFirstCursors((p) => {
          const a = p.slice(0, page);
          a[a.length - 1] = firstDoc;
          return a;
        });
        setLastCursors((p) => {
          const a = p.slice(0, page);
          a[a.length - 1] = lastDoc;
          return a;
        });
        setPage((p) => Math.max(0, p - 1));
        setHasNextPage(true);
      }
    } else {
      if (direction === "init") {
        setFirstCursors([]);
        setLastCursors([]);
        setPage(0);
        setHasNextPage(false);
      } else if (direction === "next") {
        setHasNextPage(false);
      }
    }

    setLoading(false);
    requestAnimationFrame(scrollTopWithOffset);
  }

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    loadPage("init");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPrev = page > 0;
  const canNext = hasNextPage || page < lastCursors.length - 1;

  return (
    <>
      {/* SEO */}
      <Head>
        <title>Pinoy Stories — Drama, Romance & One-shots | Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Browse community-written Pinoy stories — drama, romance, and one-shots. Read, react, and support your favorite authors."
        />
        <link rel="canonical" href="https://pinoytambayanhub.com/stories" />

        <meta property="og:title" content="Pinoy Stories — Drama, Romance & One-shots" />
        <meta
          property="og:description"
          content="A community feed of Filipino short stories. Discover new authors and react to your faves."
        />
        <meta property="og:image" content="/brand/og-cover.png" />
        <meta property="og:url" content="https://pinoytambayanhub.com/stories" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pinoy Stories — Drama, Romance & One-shots" />
        <meta
          name="twitter:description"
          content="Read community-written Pinoy short stories and one-shots."
        />
        <meta name="twitter:image" content="/brand/og-cover.png" />
      </Head>

      <section className="section">
        <div className="container-page max-w-5xl">
          <div ref={topRef} style={{ scrollMarginTop: "100px" }} />

          <div className="flex items-center justify-between mb-1">
            <h1 className="page-title mb-0">Stories</h1>
            <Link href="/stories/new" className="btn btn-primary text-sm">
              Write a Story
            </Link>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Drama • Romance • One-shots from the community
          </p>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonStoryCard key={i} />)
            ) : stories.length === 0 ? (
              <li className="col-span-full text-gray-300">
                No stories yet. Be the first to write!
              </li>
            ) : (
              stories.map((s) => (
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
                    <Link
                      href={`/stories/${slugOrId(s)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline"
                    >
                      {s.title}
                    </Link>
                  </h2>

                  <p className="text-sm text-gray-300 mt-1">
                    by <span className="font-medium text-white">{s.authorName}</span>
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
                    {s.createdAt ? (
                      <>
                        {" "}
                        · <span className="text-gray-400">{fmtDate(s.createdAt)}</span>
                      </>
                    ) : null}
                  </p>

                  {s.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      {s.tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-200">
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <ReactionBar storyId={s.id} compact />
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    {s.counts?.reads ?? 0} reads · {s.counts?.comments ?? 0} comments
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            <button
              disabled={!canPrev || loading}
              onClick={() => loadPage("prev")}
              className={`px-3 py-2 rounded-md text-sm font-medium border border-white/10 ${
                canPrev && !loading
                  ? "bg-white/5 text-gray-100 hover:bg-white/10"
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              }`}
              aria-disabled={!canPrev || loading}
            >
              ← Previous
            </button>

            <div className="text-xs text-gray-400">Page {page + 1}</div>

            <button
              disabled={!canNext || loading}
              onClick={() => loadPage("next")}
              className={`px-3 py-2 rounded-md text-sm font-medium border border-white/10 ${
                canNext && !loading
                  ? "bg-white/5 text-gray-100 hover:bg-white/10"
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              }`}
              aria-disabled={!canNext || loading}
            >
              Next →
            </button>
          </div>

          <div className="page-bottom-spacer" />
        </div>
      </section>
    </>
  );
}
