"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { db } from "../../firebase/clientApp";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  orderBy,
  query,
  limit as fsLimit,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import ForumLayout from "../../components/Forum/ForumLayout";
import WidgetCard from "../../components/Forum/WidgetCard";
import CategoryPill from "../../components/Forum/CategoryPill";

type Thread = { id: string; title: string; replyCount?: number; tags?: string[] };

const CATEGORIES = [
  { id: "general", label: "General Discussions" },
  { id: "mobile",  label: "Mobile Networks" },
  { id: "web",     label: "Web · Internet" },
  { id: "media",   label: "Streaming · Media" },
  { id: "tech",    label: "Technology · Computing" },
  { id: "gaming",  label: "Gaming Hub" },
  { id: "lounge",  label: "Community Lounge" },
] as const;

const TITLE_MAX = 120;
const BODY_MAX  = 20000;
const TAG_MAX   = 24;
const TAGS_MAX  = 5;
const DRAFT_KEY = "pth_forum_draft_new";

function sanitizeTags(input: string): string[] {
  const seen = new Set<string>();
  return input
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => t.slice(0, TAG_MAX))
    .filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .slice(0, TAGS_MAX);
}

export default function NewThread() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [busy, setBusy] = useState(false);
  const lastSubmitRef = useRef<number>(0);

  // right rail
  const [featured, setFeatured] = useState<Thread[]>([]);
  const [recent, setRecent] = useState<Thread[]>([]);

  // form state
  const [category, setCategory] = useState<string>("general");
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [tags, setTags]   = useState("");

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

  // autosave draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { category:string; title:string; body:string; tags:string };
      setCategory(d.category ?? "general");
      setTitle(d.title ?? "");
      setBody(d.body ?? "");
      setTags(d.tags ?? "");
    } catch {}
  }, []);
  const draft = useMemo(() => ({ category, title, body, tags }), [category, title, body, tags]);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [draft]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to post.");
      return;
    }
    const t = title.trim();
    const b = body.trim();
    const cleanTags = sanitizeTags(tags);

    if (!t || !b) {
      toast.error("Please complete the title and content.");
      return;
    }
    if (t.length > TITLE_MAX) {
      toast.error(`Title is too long (max ${TITLE_MAX} chars).`);
      return;
    }
    if (b.length > BODY_MAX) {
      toast.error(`Content is too long (max ${BODY_MAX} chars).`);
      return;
    }

    const now = Date.now();
    if (now - lastSubmitRef.current < 600) return;
    lastSubmitRef.current = now;

    setBusy(true);
    try {
      const ref = await addDoc(collection(db, "threads"), {
        title: t,
        body: b,
        category,
        tags: cleanTags,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || "User",
        authorPhoto: profile?.photoURL || user.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        replyCount: 0,
        lastReplyAt: serverTimestamp(),
      });

      try { localStorage.removeItem(DRAFT_KEY); } catch {}

      toast.success("Thread posted!");
      router.push(`/forums/${ref.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to post thread.");
    } finally {
      setBusy(false);
    }
  }

  const titleSEO = "Create a Thread — Forums | Pinoy Tambayan Hub";
  const descSEO  = "Start a new discussion on Pinoy Tambayan Hub forums.";
  const urlSEO   = "https://pinoytambayanhub.com/forums/new";

  const titleCount = `${title.length}/${TITLE_MAX}`;
  const bodyCount  = `${body.length}/${BODY_MAX}`;
  const tagsPreview = sanitizeTags(tags);

  return (
    <>
      <Head>
        <title>{titleSEO}</title>
        <meta name="description" content={descSEO} />
        <link rel="canonical" href={urlSEO} />
        <meta property="og:title" content={titleSEO} />
        <meta property="og:description" content={descSEO} />
        <meta property="og:url" content={urlSEO} />
        <meta property="og:type" content="website" />
      </Head>

      <ForumLayout
        title="Create a Thread"
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
                      <span>{(t.replyCount ?? 0)} {(t.replyCount ?? 0) === 1 ? "reply" : "replies"}</span>
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
        {/* back */}
        <div className="flex items-center justify-end">
          <Link
            href="/forums"
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800/60"
          >
            ← Back to threads
          </Link>
        </div>

        {/* composer */}
        <div className="rounded-2xl bg-[#121722] border border-gray-800 p-4">
          {!user ? (
            <div className="text-gray-400">
              You must be signed in to post.{" "}
              <Link href="/login" className="text-blue-400 underline">Login</Link>
            </div>
          ) : (
            <form onSubmit={create} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full rounded-xl bg-[#151924] border border-gray-800 px-4 py-3 text-gray-100 outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Tags (comma-separated, up to {TAGS_MAX})
                  </label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="opm, radio"
                    className="w-full rounded-xl bg-[#151924] border border-gray-800 px-4 py-3 text-gray-100 outline-none focus:border-blue-500"
                  />
                  {tagsPreview.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {tagsPreview.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm text-gray-400 mb-1">Title</label>
                  <span className="text-xs text-gray-500">{titleCount}</span>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                  required
                  maxLength={TITLE_MAX}
                  placeholder="What do you want to talk about?"
                  className="w-full rounded-xl bg-[#151924] border border-gray-800 px-4 py-3 text-gray-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm text-gray-400 mb-1">Content</label>
                  <span className="text-xs text-gray-500">{bodyCount}</span>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                  required
                  maxLength={BODY_MAX}
                  rows={10}
                  placeholder="Write details here…"
                  className="w-full rounded-xl bg-[#151924] border border-gray-800 px-4 py-3 text-gray-100 outline-none focus:border-blue-500 whitespace-pre-wrap"
                />
                <p className="mt-1 text-xs text-gray-500">Tip: links are allowed; HTML is not.</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Press Ctrl/⌘ + Enter to post</span>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-5 py-3 font-medium"
                >
                  {busy ? "Posting…" : "Post Thread"}
                </button>
              </div>
            </form>
          )}
        </div>
      </ForumLayout>
    </>
  );
}
