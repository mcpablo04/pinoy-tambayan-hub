"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { db } from "../../lib/firebase";
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
import { ArrowLeft, Send, Hash, Info } from "lucide-react";

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
const TAGS_MAX  = 5;
const DRAFT_KEY = "pth_forum_draft_new";

function sanitizeTags(input: string): string[] {
  const seen = new Set<string>();
  return input
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
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

  const [featured, setFeatured] = useState<Thread[]>([]);
  const [category, setCategory] = useState<string>("general");
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [tags, setTags]   = useState("");

  // 1. Fetch Featured for Right Rail
  useEffect(() => {
    (async () => {
      const q = query(collection(db, "threads"), orderBy("replyCount", "desc"), fsLimit(6));
      const snap = await getDocs(q);
      setFeatured(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any);
    })();
  }, []);

  // 2. Draft Persistence
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      setCategory(d.category || "general");
      setTitle(d.title || "");
      setBody(d.body || "");
      setTags(d.tags || "");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ category, title, body, tags }));
  }, [category, title, body, tags]);

  // 3. Post Thread Logic
  async function create(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user || busy) return;

    const t = title.trim();
    const b = body.trim();
    if (!t || !b) return toast.error("Title and content are required.");

    setBusy(true);
    try {
      const ref = await addDoc(collection(db, "threads"), {
        title: t,
        body: b,
        category,
        tags: sanitizeTags(tags),
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || "User",
        authorPhoto: profile?.photoURL || user.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        replyCount: 0,
        lastReplyAt: serverTimestamp(),
      });

      localStorage.removeItem(DRAFT_KEY);
      toast.success("Thread posted!");
      router.push(`/forums/${ref.id}`);
    } catch (err) {
      toast.error("Failed to post thread.");
      setBusy(false);
    }
  }

  // Keyboard Shortcut: Ctrl/Cmd + Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      create();
    }
  };

  const tagsPreview = sanitizeTags(tags);

  return (
    <ForumLayout
      rightRail={
        <WidgetCard title="Posting Rules">
          <ul className="text-xs text-gray-400 space-y-2">
            <li>• Be respectful to others.</li>
            <li>• No spam or self-promotion.</li>
            <li>• Use descriptive titles.</li>
            <li>• Choose the right category.</li>
          </ul>
        </WidgetCard>
      }
    >
      <Head>
        <title>Create Thread — Pinoy Tambayan Hub</title>
      </Head>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Topic</h1>
          <p className="text-sm text-gray-500">Share your thoughts with the community.</p>
        </div>
        <Link href="/forums" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Feed
        </Link>
      </div>

      <div className="bg-[#121722] border border-gray-800 rounded-2xl p-6">
        {!user ? (
          <div className="text-center py-12">
            <Info className="mx-auto text-blue-500 mb-4" size={48} />
            <p className="text-gray-400">Please <Link href="/login" className="text-blue-400 hover:underline">sign in</Link> to start a discussion.</p>
          </div>
        ) : (
          <form onSubmit={create} onKeyDown={handleKeyDown} className="space-y-6">
            
            {/* Category & Tags Row */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0f141f] border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Tags <span className="text-[10px] font-normal opacity-60">(comma separated)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. tutorial, pinoy, news"
                    className="w-full bg-[#0f141f] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-gray-100 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {tagsPreview.map(t => (
                    <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">#{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Thread Title</label>
                <span className={`text-[10px] ${title.length > TITLE_MAX * 0.9 ? 'text-red-400' : 'text-gray-600'}`}>
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={TITLE_MAX}
                placeholder="Give your topic a clear, catchy title..."
                className="w-full bg-[#0f141f] border border-gray-800 rounded-xl px-4 py-3 text-lg font-semibold text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Content</label>
                <span className="text-[10px] text-gray-600">{body.length}/{BODY_MAX}</span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={12}
                placeholder="What's on your mind? Be detailed..."
                className="w-full bg-[#0f141f] border border-gray-800 rounded-xl px-4 py-4 text-gray-200 focus:border-blue-500 outline-none transition-all resize-none leading-relaxed"
              />
              <p className="mt-3 text-[11px] text-gray-500 flex items-center gap-1">
                <Info size={12} /> Markdown links are supported. Avoid posting sensitive personal info.
              </p>
            </div>

            {/* Submit Section */}
            <div className="pt-4 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
               <p className="text-[11px] text-gray-500 italic">
                 Your post will be live immediately after clicking post.
               </p>
               <button
                 type="submit"
                 disabled={busy || !title.trim() || !body.trim()}
                 className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20"
               >
                 {busy ? "Publishing..." : <><Send size={18} /> Post Thread</>}
               </button>
            </div>
          </form>
        )}
      </div>
    </ForumLayout>
  );
}