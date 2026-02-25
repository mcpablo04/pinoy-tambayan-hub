"use client";

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, MapPin, Ticket, RotateCcw, ChevronLeft, ChevronRight, Music, BellRing, ExternalLink } from "lucide-react";

/* ========= Types & Configs ========= */
type NewsItem = { title: string; link: string; pubDate: string; source?: string; };
type Ev = { id: string; name: string; url: string; date: string | null; venue?: string | null; city?: string | null; source?: string | null; };

const PER_PAGE = 12;
const PH_CITIES = ["All PH", "Manila", "Quezon City", "Cebu", "Davao", "Baguio", "Iloilo", "CDO"];
const PRESETS = [
  { label: "Gigs & Concerts", q: 'gig OR concert OR "live show" OR "mall show" Philippines OPM' },
  { label: "Tour Dates", q: 'concert announced OR "tour dates" Philippines OPM' },
  { label: "Ticketing", q: '"tickets" AND (concert OR gig) Philippines OPM' },
  { label: "Festivals", q: 'music festival Philippines OPM' },
];

/* ========= Helpers ========= */
function fmtDateShort(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const [page, setPage] = useState(0);

  const load = async (query: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      const mapped = (j.items || []).map((it: NewsItem, idx: number) => ({
        id: `${it.link}-${idx}`,
        name: it.title,
        url: it.link,
        date: it.pubDate || null,
        ...guessVenueAndCity(it.title),
        source: it.source || "PH News",
      }));
      setItems(mapped);
      setPage(0);
    } catch (e) {
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
        <title>OPM Concerts & Music Events | Pinoy Tambayan Hub</title>
        <meta name="description" content="Find the latest SB19, Ben&Ben, and OPM concerts. Real-time Philippine gig guide and ticketing announcements." />
      </Head>

      <div className="space-y-10 pb-12">
        {/* 🏆 MODERN HERO SECTION */}
        <div className="relative overflow-hidden rounded-[3.5rem] bg-[#0a0f1d] border border-white/5 p-10 md:p-16">
          <div className="absolute top-0 right-0 p-12 opacity-20 hidden md:block">
            <Music size={160} className="text-blue-500 rotate-12 animate-pulse" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Live Event Tracker</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.85] mb-6 font-display">
              PH Concerts <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">& Gigs Guide</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
              Never miss a beat. We aggregate live show announcements, mall tours, and music festivals from across the archipelago.
            </p>
          </div>
        </div>

        {/* 🔍 STICKY FILTER BAR */}
        <div className="sticky top-28 z-40">
          <div className="bg-[#020617]/80 backdrop-blur-2xl border border-white/10 p-5 rounded-[2.5rem] shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative w-full lg:flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] py-5 pl-14 pr-6 text-white placeholder:text-slate-600 focus:border-blue-500/50 outline-none transition-all font-bold text-sm"
                  placeholder='Search Artists ("SB19", "Bini") or Venues...'
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load(buildQuery(preset, city, input))}
                />
              </div>
              
              <div className="flex gap-3 w-full lg:w-auto">
                <button onClick={() => load(buildQuery(preset, city, input))} className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest transition-all shadow-xl shadow-blue-600/20">
                  Search
                </button>
                <button 
                  onClick={() => { setInput(""); setPreset(PRESETS[0].q); setCity("All PH"); load(buildQuery(PRESETS[0].q, "All PH", "")); }}
                  className="bg-white/5 border border-white/10 text-slate-400 px-5 rounded-[1.5rem] hover:text-white transition-all"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mr-2">Categories:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setPreset(p.q); load(buildQuery(p.q, city, input)); }}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${preset === p.q ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-slate-500 hover:text-white border border-white/5"}`}
                >
                  {p.label}
                </button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-2 hidden lg:block" />
              {PH_CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCity(c); load(buildQuery(preset, c, input)); }}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${city === c ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-500 hover:text-white border border-white/5"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🎫 RESULTS */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 rounded-[2.5rem] bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
            <BellRing size={48} className="mx-auto text-slate-700 mb-4" />
            <h3 className="text-xl font-black text-white uppercase italic">No Events Found</h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">Try changing your filters or searching for a different artist.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {slice.map((ev) => (
              <a
                key={ev.id}
                href={ev.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-[#0a0f1d] border border-white/5 p-8 hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />
                
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-blue-500/20 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" /> {ev.source}
                    </span>
                    <Ticket className="text-slate-800 group-hover:text-blue-500 transition-colors" size={24} strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-xl font-black text-white line-clamp-3 leading-[1.2] mb-6 font-display group-hover:text-blue-400 transition-colors italic uppercase tracking-tight">
                    {ev.name}
                  </h3>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <Calendar size={16} className="text-blue-500" /> {fmtDateShort(ev.date)}
                  </div>
                  {(ev.city || ev.venue) && (
                    <div className="flex items-center gap-3 text-slate-300 text-xs font-black uppercase tracking-widest">
                      <MapPin size={16} className="text-red-500" /> 
                      <span className="truncate">{ev.venue ? `${ev.venue}, ` : ""}{ev.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-blue-500 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                    View Details <ExternalLink size={12} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* 📟 PAGINATION (Custom rounded buttons) */}
        {!loading && items.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-white/5">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 bg-white/5 px-6 py-3 rounded-full">
              Page {page + 1} <span className="text-slate-800 mx-2">/</span> {pageCount}
            </span>
            <div className="flex gap-4">
              <button
                disabled={page === 0}
                onClick={() => { setPage((p) => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-blue-600 transition-all shadow-xl"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                disabled={page >= pageCount - 1}
                onClick={() => { setPage((p) => Math.min(pageCount - 1, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-blue-600 transition-all shadow-xl"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}