// src/pages/news.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
};

const PRESETS = [
  { label: "All OPM", q: 'OPM OR "Original Pilipino Music" OR "Philippine music"' },
  { label: "New Releases", q: 'OPM new single OR "new song" OR "album" site:bandwagon.asia OR site:philstar.com OR site:billboard.com' },
  { label: "Gigs", q: 'gig OR concert OR "live show" Philippines OPM' },
  { label: "Stations", q: 'radio Philippines OPM site:gmanetwork.com OR site:inquirer.net OR site:abs-cbn.com' },
];

const PER_PAGE = 12;

function fmtDate(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function News() {
  const [q, setQ] = useState(PRESETS[0].q);
  const [input, setInput] = useState(PRESETS[0].q);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // pagination state
  const [page, setPage] = useState(0);

  const load = async (query: string) => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load");
      setItems(j.items ?? []);
      setPage(0); // reset to first page on new search
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setItems([]);
      setPage(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(q); // initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const slice = useMemo(
    () => items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [items, page]
  );

  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  return (
    <section className="pt-20 max-w-6xl mx-auto p-6 text-lighttext">
      <h1 className="text-3xl font-bold mb-1">OPM & Community News</h1>
      <p className="text-gray-400 mb-5">Pulled from Google News (PH‑localized).</p>

      {/* Search & actions */}
      <div className="flex flex-col md:flex-row gap-3 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setQ(input), load(input))}
          placeholder='Search (e.g., "SB19 new song", "Ben&Ben gig")'
          className="flex-1 rounded-md bg-gray-800/80 text-gray-100 placeholder-gray-400 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => { setQ(input); load(input); }}
          className="px-4 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition"
        >
          Search
        </button>
      </div>

      {/* Preset chips */}
      <div className="-mx-2 px-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 mb-6">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setInput(p.q); setQ(p.q); load(p.q); }}
              className={`shrink-0 px-3 py-1.5 rounded-full border whitespace-nowrap ${
                q === p.q
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-800/70 border-gray-700 text-gray-200 hover:bg-gray-700"
              }`}
              title={p.q}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top pager */}
      {!loading && !err && items.length > 0 && (
        <div className="flex items-center justify-between mb-3 text-sm text-gray-400">
          <div>
            Showing{" "}
            <span className="text-gray-200">
              {page * PER_PAGE + 1}-{Math.min(items.length, (page + 1) * PER_PAGE)}
            </span>{" "}
            of <span className="text-gray-200">{items.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded bg-gray-800 text-gray-200 disabled:opacity-50 hover:bg-gray-700"
            >
              ← Prev
            </button>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="px-3 py-1.5 rounded bg-gray-800 text-gray-200 disabled:opacity-50 hover:bg-gray-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <div key={i} className="h-36 rounded-lg bg-gray-800/50 animate-pulse" />
          ))}
        </div>
      ) : err ? (
        <p className="text-amber-400">Error: {err}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">No news found for this query.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slice.map((it, idx) => (
              <a
                key={idx}
                href={it.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-gray-800/60 border border-white/5 p-4 hover:bg-gray-800 transition"
              >
                <div className="text-sm text-gray-400 mb-1">
                  {it.source || "Source"} • {fmtDate(it.pubDate)}
                </div>
                <div className="font-semibold text-gray-100 line-clamp-3">
                  {it.title}
                </div>
              </a>
            ))}
          </div>

          {/* Bottom pager */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-4 py-2 rounded bg-gray-800 text-gray-200 disabled:opacity-50 hover:bg-gray-700"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-400">
              Page {page + 1} of {pageCount}
            </span>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="px-4 py-2 rounded bg-gray-800 text-gray-200 disabled:opacity-50 hover:bg-gray-700"
            >
              Next →
            </button>
          </div>
        </>
      )}

      <div className="h-8" />
    </section>
  );
}
