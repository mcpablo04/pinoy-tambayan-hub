"use client";

import Head from "next/head";
import { useEffect, useMemo, useState, useCallback } from "react";
import { 
  Search, 
  Newspaper, 
  Zap, 
  Radio, 
  Music, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";

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

  const load = useCallback(async (query: string) => {
    setLoading(true);
    setErr(null);
    try {
      // simulate a slight delay for better UX transition if API is too fast
      const r = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load");
      setItems(j.items ?? []);
      setPage(0);
    } catch (e: any) {
      setErr(e?.message || "Failed to sync with news servers.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    load(q);
  }, [load, q]);

  useEffect(() => {
    if (mounted) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, mounted]);

  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const slice = useMemo(() => items.slice(page * PER_PAGE, (page + 1) * PER_PAGE), [items, page]);

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <>
      <Head>
        <title>OPM Headlines | Live Music News Hub</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 pb-20 pt-10 space-y-12">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-[3rem] bg-[#0a0f1d] border border-white/5 p-10 md:p-16 shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
               </span>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Philippines Live Feed</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.9] mb-6">
              OPM <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">News</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm md:text-base font-medium leading-relaxed">
              The latest headlines, concert announcements, and chart-toppers from the heart of the Philippines.
            </p>
          </div>
        </section>

        {/* SEARCH & FILTERS */}
        <div className="space-y-6 bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(input)}
                placeholder="Search artists, gigs, or news site..."
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-bold"
              />
            </div>
            <button 
              onClick={() => load(input || q)} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Update Feed"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setQ(p.q); load(p.q); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                  q === p.q ? "bg-white text-black border-white" : "bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {p.icon} {p.label}
              </button>
            ))}
            <div className="h-4 w-[1px] bg-white/10 mx-2 hidden sm:block" />
            <button 
              onClick={() => { setInput(""); setQ(PRESETS[0].q); load(PRESETS[0].q); }}
              className="p-3 bg-white/5 text-slate-500 rounded-full border border-white/5 hover:text-white hover:bg-red-500/20 hover:border-red-500/20 transition-all"
              title="Reset Filters"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-[2.5rem] bg-white/[0.02] border border-white/5 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              </div>
            ))}
          </div>
        ) : err ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="text-red-500/50" size={48} />
            <div className="space-y-1">
              <p className="text-white font-black uppercase tracking-tighter text-xl">Connection Issue</p>
              <p className="text-slate-500 text-sm">{err}</p>
            </div>
            <button onClick={() => load(q)} className="text-blue-500 text-xs font-black uppercase tracking-widest hover:underline pt-4">Try Again</button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm italic">No headlines found for this search.</p>
            <button onClick={() => { setQ(PRESETS[0].q); load(PRESETS[0].q); }} className="text-blue-500 text-xs font-black underline">Show All OPM News</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {slice.map((it) => (
              <a
                key={it.link}
                href={it.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between p-8 rounded-[2.5rem] bg-[#0a0f1d] border border-white/5 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all duration-500 shadow-xl hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/10">
                      {it.source || "Headlines"}
                    </span>
                    <div className="p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={14} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-3 leading-tight mb-4">
                    {it.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {new Date(it.pubDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}
                  </span>
                  <span className="text-blue-500 text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    Read Story
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && items.length > PER_PAGE && (
          <div className="flex items-center justify-center gap-8 pt-12">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-90"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Page</span>
              <span className="text-lg font-black text-white">{page + 1} <span className="text-slate-700 mx-1">/</span> {pageCount}</span>
            </div>
            <button
              disabled={page >= pageCount - 1}
              onClick={() => setPage(p => p + 1)}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-90"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}