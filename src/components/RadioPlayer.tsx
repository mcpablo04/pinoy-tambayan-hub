"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, Radio, AlertCircle } from "lucide-react";

export interface Station {
  id: string;
  name: string;
  url: string;
  logo: string;
}

export interface RadioPlayerProps {
  station: Station;
  hideTitle?: boolean;
}

const VOL_KEY = "pth_volume";
const AUTOPLAY_KEY = "pth_autoplay_on_load";

export default function RadioPlayer({
  station,
  hideTitle = false,
}: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isFloating, setIsFloating] = useState(false);

  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 0.5;
    const saved = window.localStorage.getItem(VOL_KEY);
    return saved ? Math.min(1, Math.max(0, Number(saved))) : 0.5;
  });

  // Handle Scroll to toggle Floating State
  useEffect(() => {
    const handleScroll = () => setIsFloating(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    localStorage.setItem(VOL_KEY, String(volume));
  }, [volume]);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;

    if (playing) {
      a.pause();
      setPlaying(false);
      localStorage.setItem(AUTOPLAY_KEY, "0");
    } else {
      setLoading(true);
      setErr(null);
      try {
        const currentSrc = a.src;
        a.src = ""; 
        a.src = currentSrc || station.url;
        await a.play();
        setPlaying(true);
        localStorage.setItem(AUTOPLAY_KEY, "1");
      } catch (e) {
        setErr("Tap to play");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setPlaying(false);
    setErr(null);
    a.src = station.url;
    if (localStorage.getItem(AUTOPLAY_KEY) === "1") togglePlay();
  }, [station.id]);

  return (
    <div 
      className={`
        fixed transition-all duration-500 z-[1000] flex items-center shadow-2xl
        ${isFloating 
          ? "bottom-8 right-8 w-20 h-20 rounded-[2rem] bg-blue-600 justify-center cursor-pointer hover:scale-110 active:scale-95 border-4 border-white/20" 
          : "bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md rounded-[2.5rem] bg-[#020617]/90 backdrop-blur-2xl border border-white/10 p-3 justify-between"
        }
        /* 🚀 THE FIX: These lines kill the "white box" ghosting */
        overflow-hidden
        isolation-isolate
        [clip-path:inset(0_round_2rem)]
        transform-gpu
      `}
      onClick={() => isFloating && togglePlay()}
    >
      {/* 1. MAIN ACTION BUTTON */}
      <button 
        onClick={(e) => {
          if (isFloating) e.stopPropagation();
          togglePlay();
        }}
        className={`relative flex items-center justify-center transition-all duration-300 shrink-0 overflow-hidden text-white ${
          isFloating ? "w-full h-full" : "w-14 h-14 bg-blue-600 rounded-[1.25rem] hover:bg-blue-500 active:scale-90 shadow-lg shadow-blue-600/20"
        }`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : playing ? (
          <Pause size={isFloating ? 32 : 24} fill="currentColor" className="relative z-10" />
        ) : (
          <Play size={isFloating ? 32 : 24} fill="currentColor" className={`relative z-10 ${!isFloating && "ml-1"}`} />
        )}

        {/* Pulsing overlay inside the button */}
        {playing && <div className="absolute inset-0 bg-white/10 animate-pulse z-0 pointer-events-none" />}
      </button>

      {/* 2. FULL BAR CONTENT (Only visible when NOT floating) */}
      {!isFloating && (
        <div className="flex-1 ml-4 flex items-center justify-between gap-4 overflow-hidden animate-in fade-in duration-500">
          <div className="flex items-center gap-3 min-w-0">
            {station.logo && (
              <img src={station.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/5" />
            )}
            <div className="min-w-0">
              <h2 className="text-white text-sm font-black uppercase italic truncate tracking-tight leading-tight">
                {station.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {playing && (
                   <div className="flex gap-0.5 items-end h-2 w-3">
                    <div className="w-0.5 bg-blue-500 animate-[music-bar_1s_infinite_0.1s]" />
                    <div className="w-0.5 bg-blue-500 animate-[music-bar_1s_infinite_0.3s]" />
                    <div className="w-0.5 bg-blue-500 animate-[music-bar_1s_infinite_0.2s]" />
                  </div>
                )}
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                  {err ? "Stream Offline" : playing ? "Live Now" : "Station Standby"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-2xl border border-white/5">
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="range" min={0} max={1} step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 3. FLOATING EXTRAS */}
      {isFloating && (
        <>
          {/* Animated Ping Ring */}
          <div className="absolute -inset-[2px] rounded-[2rem] border-2 border-blue-400/50 animate-ping pointer-events-none" />
          
          {/* Bottom Radio Icon */}
          <Radio size={12} className="absolute bottom-2 text-white/50" />
        </>
      )}

      {/* HIDDEN AUDIO ELEMENT */}
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" playsInline />
    </div>
  );
}