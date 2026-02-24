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
import { Play, Activity, ShoppingBag, MessageSquare, Newspaper, ArrowRight } from "lucide-react";

import ChatBox from "../components/ChatBox";
import { usePlayer, Station } from "../context/PlayerContext"; // Added Station type
import { STATIONS } from "../data/stations";
import MetaHead from "../components/MetaHead";
import { db } from "../lib/firebase";

/* ===================== helpers ===================== */
const byId = (id: string) => (STATIONS as Station[]).find((s) => s.id === id);

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

const peso = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
    : "—";

/* ===================== types ===================== */
type Product = {
  id: string; title: string; slug?: string | null; category?: string | null;
  pricePhp?: number | null; store?: string | null; imageUrl: string;
  affiliateUrl: string; blurb?: string | null; ownerName?: string | null;
  createdAt?: Timestamp | { seconds?: number } | null;
};

type Story = {
  id: string; title: string; slug?: string | null;
  createdAt?: Timestamp | { seconds?: number } | null;
};

const FEATURED_IDS = ["love-radio", "easy-rock", "barangay-ls", "energy-fm", "star-fm", "win-radio", "home-radio", "mor-entertainment"];

export default function Home() {
  // FIXED: Changed playStation to setStation to match the Context
  const { currentStation, setStation, isPlaying, setShowUI } = usePlayer();
  const [products, setProducts] = useState<Product[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  // Real-time Firestore Sync
  useEffect(() => {
    const pq = query(collection(db, "products"), orderBy("createdAt", "desc"), fsLimit(6));
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
    <div className="space-y-24 pb-12">
      <MetaHead
        title="Pinoy Tambayan Hub — OPM Radio, Weather & News"
        description="Listen to Pinoy radio online, check PH weather, browse events and stories."
      />

      {/* 🚀 PREMIUM HERO SECTION */}
      <section className="relative rounded-[3rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-900/40" />
        <div className="relative z-10 p-8 md:p-20 flex flex-col items-start max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full border border-blue-500/20 mb-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Live from the Philippines
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter italic uppercase mb-8">
            Ang Tunay na <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-indigo-400">
              Tambayan.
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-md mb-10 leading-relaxed">
            Stream your favorite OPM hits, stay updated with PH news, and hang out with the community.
          </p>

          <div className="flex flex-wrap gap-4">
            <button 
              // FIXED: Changed playStation to setStation
              onClick={() => setStation(STATIONS[0] as Station, true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3"
            >
              <Play size={16} fill="currentColor" /> Listen Live
            </button>
            <Link href="/marketplace" className="bg-white/5 backdrop-blur-md border border-white/10 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
              Browse Market
            </Link>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
      </section>

      {/* 📻 FEATURED RADIO GRID */}
      <section>
        <div className="flex items-end justify-between mb-10 px-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 bg-blue-600 rounded-full" />
              <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">Live Stations</span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Featured Radio</h2>
          </div>
          <Link href="/radio" className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors group">
            View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURED_IDS.map((id) => {
            const s = byId(id);
            if (!s) return null;
            const isActive = currentStation?.id === s.id && isPlaying;

            return (
              <button 
                key={s.id} 
                // FIXED: Changed playStation to setStation
                onClick={() => setStation(s as Station, true)}
                className={`group relative overflow-hidden rounded-[2rem] p-6 transition-all border ${
                  isActive 
                  ? "bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/10" 
                  : "bg-slate-900/40 border-white/5 hover:bg-slate-900/80 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 flex-shrink-0 bg-slate-800 rounded-2xl overflow-hidden p-2">
                    <Image 
                      src={s.logo || ''} 
                      alt={s.name} 
                      fill 
                      className={`object-contain transition-transform duration-500 group-hover:scale-110 ${isActive ? 'animate-pulse' : ''}`} 
                    />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-black text-white text-sm tracking-tight leading-tight truncate uppercase italic">
                      {s.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {isActive ? (
                        <span className="text-blue-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Activity size={10} /> Playing
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Station</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🛒 MARKETPLACE & CHAT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <section className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
              <ShoppingBag className="text-blue-500" /> Community Picks
            </h2>
            <Link href="/marketplace" className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">Shop All</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {products.map((p) => (
              <div key={p.id} className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-blue-500/30 transition-all shadow-xl">
                <Link href={`/marketplace/p/${p.id}-${p.slug || slugify(p.title)}`} className="block relative aspect-[16/10] overflow-hidden">
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute top-5 left-5 bg-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-xl">
                    {p.category || "Hot Pick"}
                  </div>
                </Link>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-white leading-tight line-clamp-1 group-hover:text-blue-400 transition-colors">{p.title}</h3>
                  <div className="flex items-center justify-between mt-6">
                    <div>
                      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Price</p>
                      <span className="text-2xl font-black text-white">{peso(p.pricePhp ?? undefined)}</span>
                    </div>
                    <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-blue-600 text-white p-4 rounded-2xl transition-all border border-white/10 group-hover:border-blue-500">
                      <ShoppingBag size={20} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CHAT SIDEBAR */}
        <section className="lg:col-span-4 space-y-8">
            <div className="sticky top-32">
              <div className="flex items-center gap-3 mb-8 px-2">
                <MessageSquare className="text-blue-500" />
                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">Chat</h2>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-2 shadow-2xl h-[600px] flex flex-col">
                <ChatBox />
              </div>
              <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4">Be kind to one another.</p>
            </div>
        </section>
      </div>

      {/* 📰 COMMUNITY STORIES */}
      <section className="bg-blue-600 rounded-[3rem] p-8 md:p-16 overflow-hidden relative group mb-12">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-md">
            <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none mb-4">Community <br />Stories</h2>
            <p className="text-blue-100 font-medium mb-8">Stay connected with the latest events and updates from our community.</p>
            <Link href="/stories" className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
              Read More <Newspaper size={16} />
            </Link>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stories.map((s) => (
              <Link key={s.id} href={`/stories/${s.slug || s.id}`} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl hover:bg-white/20 transition-all group/card">
                <h4 className="text-white font-bold text-lg leading-tight mb-2 group-hover/card:underline">{s.title}</h4>
                <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest italic">Story Update</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
      </section>
    </div>
  );
}