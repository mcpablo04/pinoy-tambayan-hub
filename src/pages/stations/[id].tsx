"use client";

import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";
import { usePlayer, Station } from "../../context/PlayerContext"; // Added Station type
import { STATIONS } from "../../data/stations";
import Layout from "../../components/Layout";
import MetaHead from "../../components/MetaHead";

/* ===================== Types ===================== */
type StationEx = {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  description?: string;
  genre?: string;
  city?: string;
  country?: string;
  website?: string;
};

export default function StationDetail({ station }: { station: StationEx }) {
  // FIXED: Changed playStation to setStation
  const { setStation, currentStation, isPlaying, setIsPlaying, setShowUI } = usePlayer();

  const isCurrent = currentStation?.id === station.id;

  const related = useMemo(() => {
    const key = (station.genre ?? "").toLowerCase();
    const pool = STATIONS.filter((s) => s.id !== station.id);
    const genreMatches = pool.filter(
      (s) => (s as any).genre?.toLowerCase() === key
    );
    return (genreMatches.length ? genreMatches : pool).slice(0, 6);
  }, [station]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RadioStation",
    name: station.name,
    areaServed: station.country || "Philippines",
    genre: station.genre,
    url: station.website || "https://pinoytambayanhub.com",
    logo: station.logo,
  };

  const handlePlayAction = () => {
    if (isCurrent) {
      setIsPlaying(!isPlaying);
    } else {
      // FIXED: Use setStation and cast station as Station type
      setStation(station as Station, true);
    }
    setShowUI(true);
  };

  return (
    <Layout title={`${station.name} - Live Radio`}>
      <MetaHead 
        title={`${station.name} — Listen Live | Pinoy Tambayan Hub`}
        description={station.description || `Stream ${station.name} live online. Your daily OPM and FM tambayan.`}
      />
      
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="max-w-6xl mx-auto">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">
          <Link href="/radio" className="hover:text-blue-500 transition-colors">Radio</Link>
          <span>/</span>
          <span className="text-slate-300">{station.name}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* LEFT: PLAYER CARD */}
          <div className="lg:col-span-7">
            <div className="relative group rounded-[3rem] overflow-hidden bg-white/5 border border-white/10 p-8 md:p-12 shadow-2xl backdrop-blur-sm">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full" />
              
              <div className="relative z-10 flex flex-col items-center md:items-start md:flex-row gap-8">
                <div className="w-40 h-40 md:w-52 md:h-52 shrink-0 bg-[#0f172a] rounded-[2.5rem] p-6 border border-white/5 shadow-inner flex items-center justify-center">
                  <img src={station.logo} alt={station.name} className="w-full h-full object-contain filter drop-shadow-2xl" />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    Live Broadcast
                  </span>
                  <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter mt-4 mb-2">
                    {station.name}
                  </h1>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                    {station.genre || "Variety"} • {station.city || "Philippines"}
                  </p>

                  <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
                    <button 
                      onClick={handlePlayAction}
                      className="bg-white text-blue-950 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl flex items-center gap-3"
                    >
                      {isCurrent && isPlaying ? (
                         <div className="flex gap-1 items-end h-3">
                           <div className="w-0.5 bg-blue-900 animate-[bounce_1s_infinite] h-full" />
                           <div className="w-0.5 bg-blue-900 animate-[bounce_1.2s_infinite] h-2" />
                           <div className="w-0.5 bg-blue-900 animate-[bounce_0.8s_infinite] h-3" />
                         </div>
                      ) : "▶"}
                      {isCurrent && isPlaying ? "Pause Stream" : "Listen Now"}
                    </button>
                    {station.website && (
                      <a href={station.website} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                        Official Site
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* DESCRIPTION BOX */}
              <div className="mt-12 pt-12 border-t border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-4">About the Station</h3>
                <p className="text-slate-400 leading-relaxed font-medium italic">
                  {station.description || "Pinoy Tambayan Hub brings you the best live streams from the Philippines and beyond."}
                </p>
              </div>
            </div>

            {/* DISCLAIMER */}
            <div className="mt-6 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
              Notice: We do not host these streams. All content is provided by official broadcasters.
            </div>
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Related Stations</h2>
            <div className="grid grid-cols-1 gap-4">
              {related.map((s) => (
                <Link 
                  key={s.id} 
                  href={`/stations/${s.id}`}
                  className="group flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-3xl hover:bg-white/10 hover:border-blue-500/30 transition-all"
                >
                  <div className="w-16 h-16 shrink-0 bg-[#0f172a] rounded-2xl p-3 border border-white/5 flex items-center justify-center">
                    <img src={s.logo} alt={s.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white uppercase tracking-tight truncate">{s.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{(s as any).genre || "Radio"}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] group-hover:bg-blue-600 transition-colors">
                    →
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