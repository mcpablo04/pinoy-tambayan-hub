"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Hammer, Mic2, Smartphone, ChevronRight, LayoutGrid } from "lucide-react";
import MetaHead from "../components/MetaHead";

const TOOLS = [
  {
    name: "Karaoke Roulette",
    href: "/tools/karaoke",
    desc: "Spin a random OPM hit to sing — perfect for tambayan nights.",
    icon: Mic2,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    name: "E-load Calculator",
    href: "/tools/eload",
    desc: "Compute prepaid load totals with fees/discounts.",
    icon: Smartphone,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
];

export default function ToolsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24">
      <MetaHead 
        title="Community Tools | Pinoy Tambayan Hub" 
        description="Fun and useful one-page utilities built for the Pinoy community."
      />

      {/* 🛠️ HEADER */}
      <div className="h-48 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent border-b border-white/5 relative flex items-end pb-8">
        <div className="max-w-6xl mx-auto w-full px-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <Hammer size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Utility Belt</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
              Community <span className="text-blue-500">Tools</span>
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
              <div className={`w-14 h-14 ${t.bg} ${t.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <t.icon size={28} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tight flex items-center gap-2">
                {t.name} <ChevronRight size={20} className="text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                {t.desc}
              </p>
            </Link>
          ))}
        </div>

        {/* ADSENSE / NOTES SECTION */}
        <div className="mt-16 bg-blue-600/5 border border-blue-500/10 rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-6 text-blue-400">
            <LayoutGrid size={20} />
            <h3 className="text-xs font-black uppercase tracking-widest">About our Tools</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[
               "Original, community-focused content",
               "Ad-safe & Family friendly",
               "No embedded copyrighted media",
               "Fast, lightweight utilities"
             ].map((note, i) => (
               <li key={i} className="flex items-center gap-3 text-xs text-slate-500 font-black uppercase">
                 <span className="w-1 h-1 rounded-full bg-blue-500" />
                 {note}
               </li>
             ))}
          </ul>
        </div>
      </main>
    </div>
  );
}