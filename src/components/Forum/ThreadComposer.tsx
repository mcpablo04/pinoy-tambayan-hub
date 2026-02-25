"use client";

import { useState, useMemo } from "react";
import { Type, AlignLeft, Hash, Send } from "lucide-react";

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

  // Helper to show the user what their tags look like before posting
  const previewTags = useMemo(() => {
    return tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);
  }, [tags]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || busy) return;
    onSubmit({ title: title.trim(), body: body.trim(), tags: previewTags });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* TITLE INPUT */}
      <div className="group">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-blue-500 transition-colors">
          <Type size={14} /> Topic Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          placeholder="What's on your mind?"
          className="w-full rounded-2xl bg-[#121722] border border-gray-800 px-5 py-4 text-gray-100 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-gray-600"
        />
        <div className="flex justify-end mt-1.5">
          <span className={`text-[10px] font-bold ${title.length > 110 ? 'text-orange-500' : 'text-gray-700'}`}>
            {title.length} / 120
          </span>
        </div>
      </div>

      {/* BODY TEXTAREA */}
      <div className="group">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-blue-500 transition-colors">
          <AlignLeft size={14} /> Description
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={20000}
          rows={10}
          placeholder="Provide more context or details here..."
          className="w-full rounded-2xl bg-[#121722] border border-gray-800 px-5 py-4 text-gray-100 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-gray-600 leading-relaxed"
        />
        <div className="flex justify-between mt-2 px-1">
          <p className="text-[10px] text-gray-600 font-medium italic">
            Tip: Be descriptive to get better replies.
          </p>
          <span className="text-[10px] font-bold text-gray-700">
            {body.length.toLocaleString()} / 20,000
          </span>
        </div>
      </div>

      {/* TAGS SECTION */}
      <div className="bg-[#121722]/50 border border-gray-800/50 p-5 rounded-2xl">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
          <Hash size={14} /> Search Tags
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. tutorial, pinoy, technology"
          className="w-full rounded-xl bg-[#0b0f1a] border border-gray-800 px-4 py-3 text-sm text-gray-100 outline-none focus:border-blue-500/50 transition-all mb-3"
        />
        
        {/* Live Tag Preview */}
        <div className="flex flex-wrap gap-2 min-h-[24px]">
          {previewTags.length > 0 ? (
            previewTags.map((t, i) => (
              <span key={i} className="px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-tighter">
                #{t}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-gray-700 font-medium italic">No tags added yet (max 5)</span>
          )}
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={busy || !title.trim() || !body.trim()}
        className="w-full md:w-auto flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale px-10 py-4 font-black text-xs uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95"
      >
        {busy ? (
          <>
            <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Send size={14} /> Post Topic
          </>
        )}
      </button>
    </form>
  );
}