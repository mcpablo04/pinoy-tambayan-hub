"use client";

import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlayer, Station } from "../../context/PlayerContext";
import { STATIONS } from "../../data/stations";
import Layout from "../../components/Layout";
import MetaHead from "../../components/MetaHead";
import { Share2, Check, Radio, Globe, MapPin, Play, Pause, ExternalLink } from "lucide-react";

type StationEx = Station & {
  description?: string;
  genre?: string;
  city?: string;
  country?: string;
  website?: string;
};

export default function StationDetail({ station }: { station: StationEx }) {
  const { setStation, currentStation, isPlaying, setIsPlaying, setShowUI } = usePlayer();
  const [copied, setCopied] = useState(false);

  const isCurrent = currentStation?.id === station.id;

  const related = useMemo(() => {
    const key = (station.genre ?? "").toLowerCase();
    const pool = STATIONS.filter((s) => s.id !== station.id);
    const genreMatches = pool.filter(
      (s) => (s as any).genre?.toLowerCase() === key
    );
    return (genreMatches.length ? genreMatches : pool).slice(0, 5);
  }, [station]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${station.name} | Pinoy Hub`,
          text: `Listening to ${station.name} live!`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) { console.error(err); }
  };

  const handlePlayAction = () => {
    if (isCurrent) {
      setIsPlaying(!isPlaying);
    } else {
      setStation(station as Station, true);
    }
    setShowUI(true);
  };

  return (
    <Layout>
      <MetaHead 
        title={`${station.name} Live — Pinoy Radio Hub`}
        description={station.description || `Stream ${station.name} live. Your 24/7 Filipino radio tambayan.`}
      />
      
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RadioStation",
          "name": station.name,
          "url": `https://pinoytambayanhub.com/stations/${station.id}`,
          "image": station.logo,
          "address": { "@type": "PostalAddress", "addressLocality": station.city || "Manila", "addressCountry": "PH" }
        })}} />
      </Head>

      <div className="max-w-6xl mx-auto px-4">
        {/* TOP NAV */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/radio" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">Radio Hub</Link>
          <div className="w-1 h-1 rounded-full bg-slate-800" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">{station.name}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* MAIN PLAYER AREA */}
          <div className="lg:col-span-8">
            <div className="relative rounded-[4rem] bg-gradient-to-br from-slate-900 to-black border border-white/5 p-8 md:p-16 shadow-2xl overflow-hidden group">
              {/* Animated Glow Background */}
              <div className={`absolute -top-24 -right-24 w-96 h-96 transition-all duration-1000 blur-[120px] rounded-full ${isCurrent && isPlaying ? 'bg-blue-600/30 animate-pulse' : 'bg-blue-600/10'}`} />

              <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center text-center md:text-left">
                {/* Station Logo */}
                <div className="relative shrink-0">
                  <div className={`absolute inset-0 blur-2xl rounded-full transition-opacity duration-500 ${isCurrent && isPlaying ? 'bg-blue-500/40 opacity-100' : 'opacity-0'}`} />
                  <div className="w-48 h-48 md:w-64 md:h-64 bg-slate-950 rounded-[3.5rem] p-10 border border-white/10 shadow-2xl relative flex items-center justify-center">
                    <img src={station.logo} alt={station.name} className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                    <span className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <Radio size={12} className={isCurrent && isPlaying ? "animate-pulse" : ""} /> Live Now
                    </span>
                    {station.genre && (
                      <span className="bg-white/5 text-slate-400 border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {station.genre}
                      </span>
                    )}
                  </div>

                  <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-[0.9] mb-6">
                    {station.name}
                  </h1>

                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">
                    <span className="flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> {station.city || "PH"}</span>
                    <span className="flex items-center gap-2"><Globe size={14} className="text-blue-500" /> Worldwide</span>
                  </div>

                  {/* Player Actions */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <button 
                      onClick={handlePlayAction}
                      className="group relative bg-white text-black px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center gap-4 overflow-hidden"
                    >
                      {isCurrent && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                      <span>{isCurrent && isPlaying ? "Pause Stream" : "Start Listening"}</span>
                    </button>

                    <button 
                      onClick={handleShare}
                      className="bg-slate-900 border border-white/10 text-white px-8 py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-all flex items-center gap-3"
                    >
                      {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                      {copied ? "Copied" : "Share"}
                    </button>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION SECTION */}
              <div className="mt-16 pt-12 border-t border-white/5">
                <p className="text-slate-400 text-lg font-medium leading-relaxed italic max-w-2xl">
                  "{station.description || `The ultimate online portal for ${station.name}. Stream your favorite local hits and global favorites anywhere in the world.`}"
                </p>
                {station.website && (
                  <a href={station.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-8 text-blue-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]">
                    Visit Official Site <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4 px-10 py-6 rounded-[2rem] bg-blue-600/5 border border-blue-600/10">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                Low Latency Stream optimized for 5G/LTE connections.
              </p>
            </div>
          </div>

          {/* SIDEBAR: RELATED */}
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-8">Related Tuner</h2>
            <div className="space-y-4">
              {related.map((s) => (
                <Link key={s.id} href={`/stations/${s.id}`} className="flex items-center gap-5 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/40 hover:bg-white/10 transition-all group">
                  <div className="w-16 h-16 bg-slate-950 rounded-2xl p-3 border border-white/5 overflow-hidden">
                    <img src={s.logo} alt={s.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{s.name}</h4>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">{(s as any).genre || "Mix Radio"}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                    <Play size={14} className="text-blue-500 fill-current" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticPaths() {
  return {
    paths: STATIONS.map((s) => ({ params: { id: s.id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  const station = STATIONS.find((s) => s.id === params.id) || null;
  if (!station) return { notFound: true };
  return { props: { station } };
}