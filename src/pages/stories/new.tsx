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
import { useAuth, type Profile } from "../../context/AuthContext";
import { PenLine, Tag, Trash2, Send, XCircle, Info } from "lucide-react";

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const draftKey = user?.uid ? `pthub:draft:${user.uid}` : "pthub:draft:anon";

  // Load Draft
  useEffect(() => {
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
  }, [draftKey]);

  // Save Draft
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, tags, body }));
      } catch (e) {}
    }, 1000); // Debounced save
    return () => clearTimeout(timeout);
  }, [title, tags, body, draftKey]);

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

    // Validation to match your Rule 'short' function (size > 0 and < max)
    if (title.trim().length < 3) {
      setError("Title is too short.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Story body is too short.");
      return;
    }

    setSaving(true);

    try {
      // 1. Construct payload to match Firestore 'hasOnly' keys exactly
      const payload = {
        authorId: user.uid,
        authorName: profile?.displayName ?? user.displayName ?? "Anonymous",
        authorHandle: profile?.handle ?? null,
        title: title.trim(),
        slug: "draft-slug", // Placeholder: size > 0 to pass 'short' rule
        tags: liveTagList,
        coverUrl: null, // Explicitly required by your hasOnly rule
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

      // Step 1: Create the document
      const ref = await addDoc(collection(db, "stories"), payload);

      // Step 2: Update with the final unique slug
      const finalSlug = `${slugify(title)}-${ref.id}`;
      await updateDoc(doc(db, "stories", ref.id), {
        slug: finalSlug,
        updatedAt: serverTimestamp(),
      });

      // Cleanup
      localStorage.removeItem(draftKey);
      router.push(`/stories/${finalSlug}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      // Handles permission-denied or network errors
      setError(err?.message ?? "Failed to publish. Please check your connection.");
      setSaving(false);
    }
  };

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
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <XCircle size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Title Input */}
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

            {/* Tags Input */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-2">
                <Tag size={14} /> Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="romance, drama, one-shot..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <div className="mt-3 flex flex-wrap gap-2 min-h-[32px]">
                {liveTagList.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20"
                  >
                    #{t}
                  </span>
                ))}
                {liveTagList.length === 0 && (
                  <span className="text-xs text-gray-600 italic">
                    No tags added yet...
                  </span>
                )}
              </div>
            </div>

            {/* Body Editor */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                  The Story
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold bg-white/5 px-2 py-0.5 rounded">
                    {wordCount} words
                  </span>
                </div>
              </div>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Once upon a time in Manila..."
                className="w-full min-h-[450px] bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-6 text-lg leading-relaxed text-gray-200 placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                required
              />
              <div className="absolute bottom-4 right-6 text-[10px] text-gray-600 font-bold uppercase tracking-widest pointer-events-none">
                {body.length.toLocaleString()} / 50,000
              </div>
            </div>

            {/* Bottom Actions */}
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
                  <Trash2 size={18} />{" "}
                  <span className="md:hidden lg:inline">Clear</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-600/20"
                >
                  {saving ? (
                    "Publishing..."
                  ) : (
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