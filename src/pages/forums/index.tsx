"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../../firebase/clientApp";
import {
  collection,
  getDocs,
  limit as fsLimit,
  orderBy,
  query as fsQuery,
  startAfter,
  where,
  type Query,
  type DocumentSnapshot,
} from "firebase/firestore";
import ThreadItem, { Thread } from "../../components/Forum/ThreadItem";
import ForumLayout from "../../components/Forum/ForumLayout";
import Shoutbox from "../../components/Forum/Shoutbox";
import WidgetCard from "../../components/Forum/WidgetCard";
import CategoryPill from "../../components/Forum/CategoryPill";

const PAGE_SIZE = 12;
const CATEGORIES = [
  { id: "all",     label: "All" },
  { id: "general", label: "General Discussions" },
  { id: "mobile",  label: "Mobile Networks" },
  { id: "web",     label: "Web · Internet" },
  { id: "media",   label: "Streaming · Media" },
  { id: "tech",    label: "Technology · Computing" },
  { id: "gaming",  label: "Gaming Hub" },
  { id: "lounge",  label: "Community Lounge" },
];
const isValidCat = (c?: string) => !!CATEGORIES.find((x) => x.id === c);

export default function ForumsHome() {
  const router = useRouter();
  const initialCat = isValidCat(router.query.cat as string) ? (router.query.cat as string) : "all";
  const [category, setCategory] = useState<string>(initialCat);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");

  const [featured, setFeatured] = useState<Thread[]>([]);
  const [recent, setRecent] = useState<Thread[]>([]);

  // reflect URL cat
  useEffect(() => {
    const nextCat = (router.query.cat as string) || "all";
    const safe = isValidCat(nextCat) ? nextCat : "all";
    if (safe !== category) setCategory(safe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.cat]);

  const buildQuery = (after?: DocumentSnapshot): Query => {
    const col = collection(db, "threads");
    const clauses: any[] = [
      orderBy("lastReplyAt", "desc"),
      orderBy("createdAt", "desc"),
      fsLimit(PAGE_SIZE),
    ];
    const tagVal = tag.trim().toLowerCase();
    if (category !== "all") clauses.unshift(where("category", "==", category));
    if (tagVal) clauses.unshift(where("tags", "array-contains", tagVal));
    if (after) clauses.splice(clauses.length - 1, 0, startAfter(after));
    return fsQuery(col, ...clauses);
  };

  const mapThreads = (snap: any): Thread[] =>
    snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) })) as Thread[];

  const qBase = useMemo(() => buildQuery(), [category, tag]);

  // initial load
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const snap = await getDocs(qBase);
      if (ignore) return;
      const docs = mapThreads(snap);
      setThreads(docs);
      setCursor(snap.docs[snap.docs.length - 1] || null);
      setMore(snap.size === PAGE_SIZE);
      setLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, [qBase]);

  // right rail
  useEffect(() => {
    (async () => {
      const feat = await getDocs(
        fsQuery(collection(db, "threads"), orderBy("replyCount", "desc"), orderBy("createdAt", "desc"), fsLimit(6))
      );
      setFeatured(mapThreads(feat));
      const rec = await getDocs(
        fsQuery(collection(db, "threads"), orderBy("createdAt", "desc"), fsLimit(10))
      );
      setRecent(mapThreads(rec));
    })();
  }, []);

  const loadMore = async () => {
    if (!cursor) return;
    const snap = await getDocs(buildQuery(cursor));
    const docs = mapThreads(snap);
    setThreads((p) => [...p, ...docs]);
    setCursor(snap.docs[snap.docs.length - 1] || null);
    setMore(snap.size === PAGE_SIZE);
  };

  // debounced client search
  const [displayed, setDisplayed] = useState<Thread[]>([]);
  const debounceRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const s = search.trim().toLowerCase();
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (!s) return setDisplayed(threads);
      setDisplayed(
        threads.filter((t) => t.title.toLowerCase().includes(s) || t.body.toLowerCase().includes(s))
      );
    }, 180);
    return () => window.clearTimeout(debounceRef.current);
  }, [threads, search]);

  // SEO
  const catLabel = CATEGORIES.find((c) => c.id === category)?.label || "All";
  const title =
    category === "all" ? "Forums — Pinoy Tambayan Hub" : `${catLabel} — Forums | Pinoy Tambayan Hub`;
  const url = `https://pinoytambayanhub.com/forums${category !== "all" ? `?cat=${category}` : ""}`;
  const desc = "Join the discussion: tech, mobile, web, media, gaming, and more on Pinoy Tambayan Hub.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
      </Head>

      <ForumLayout
        title="Trending on PTHub"
        rightRail={
          <>
            <WidgetCard title="Featured content">
              <ul className="space-y-2">
                {featured.map((t) => (
                  <li key={t.id} className="flex flex-col gap-1">
                    <Link href={`/forums/${t.id}`} className="text-sm text-gray-200 hover:text-white">
                      {t.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CategoryPill cat={(t as any).category} />
                      <span>
                        {(t.replyCount ?? 0)} {(t.replyCount ?? 0) === 1 ? "reply" : "replies"}
                      </span>
                    </div>
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
        <Shoutbox />

        <div className="rounded-2xl bg-[#121722] border border-gray-800">
          <div className="px-3 py-2 border-b border-gray-800 flex flex-col md:flex-row md:items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Quick search…"
              className="flex-1 rounded-md bg-[#0f1420] border border-gray-800 px-3 py-2 text-gray-100 outline-none focus:border-blue-500"
            />
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Filter by tag (e.g., opm)"
              className="w-full md:w-56 rounded-md bg-[#0f1420] border border-gray-800 px-3 py-2 text-gray-100 outline-none focus:border-blue-500"
            />
            <Link
              href="/forums/new"
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-medium text-white md:ml-auto"
            >
              Post thread
            </Link>
          </div>

          <div className="p-3 grid gap-3">
            {loading ? (
              <div className="grid gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-gray-800/40 animate-pulse" />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-gray-400">No threads yet.</div>
            ) : (
              displayed.map((t) => <ThreadItem key={t.id} t={t} />)
            )}

            {more && !loading && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  className="rounded-xl border border-gray-700 hover:bg-gray-800 px-4 py-2 text-gray-200"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      </ForumLayout>
    </>
  );
}
