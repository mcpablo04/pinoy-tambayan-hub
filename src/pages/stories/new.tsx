// src/pages/stories/new.tsx
"use client";

import { FormEvent, useState } from "react";
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
      const tagList = Array.from(
        new Set(
          tags
            .split(",")
            .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""))
            .filter(Boolean)
        )
      ).slice(0, 10);

      const p: Profile | null = profile ?? null;

      const base = {
        authorId: user.uid,
        authorName: p?.displayName ?? user.displayName ?? "Anonymous",
        authorHandle: p?.handle ?? null, // ✅ no more redline
        title: title.trim(),
        slug: "", // set after we get the ID
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

      router.push(`/stories/${finalSlug}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to save story.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="pt-20 sm:pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-2xl font-semibold text-white mb-4">Write a Story</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
              placeholder="e.g., Sa Kanto ng 7/11"
              maxLength={120}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Tags (comma-separated)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
              placeholder="romance, comedy, one-shot"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Content</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-[300px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
              placeholder="Start your story…"
              maxLength={50000}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Tip: You can paste from any editor. Chapters coming soon.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-60"
            >
              {saving ? "Publishing…" : "Publish"}
            </button>
            <span className="text-gray-400 text-sm">Autosave coming soon.</span>
          </div>
        </form>
      </div>
    </main>
  );
}
