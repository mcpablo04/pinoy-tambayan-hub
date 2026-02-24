"use client";

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, MapPin, Ticket, RotateCcw, ChevronLeft, ChevronRight, Music } from "lucide-react";

/* ========= Types ========= */
type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
};

type Ev = {
  id: string;
  name: string;
  url: string;
  date: string | null;
  venue?: string | null;
  city?: string | null;
  source?: string | null;
};

/* ========= Config & Helpers (Logic remains same as your original) ========= */
const PER_PAGE = 12;
const PH_CITIES = ["All PH", "Manila", "Quezon City", "Cebu", "Davao", "Baguio", "Iloilo", "CDO"];
const PRESETS = [
  { label: "All Gigs", q: 'gig OR concert OR "live show" OR "mall show" Philippines OPM' },
  { label: "Announcements", q: 'concert announced OR "tour dates" Philippines OPM' },
  { label: "Ticketing", q: '"tickets" AND (concert OR gig) Philippines OPM' },
  { label: "Festivals", q: 'music festival Philippines OPM' },
];

function fmtDateShort(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function guessVenueAndCity(title: string): { venue?: string; city?: string } {
  const cityHit = PH_CITIES.slice(1).find((c) => new RegExp(`\\b${c}\\b`, "i").test(title));
  let venue: string | undefined;
  const atMatch = title.match(/\b(?:at|@)\s+([^–—\-|,]+?)(?:[,–—\-|]|$)/i);
  if (atMatch?.[1]) venue = atMatch[1].trim();
  return { venue, city: cityHit };
}

function buildQuery(baseQ: string, city: string, userQ: string) {
  const parts = [`(${baseQ})`];
  if (userQ.trim()) parts.push(`(${userQ.trim()})`);
  parts.push(city !== "All PH" ? `("${city}" OR "${city}, Philippines")` : "(Philippines OR PH)");
  return parts.join(" AND ");
}

export default function EventsFromNews() {
  const [preset, setPreset] = useState(PRESETS[0].q);
  const [city, setCity] = useState("All PH");
  const [input, setInput] = useState("");
  const [items, setItems] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const load = async (query: string) => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load");
      const mapped = (j.items as NewsItem[]).map((it, idx) => ({
        id: `${it.link}-${idx}`,
        name: it.title,
        url: it.link,
        date: it.pubDate || null,
        ...guessVenueAndCity(it.title),
        source: it.source || null,
      }));
      setItems(mapped);
      setPage(0);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(buildQuery(preset, city, input)); }, []);

  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const slice = useMemo(() => items.slice(page * PER_PAGE, (page + 1) * PER_PAGE), [items, page]);

  return (
    <>
      <Head>
        <title>OPM Concerts & Events | Pinoy Tambayan Hub</title>
      </Head>

      <div className="space-y-8">
        {/* 🏆 HEADER SECTION */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/5 p-8 md:p-12">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Music size={120} className="text-blue-500 rotate-12" />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
              PH Concerts <span className="text-blue-500">& Gigs</span>
            </h1>
            <p className="text-slate-400 max-w-lg font-medium">
              Discover the latest OPM shows, mall tours, and music festivals. Live updates curated from PH-localized news.
            </p>
          </div>
        </div>

        {/* 🔍 FILTER SECTION */}
        <div className="sticky top-24 z-40 bg-[#020617]/80 backdrop-blur-xl border border-white/5 p-4 rounded-3xl shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500/50 outline-none transition-all font-bold text-sm"
                placeholder='Search "SB19", "Ben&Ben", "Moira"...'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(buildQuery(preset, city, input))}
              />
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => load(buildQuery(preset, city, input))} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-600/20">
                Find Events
              </button>
              <button 
                onClick={() => { setInput(""); setPreset(PRESETS[0].q); setCity("All PH"); load(buildQuery(PRESETS[0].q, "All PH", "")); }}
                className="bg-white/5 border border-white/10 text-slate-400 p-4 rounded-2xl hover:text-white transition-all"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setPreset(p.q); load(buildQuery(p.q, city, input)); }}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${preset === p.q ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-slate-500 hover:text-white border border-white/5"}`}
              >
                {p.label}
              </button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />
            {PH_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCity(c); load(buildQuery(preset, c, input)); }}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${city === c ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-500 hover:text-white border border-white/5"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 🎫 RESULTS GRID */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-[2rem] bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {slice.map((ev) => (
              <a
                key={ev.id}
                href={ev.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-[2rem] bg-slate-900 border border-white/5 p-6 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all flex flex-col justify-between h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-blue-600/10 text-blue-400 text-[9px] font-black px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest">
                    {ev.source || "GMA/ABS-CBN"}
                  </span>
                  <Ticket className="text-slate-700 group-hover:text-blue-500 transition-colors" size={20} />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-white line-clamp-3 leading-tight mb-4 group-hover:text-blue-400 transition-colors">
                    {ev.name}
                  </h3>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
                    <Calendar size={14} className="text-blue-500" /> {fmtDateShort(ev.date)}
                  </div>
                  {(ev.city || ev.venue) && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
                      <MapPin size={14} className="text-red-500" /> {ev.venue ? `${ev.venue}, ` : ""}{ev.city}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* 📟 PAGINATION */}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between pt-10 border-t border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Page {page + 1} of {pageCount}
            </span>
            <div className="flex gap-4">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-blue-600 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-blue-600 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}