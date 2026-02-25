"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Mic2, ChevronLeft, Youtube, RefreshCw, Music } from "lucide-react";
import MetaHead from "../../components/MetaHead";

type Song = { title: string; artist: string };

const OPM_SONGS: Song[] = [
  { title: "Tagpuan", artist: "Moira Dela Torre" },
  { title: "214", artist: "Rivermaya" },
  { title: "Tadhana", artist: "Up Dharma Down" },
  { title: "Ikaw", artist: "Yeng Constantino" },
  { title: "Rainbow", artist: "South Border" },
  { title: "Migraine", artist: "Moonstar88" },
  { title: "Hawak Kamay", artist: "Yeng Constantino" },
  { title: "Kathang Isip", artist: "Ben&Ben" },
  { title: "Akin Ka Na Lang", artist: "Morissette" },
  { title: "Buwan", artist: "JK Labajo" },
  { title: "Forevermore", artist: "Side A" },
  { title: "Pare Ko", artist: "Eraserheads" },
  { title: "With A Smile", artist: "Eraserheads" },
  { title: "Mundo", artist: "IV of Spades" },
  { title: "Hari ng Sablay", artist: "Sugarfree" },
];

export default function KaraokeRoulette() {
  const [current, setCurrent] = useState<Song | null>(null);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const spin = () => {
    setSpinning(true);
    setTimeout(() => {
      const pick = OPM_SONGS[Math.floor(Math.random() * OPM_SONGS.length)];
      setCurrent(pick);
      setSpinning(false);
    }, 600);
  };

  const youtubeUrl = useMemo(() => {
    if (!current) return "#";
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(current.title + " " + current.artist + " karaoke")}`;
  }, [current]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 pt-32 overflow-hidden">
      <MetaHead title="Karaoke Roulette | Pinoy Tambayan Hub" />

      <div className="max-w-2xl mx-auto px-6 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />

        <Link href="/tools" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-pink-500 transition-colors mb-8">
          <ChevronLeft size={14} /> Back to Tools
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center shadow-xl border border-pink-500/20">
            <Mic2 size={24} />
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
            Karaoke <span className="text-pink-500 text-xl block">Roulette</span>
          </h1>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 text-center shadow-2xl relative z-10">
          <button 
            onClick={spin}
            disabled={spinning}
            className="group relative w-24 h-24 bg-pink-600 hover:bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-10 transition-all shadow-[0_0_30px_rgba(219,39,119,0.3)] disabled:opacity-50 active:scale-90"
          >
            <RefreshCw size={32} className={`text-white transition-transform duration-700 ${spinning ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>

          <div className="min-h-[160px] flex flex-col justify-center">
            {current ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500">Ang kakantahin mo ay...</p>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tight leading-tight">{current.title}</h2>
                <p className="text-slate-400 font-bold text-lg uppercase">{current.artist}</p>
                
                <div className="pt-8">
                  <a 
                    href={youtubeUrl} 
                    target="_blank" 
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all group"
                  >
                    <Youtube size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
                    Search Karaoke on YT
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Music size={40} className="mx-auto text-slate-800" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Ready for the mic?</p>
                <p className="text-slate-600 text-sm italic">Press the button above to pick a random hit!</p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-12 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
           Open <Link href="/radio" className="text-blue-500 hover:underline">Radio</Link> in another tab for the perfect background vibes.
        </p>
      </div>
    </div>
  );
}