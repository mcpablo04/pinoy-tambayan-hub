"use client";

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { Search, Newspaper, Zap, Radio, Music, RotateCcw, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
};

const PRESETS = [
  { label: "All OPM", q: 'OPM OR "Original Pilipino Music" OR "Philippine music"', icon: <Newspaper size={14} /> },
  { label: "New Releases", q: 'OPM new single OR "new song" OR "album" site:bandwagon.asia OR site:philstar.com OR site:billboard.com', icon: <Zap size={14} /> },
  { label: "Gigs", q: 'gig OR concert OR "live show" Philippines OPM', icon: <Music size={14} /> },
  { label: "Stations", q: 'radio Philippines OPM site:gmanetwork.com OR site:inquirer.net OR site:abs-cbn.com', icon: <Radio size={14} /> },
];

const PER_PAGE = 12;

export default function News() {
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState(PRESETS[0].q);
  const [input, setInput] = useState("");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // 1. Fix Hydration: Only show client-side content after mount
  useEffect(() => {
    setMounted(true);
    load(q);
  }, []);

  // 2. Controlled Scrolling: Only scroll when page or query changes
  useEffect(() => {
    if (mounted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page, q, mounted]);

  const load = async (query: string) => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load");
      setItems(j.items ?? []);
      setPage(0);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  };

  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const slice = useMemo(() => items.slice(page * PER_PAGE, (page + 1) * PER_PAGE), [items, page]);

  // Prevent rendering until mounted to avoid mismatch
  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <>
      <Head>
        <title>OPM News | Pinoy Tambayan</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 pb-20 pt-10 space-y-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/5 p-8 md:p-12 shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Live Feed</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
              OPM <span className="text-blue-500">Headlines</span>
            </h1>
            <p className="text-slate-400 max-w-lg text-sm font-medium leading-relaxed">
              Real-time updates from across the Philippine music scene.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(input)}
                placeholder="Search for artists, songs, or news..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all font-bold text-sm"
              />
            </div>
            <button onClick={() => load(input || q)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95">
              Search
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setQ(p.q); load(p.q); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                  q === p.q ? "bg-white text-black border-white" : "bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {p.icon} {p.label}
              </button>
            ))}
            <button 
              onClick={() => { setInput(""); setQ(PRESETS[0].q); load(PRESETS[0].q); }}
              className="p-2.5 bg-white/5 text-slate-500 rounded-full border border-white/5 hover:text-white transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-[2rem] bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : err ? (
          <div className="p-10 text-center bg-red-500/5 border border-red-500/10 rounded-[2rem]">
            <p className="text-red-400 font-bold italic uppercase tracking-tighter">Error: {err}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {slice.map((it) => (
              <a
                key={it.link} // Use a unique link instead of index
                href={it.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between p-7 rounded-[2rem] bg-[#0f172a] border border-white/5 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">
                      {it.source || "News"}
                    </span>
                    <ExternalLink size={14} className="text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-3 leading-snug">
                    {it.title}
                  </h3>
                </div>
                <div className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                  {fmtDate(it.pubDate)}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-center gap-6 pt-10">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-blue-600 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              {page + 1} / {pageCount}
            </span>
            <button
              disabled={page >= pageCount - 1}
              onClick={() => setPage(p => p + 1)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-blue-600 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}