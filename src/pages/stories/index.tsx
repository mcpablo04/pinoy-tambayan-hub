"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
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
import { db } from "../../lib/firebase";
import ReactionBar from "../../components/ReactionBar";
import { BookOpen, MessageCircle, PenTool, ChevronLeft, ChevronRight } from "lucide-react";

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
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
};

function SkeletonStoryCard() {
  return (
    <li className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 w-3/4 rounded-lg bg-white/5" />
        <div className="h-4 w-1/2 rounded bg-white/5" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-white/5" />
          <div className="h-6 w-16 rounded-full bg-white/5" />
        </div>
        <div className="pt-2 flex gap-4">
          <div className="h-4 w-12 rounded bg-white/5" />
          <div className="h-4 w-12 rounded bg-white/5" />
        </div>
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

  const hardScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const loadPage = useCallback(async (direction: "init" | "next" | "prev") => {
    setLoading(true);
    let q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
    let snap;

    try {
      if (direction === "init") {
        snap = await getDocs(query(q, fsLimit(PAGE_SIZE + 1)));
      } else if (direction === "next") {
        const last = lastCursors[page];
        snap = await getDocs(query(q, startAfter(last), fsLimit(PAGE_SIZE + 1)));
      } else {
        const first = firstCursors[page];
        snap = await getDocs(query(q, endBefore(first), limitToLast(PAGE_SIZE + 1)));
      }

      const docs = snap.docs;
      const hasMore = docs.length > PAGE_SIZE;
      
      // Process items (filtering out unpublished if necessary, though ideally done in Query)
      const mapped = docs.slice(0, PAGE_SIZE).map((d) => ({
        id: d.id,
        ...d.data(),
      } as Story));

      setStories(mapped);

      if (docs.length > 0) {
        const firstDoc = docs[0];
        const lastDoc = docs[Math.min(PAGE_SIZE - 1, docs.length - 1)];

        if (direction === "init") {
          setFirstCursors([firstDoc]);
          setLastCursors([lastDoc]);
          setPage(0);
        } else if (direction === "next") {
          setFirstCursors(p => [...p, firstDoc]);
          setLastCursors(p => [...p, lastDoc]);
          setPage(p => p + 1);
        } else {
          setPage(p => Math.max(0, p - 1));
        }
        setHasNextPage(hasMore);
      }
    } catch (err) {
      console.error("Pagination error:", err);
    } finally {
      setLoading(false);
      hardScrollToTop();
    }
  }, [page, lastCursors, firstCursors, hardScrollToTop]);

  useEffect(() => {
    loadPage("init");
  }, []);

  return (
    <>
      <Head>
        <title>Tambayan Stories | Read Pinoy One-Shots & Drama</title>
        <meta name="description" content="Discover community-written Pinoy stories. Read drama, romance, and one-shots from talented Filipino authors." />
      </Head>

      <section className="section pb-20">
        <div className="container-page max-w-5xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Stories</h1>
              <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                <PenTool size={14} className="text-blue-500" />
                Latest drama, romance, and one-shots from the hub.
              </p>
            </div>
            <Link href="/stories/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20 w-fit">
              <PenTool size={18} />
              Write Yours
            </Link>
          </div>

          {/* Feed */}
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonStoryCard key={i} />)
            ) : stories.length === 0 ? (
              <div className="col-span-full py-20 text-center rounded-3xl border border-dashed border-white/10">
                <p className="text-gray-500 font-medium">The ink has run dry. Be the first to start a new story!</p>
              </div>
            ) : (
              stories.map((s) => (
                <li
                  key={s.id}
                  onClick={() => router.push(`/stories/${slugOrId(s)}`)}
                  className="group cursor-pointer rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight line-clamp-2">
                        {s.title}
                      </h2>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                      <span className="text-gray-300 font-semibold">{s.authorName}</span>
                      <span>·</span>
                      <span>{fmtDate(s.createdAt)}</span>
                    </div>

                    {s.tags?.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {s.tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/5">
                            #{t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div onClick={(e) => e.stopPropagation()}>
                      <ReactionBar storyId={s.id} compact />
                    </div>
                    <div className="flex items-center gap-4 text-gray-500 text-xs font-bold uppercase tracking-tighter">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={14} /> {s.counts?.reads || 0}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle size={14} /> {s.counts?.comments || 0}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>

          {/* Pagination */}
          <div className="mt-12 flex items-center justify-center gap-6">
            <button
              disabled={page === 0 || loading}
              onClick={() => loadPage("prev")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 text-gray-300"
            >
              <ChevronLeft size={18} /> Prev
            </button>

            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">
              Page {page + 1}
            </span>

            <button
              disabled={!hasNextPage || loading}
              onClick={() => loadPage("next")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 text-gray-300"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}