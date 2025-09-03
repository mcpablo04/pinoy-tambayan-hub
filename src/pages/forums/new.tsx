"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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
import Sidebar from "../../components/Forum/Sidebar";
import WidgetCard from "../../components/Forum/WidgetCard";

type Thread = { id: string; title: string; replyCount?: number; tags?: string[] };

const CATEGORIES = [
  { id: "general", label: "General Discussions" },
  { id: "mobile",  label: "Mobile Networks" },
  { id: "web",     label: "Web · Internet" },
  { id: "media",   label: "Streaming · Media" },
  { id: "tech",    label: "Technology · Computing" },
  { id: "gaming",  label: "Gaming Hub" },
  { id: "lounge",  label: "Community Lounge" },
];

export default function NewThread() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);

  // right rail (match index)
  const [featured, setFeatured] = useState<Thread[]>([]);
  const [recent, setRecent] = useState<Thread[]>([]);

  useEffect(() => {
    (async () => {
      const featSnap = await getDocs(
        query(collection(db, "threads"), orderBy("replyCount", "desc"), orderBy("createdAt", "desc"), fsLimit(6))
      );
      setFeatured(featSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Thread[]);

      const recSnap = await getDocs(
        query(collection(db, "threads"), orderBy("createdAt", "desc"), fsLimit(10))
      );
      setRecent(recSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Thread[]);
    })();
  }, []);

  // form state
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to post.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast.error("Please complete the title and content.");
      return;
    }

    setBusy(true);
    try {
      const cleanTags = tags
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5);

      const ref = await addDoc(collection(db, "threads"), {
        title: title.trim(),
        body: body.trim(),
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

      toast.success("Thread posted!");
      router.push(`/forums/${ref.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to post thread.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-3 md:px-4 py-5">
      <Head>
        <title>Create a Thread — Forums | Pinoy Tambayan Hub</title>
        <meta name="description" content="Start a new discussion on Pinoy Tambayan Hub forums." />
        <link rel="canonical" href="https://pinoytambayanhub.com/forums/new" />
        <meta property="og:title" content="Create a Thread — Pinoy Tambayan Hub Forums" />
        <meta property="og:description" content="Start a new discussion on Pinoy Tambayan Hub forums." />
        <meta property="og:url" content="https://pinoytambayanhub.com/forums/new" />
        <meta property="og:type" content="website" />
      </Head>

      {/* top bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-lg md:text-xl font-semibold text-gray-100">Create a Thread</h1>
        <div className="flex items-center gap-2">
          <Link href="/forums" className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800/60">
            ← Back to threads
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px,minmax(0,1fr),320px] gap-4">
        {/* LEFT */}
        <div className="md:sticky md:top-24 h-fit">
          <Sidebar />
        </div>

        {/* CENTER: composer card */}
        <div className="space-y-4">
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
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Tags (comma-separated, up to 5)</label>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="opm, radio"
                      className="w-full rounded-xl bg-[#151924] border border-gray-800 px-4 py-3 text-gray-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={120}
                    placeholder="What do you want to talk about?"
                    className="w-full rounded-xl bg-[#151924] border border-gray-800 px-4 py-3 text-gray-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Content</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    maxLength={20000}
                    rows={8}
                    placeholder="Write details here…"
                    className="w-full rounded-xl bg-[#151924] border border-gray-800 px-4 py-3 text-gray-100 outline-none focus:border-blue-500 whitespace-pre-wrap"
                  />
                </div>

                <div className="flex justify-end">
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
        </div>

        {/* RIGHT */}
        <div className="space-y-4 md:sticky md:top-24 h-fit">
          <WidgetCard title="Featured content">
            <ul className="space-y-2">
              {featured.map(t => (
                <li key={t.id}>
                  <Link href={`/forums/${t.id}`} className="text-sm text-gray-200 hover:text-white">
                    {t.title}
                  </Link>
                  <div className="text-xs text-gray-500">{(t.replyCount ?? 0)} replies</div>
                </li>
              ))}
              {featured.length === 0 && <div className="text-sm text-gray-400">No featured threads yet.</div>}
            </ul>
          </WidgetCard>

          <WidgetCard title="New Topics">
            <ul className="space-y-2">
              {recent.map(t => (
                <li key={t.id} className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs">🟦</span>
                  <div>
                    <Link href={`/forums/${t.id}`} className="text-sm text-gray-200 hover:text-white">
                      {t.title}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {(t.tags || []).slice(0, 2).map(x => `#${x}`).join(" ")}
                    </div>
                  </div>
                </li>
              ))}
              {recent.length === 0 && <div className="text-sm text-gray-400">No topics yet.</div>}
            </ul>
          </WidgetCard>
        </div>
      </div>
    </main>
  );
}
