// src/pages/stories/new.tsx
"use client";

import Head from "next/head";
import { FormEvent, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/clientApp";
import { useAuth, type Profile } from "../../context/AuthContext";

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

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Always land at the top when this page mounts
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  // Simple local draft (autosave)
  const draftKey = user?.uid
    ? `pthub:draft:story:${user.uid}`
    : "pthub:draft:story:anon";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as { title?: string; tags?: string; body?: string };
      if (d.title) setTitle(d.title);
      if (d.tags) setTags(d.tags);
      if (d.body) setBody(d.body);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    try {
      const payload = JSON.stringify({ title, tags, body });
      localStorage.setItem(draftKey, payload);
    } catch {
      /* ignore */
    }
  }, [title, tags, body, draftKey]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  };

  // Live-parse tags
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user?.uid) {
      setError("Please log in to write a story.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError("Title and content are required.");
      return;
    }

    setSaving(true);
    try {
      const tagList = liveTagList;
      const p: Profile | null = profile ?? null;

      const base = {
        authorId: user.uid,
        authorName: p?.displayName ?? user.displayName ?? "Anonymous",
        authorHandle: p?.handle ?? null,
        title: title.trim(),
        slug: "",
        tags: tagList,
        coverUrl: null,
        content: { type: "single", body },
        counts: { reactions: 0, comments: 0, reads: 0 },
        status: "published",
        visibility: "public",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, "stories"), base);
      const finalSlug = `${slugify(title)}-${ref.id}`;
      await updateDoc(doc(db, "stories", ref.id), {
        slug: finalSlug,
        updatedAt: serverTimestamp(),
      });

      clearDraft();
      router.push(`/stories/${finalSlug}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to save story.");
    } finally {
      setSaving(false);
    }
  };

  const titleCount = `${title.length}/120`;
  const bodyCount = `${body.length}/50000`;

  return (
    <>
      {/* SEO (form page — keep out of index) */}
      <Head>
        <title>Write a Story | Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Write and publish your Pinoy story — add a title, tags, and content, then share it with the community."
        />
        <link rel="canonical" href="https://pinoytambayanhub.com/stories/new" />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Write a Story" />
        <meta
          property="og:description"
          content="Publish your Pinoy story with tags so readers can discover it."
        />
        <meta property="og:image" content="/brand/og-cover.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <section className="section">
        <div className="container-page max-w-3xl">
          <h1 className="page-title">Write a Story</h1>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-3 py-2"
            >
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="grid gap-4">
            {/* Title */}
            <div>
              <label htmlFor="story-title" className="block text-sm text-gray-300 mb-1">
                Title
              </label>
              <div className="relative">
                <input
                  id="story-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input !bg-white/5 !border !border-white/10"
                  placeholder="e.g., Sa Kanto ng 7/11"
                  maxLength={120}
                  required
                  aria-required="true"
                  autoComplete="off"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {titleCount}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="story-tags" className="block text-sm text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                id="story-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="input !bg-white/5 !border !border-white/10"
                placeholder="romance, comedy, one-shot"
                autoComplete="off"
              />
              {liveTagList.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {liveTagList.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-200"
                      title={`#${t}`}
                    >
                      #{t}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400">
                    {liveTagList.length}/10
                  </span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Up to 10 tags. Only letters, numbers, underscores, and hyphens are saved.
              </p>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="story-body" className="block text-sm text-gray-300 mb-1">
                Content
              </label>
              <div className="relative">
                <textarea
                  id="story-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[300px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start your story…"
                  maxLength={50000}
                  required
                  aria-required="true"
                />
                <div className="mt-1 text-xs text-gray-400 flex items-center justify-between">
                  <span>Tip: Paste from any editor. Chapters coming soon.</span>
                  <span>{bodyCount}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary disabled:opacity-60"
              >
                {saving ? "Publishing…" : "Publish"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/stories")}
                className="btn btn-ghost"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setTags("");
                  setBody("");
                  clearDraft();
                }}
                className="btn px-4 py-2 bg-gray-700 text-gray-100 hover:bg-gray-600"
                title="Remove locally saved draft"
              >
                Clear draft
              </button>

              <span className="text-gray-400 text-sm sm:ml-auto">
                Draft autosaves locally.
              </span>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
