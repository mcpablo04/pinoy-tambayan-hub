"use client";

import Head from "next/head";
import { FormEvent, useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { PenLine, Tag, Trash2, Send, XCircle, Info } from "lucide-react";

const MAX_BODY_LENGTH = 50000;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

export default function NewStory() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false); // To prevent hydration flicker

  useEffect(() => {
    setIsMounted(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const draftKey = user?.uid ? `pthub:draft:${user.uid}` : "pthub:draft:anon";

  // Load Draft
  useEffect(() => {
    if (!isMounted) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.title) setTitle(d.title);
        if (d.tags) setTags(d.tags);
        if (d.body) setBody(d.body);
      }
    } catch (e) {
      console.error("Draft load failed", e);
    }
  }, [draftKey, isMounted]);

  // Save Draft (Debounced)
  useEffect(() => {
    if (!isMounted) return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, tags, body }));
      } catch (e) {}
    }, 1000);
    return () => clearTimeout(timeout);
  }, [title, tags, body, draftKey, isMounted]);

  const liveTagList = useMemo(() => {
    return Array.from(
      new Set(
        tags
          .split(",")
          .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""))
          .filter(Boolean)
      )
    ).slice(0, 10);
  }, [tags]);

  const wordCount = useMemo(() => {
    return body.trim() ? body.trim().split(/\s+/).length : 0;
  }, [body]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user?.uid) {
      setError("You must be logged in to publish.");
      return;
    }

    if (title.trim().length < 3) {
      setError("Title is too short (min 3 chars).");
      return;
    }
    if (body.trim().length < 10) {
      setError("Story body is too short (min 10 chars).");
      return;
    }

    setSaving(true);

    try {
      // Logic for fallback author names
      const finalAuthorName = profile?.displayName || user.displayName || "Anonymous User";
      const finalAuthorHandle = profile?.handle || null;

      const payload = {
        authorId: user.uid,
        authorName: finalAuthorName,
        authorHandle: finalAuthorHandle,
        title: title.trim(),
        slug: `temp-${Date.now()}`, 
        tags: liveTagList,
        coverUrl: null, 
        content: {
          type: "single",
          body: body.trim(),
        },
        counts: {
          reactions: 0,
          comments: 0,
          reads: 0,
        },
        status: "published",
        visibility: "public",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, "stories"), payload);

      // Generate the permanent slug with the unique ID
      const finalSlug = `${slugify(title)}-${ref.id}`;
      await updateDoc(doc(db, "stories", ref.id), {
        slug: finalSlug,
        updatedAt: serverTimestamp(),
      });

      localStorage.removeItem(draftKey);
      router.push(`/stories/${finalSlug}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err?.message || "Failed to publish. Please check your connection.");
      setSaving(false);
    }
  };

  // Prevent rendering content that depends on localStorage until mounted
  if (!isMounted) return null;

  return (
    <>
      <Head>
        <title>Create New Story | Pinoy Tambayan Hub</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <section className="section pb-24">
        <div className="container-page max-w-4xl">
          <header className="mb-8">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <PenLine className="text-blue-500" /> New Story
            </h1>
            <p className="text-gray-400 mt-2">
              Share your thoughts, drama, or romance with the community.
            </p>
          </header>

          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl">
              <XCircle size={18} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="group">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 group-focus-within:text-blue-500 transition-colors mb-2 block">
                Story Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name your masterpiece..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-xl font-bold text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                maxLength={120}
                required
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                <Tag size={14} /> Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="romance, drama, horror..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <div className="mt-3 flex flex-wrap gap-2 min-h-[32px]">
                {liveTagList.length > 0 ? (
                  liveTagList.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-600 italic">No tags added yet...</span>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                  The Story
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold bg-white/5 px-2 py-0.5 rounded">
                    {wordCount.toLocaleString()} words
                  </span>
                </div>
              </div>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Once upon a time in Manila..."
                className="w-full min-h-[500px] bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-6 text-lg leading-relaxed text-gray-200 placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                required
              />
              <div className={`absolute bottom-4 right-6 text-[10px] font-bold uppercase tracking-widest pointer-events-none ${body.length > MAX_BODY_LENGTH ? "text-red-500" : "text-gray-600"}`}>
                {body.length.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 text-gray-500 text-xs italic">
                <Info size={14} />
                <span>Auto-saved to your browser.</span>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Clear your draft? This cannot be undone.")) {
                      setTitle("");
                      setTags("");
                      setBody("");
                      localStorage.removeItem(draftKey);
                    }
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/10 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                >
                  <Trash2 size={18} />
                  <span>Clear</span>
                </button>

                <button
                  type="submit"
                  disabled={saving || body.length > MAX_BODY_LENGTH}
                  className="flex-[2] md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-600/20"
                >
                  {saving ? "Publishing..." : (
                    <>
                      <Send size={18} /> Publish Story
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}