"use client";

import { useState } from "react";

export default function ThreadComposer({
  onSubmit,
  busy,
}: {
  onSubmit: (data: { title: string; body: string; tags: string[] }) => void;
  busy?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTags = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);
    onSubmit({ title: title.trim(), body: body.trim(), tags: cleanTags });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
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
        <p className="mt-1 text-xs text-gray-500">Tip: links are allowed; HTML is not.</p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Tags (comma-separated, up to 5)</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="opm, radio, events"
          className="w-full rounded-xl bg-[#151924] border border-gray-800 px-4 py-3 text-gray-100 outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-5 py-3 font-medium"
      >
        {busy ? "Posting…" : "Post Thread"}
      </button>
    </form>
  );
}
