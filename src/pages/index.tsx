"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  collection, 
  onSnapshot, 
  orderBy, 
  limit as fsLimit, 
  query, 
  type Timestamp 
} from "firebase/firestore";
import { 
  Play, 
  ShoppingBag, 
  MessageSquare, 
  Newspaper, 
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";

import ChatBox from "../components/ChatBox";
import { usePlayer } from "../context/PlayerContext";
import { STATIONS } from "../data/stations";
import MetaHead from "../components/MetaHead";
import { db } from "../lib/firebase";

/* ===================== helpers ===================== */
function slugify(input: string) {
  return (input || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const peso = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
    : "—";

/* ===================== types ===================== */
type Product = {
  id: string; title: string; slug?: string | null; category?: string | null;
  pricePhp?: number | null; imageUrl: string; affiliateUrl: string;
};

type Story = { id: string; title: string; slug?: string | null; };

const FEATURED_IDS = ["love-radio", "easy-rock", "barangay-ls", "energy-fm", "star-fm", "win-radio", "home-radio", "mor-entertainment"];

export default function Home() {
  const { currentStation, setStation, isPlaying } = usePlayer();
  const [products, setProducts] = useState<Product[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  const getStation = (id: string) => STATIONS.find((s) => s.id === id);
  const flagship = getStation("love-radio") || STATIONS[0];

  useEffect(() => {
    const pq = query(collection(db, "products"), orderBy("createdAt", "desc"), fsLimit(4));
    const unsubP = onSnapshot(pq, (snap) => {
      const arr: Product[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setProducts(arr);
    });

    const sq = query(collection(db, "stories"), orderBy("createdAt", "desc"), fsLimit(4));
    const unsubS = onSnapshot(sq, (snap) => {
      const arr: Story[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setStories(arr);
    });

    return () => { unsubP(); unsubS(); };
  }, []);

  return (
    <div className="space-y-20 pb-12">
      <MetaHead
        title="Pinoy Tambayan Hub • OPM Radio, News & Community"
        description="The ultimate digital tambayan. Listen to live Pinoy FM stations, browse community stories, and shop local picks."
      />

      {/* 🚀 HERO SECTION */}
      <section className="relative rounded-[3.5rem] overflow-hidden bg-[#0a0f1d] border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
        
        <div className="relative z-10 p-10 md:p-24 flex flex-col items-start max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
             <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
               <Zap size={12} fill="currentColor" /> Live & Global
             </span>
          </div>
          
          <h1 className="text-6xl md:text-[9rem] font-black text-white leading-[0.8] tracking-tighter italic uppercase mb-10 font-display">
            Ang Tunay na <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white">
              Tambayan.
            </span>
          </h1>
          
          <div className="flex flex-wrap gap-5">
            <button 
              onClick={() => setStation(flagship, true)}
              className="group bg-blue-600 hover:bg-blue-500 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl shadow-blue-600/40 active:scale-95 flex items-center gap-4"
            >
              <div className="p-2 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                <Play size={16} fill="currentColor" />
              </div>
              Play {flagship.name}
            </button>
            <Link href="/radio" className="bg-white/5 backdrop-blur-xl border border-white/10 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white/10 transition-all">
              Explore Stations
            </Link>
          </div>
        </div>
      </section>

      {/* 📻 RADIO GRID - Using your 8-card grid */}
      <section>
        <div className="flex items-end justify-between mb-12 px-4">
          <div className="space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white font-display">Featured Stations</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Selected FM streams for today</p>
          </div>
          <Link href="/radio" className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-blue-500 transition-colors">
            <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_IDS.map((id) => {
            const s = getStation(id);
            if (!s) return null;
            const isActive = currentStation?.id === s.id && isPlaying;

            return (
              <button 
                key={s.id} 
                onClick={() => setStation(s, true)}
                className={`group relative overflow-hidden rounded-[2.5rem] p-8 transition-all duration-500 border ${
                  isActive 
                  ? "bg-blue-600 border-blue-400 shadow-2xl shadow-blue-600/40 -translate-y-2" 
                  : "bg-slate-900/40 border-white/5 hover:border-white/20 hover:-translate-y-1"
                }`}
              >
                <div className="flex flex-col items-center text-center gap-5">
                  <div className={`relative w-20 h-20 rounded-3xl overflow-hidden p-3 transition-all duration-500 bg-white ${isActive ? 'rotate-6 scale-110' : 'group-hover:rotate-3'}`}>
                    <Image src={s.logo} alt={s.name} fill className="object-contain p-2" />
                  </div>
                  <div>
                    <p className={`font-black text-xs tracking-widest uppercase italic mb-1 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {s.name}
                    </p>
                    {isActive && (
                      <div className="flex justify-center gap-1 items-end h-4 mt-2">
                        {[0.8, 1.2, 1.0, 0.9].map((d, i) => (
                          <div key={i} className="w-1 bg-white rounded-full animate-bounce" style={{ animationDuration: `${d}s` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🛒 MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Marketplace Preview */}
        <section className="lg:col-span-7">
          <div className="flex items-center justify-between mb-10 px-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
              <ShoppingBag className="text-blue-500" size={32} /> The Tiangge
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {products.map((p) => (
              <div key={p.id} className="group bg-[#0a0f1d] border border-white/5 rounded-[3rem] overflow-hidden hover:border-blue-500/30 transition-all">
                <Link href={`/marketplace/p/${p.id}`} className="block relative aspect-square overflow-hidden bg-white/5">
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-transparent opacity-60" />
                </Link>
                <div className="p-8">
                  <span className="text-blue-500 text-[9px] font-black uppercase tracking-widest">{p.category}</span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-6 line-clamp-1">{p.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white">{peso(p.pricePhp ?? undefined)}</span>
                    <a href={p.affiliateUrl} target="_blank" className="p-4 bg-white/5 rounded-2xl text-white hover:bg-blue-600 transition-all">
                      <ShoppingBag size={18} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chat Sidebar */}
        <section className="lg:col-span-5">
          <div className="sticky top-32 space-y-8">
            <div className="flex items-center gap-4 px-4">
              <MessageSquare className="text-blue-500" size={32} />
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">Tambayan Chat</h2>
            </div>
            <div className="bg-[#0a0f1d] rounded-[3.5rem] border border-white/10 p-3 shadow-2xl h-[700px] relative overflow-hidden">
               <ChatBox />
            </div>
          </div>
        </section>
      </div>

      {/* 📰 COMMUNITY SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[4rem] p-10 md:p-20 shadow-2xl">
        <Sparkles className="absolute top-10 right-10 text-white/10 w-64 h-64 -rotate-12" />
        <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/3 text-center lg:text-left">
            <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-6">Kwentong <br />Hub</h2>
            <p className="text-blue-100 font-medium text-lg mb-10">Real stories from real Filipinos across the globe.</p>
            <Link href="/stories" className="inline-block bg-white text-blue-600 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-transform">
              Browse Stories
            </Link>
          </div>
          
          <div className="lg:w-2/3 grid sm:grid-cols-2 gap-6 w-full">
            {stories.map((s) => (
              <Link key={s.id} href={`/stories/${s.id}`} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[2.5rem] hover:bg-white/20 transition-all group">
                <h4 className="text-xl font-black text-white leading-tight mb-4 group-hover:underline">{s.title}</h4>
                <div className="flex items-center gap-2 text-blue-200 text-[10px] font-black uppercase tracking-widest">
                  <Newspaper size={14} /> New Post
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}