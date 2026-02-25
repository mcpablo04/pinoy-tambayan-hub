"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, Radio as RadioIcon, ChevronLeft, ChevronRight } from "lucide-react";
import StationList from "../components/StationList";
import { usePlayer, Station } from "../context/PlayerContext";
import { STATIONS } from "../data/stations";
import MetaHead from "../components/MetaHead";

const PER_PAGE = 8;

export default function RadioPage() {
  const [mounted, setMounted] = useState(false);
  const { currentStation, setStation } = usePlayer();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => { 
    setMounted(true); 
    // Fix for potential scroll-sync box glitch
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const allStations = STATIONS as Station[];
    if (!term) return allStations;

    return allStations.filter((s) => 
      s.name.toLowerCase().includes(term) || 
      (s.tags && s.tags.some(t => t.toLowerCase().includes(term)))
    );
  }, [q]);

  useEffect(() => setPage(0), [q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const slice = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 selection:bg-blue-500/30">
      <MetaHead title="Philippine Radio Stations | Pinoy Tambayan Hub" />

      {/* 🎭 HEADER SECTION */}
      <div className="h-48 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent border-b border-white/5 relative flex items-end pb-8 overflow-hidden">
        {/* Anti-glitch glow backdrop */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto w-full px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-blue-500 mb-2">
                <RadioIcon size={20} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Live Airwaves</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                Philippine <span className="text-blue-500">Radio</span>
              </h1>
            </div>

            {/* SEARCH BAR */}
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                className="w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all font-bold placeholder:text-slate-600 shadow-2xl"
                placeholder="Find a station..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 mt-12 relative">
        {/* THE STATION LIST CONTAINER - Added isolation and transform-gpu to stop the white box glitch */}
        <div className="bg-slate-900/30 border border-white/5 rounded-[3rem] p-6 md:p-10 shadow-inner isolation-isolate transform-gpu">
          {filtered.length > 0 ? (
            <StationList
              stations={slice}
              currentStationId={currentStation?.id}
              onSelect={(s: Station, playNow?: boolean) => setStation(s, playNow)}
            />
          ) : (
            <div className="py-24 text-center">
              <p className="text-slate-500 font-black uppercase tracking-widest italic">No stations found for "{q}"</p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-center gap-6 mt-12">
            <button 
              onClick={() => {
                setPage(p => Math.max(0, p-1));
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }} 
              disabled={page === 0} 
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-black uppercase text-[10px] tracking-widest disabled:opacity-20 hover:bg-blue-600 transition-all border border-white/5 active:scale-95"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-full">
               <span className="text-blue-500 font-black text-xs">{page + 1}</span>
               <span className="text-slate-700 font-black text-xs">/</span>
               <span className="text-slate-500 font-black text-xs">{pageCount}</span>
            </div>

            <button 
              onClick={() => {
                setPage(p => Math.min(pageCount-1, p+1));
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }} 
              disabled={page >= pageCount-1} 
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-black uppercase text-[10px] tracking-widest disabled:opacity-20 hover:bg-blue-600 transition-all border border-white/5 active:scale-95"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
      
      {/* Decorative background element to ground the layout */}
      <div className="fixed bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-600/[0.02] to-transparent pointer-events-none -z-10" />
    </div>
  );
}