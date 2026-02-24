"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, Radio } from "lucide-react";

export interface Station {
  id: string;
  name: string;
  url: string;
  logo: string;
}

export interface RadioPlayerProps {
  station: Station;
  hideTitle?: boolean;
  playOnLoadKey?: number;
}

const VOL_KEY = "pth_volume";
const AUTOPLAY_KEY = "pth_autoplay_on_load";

export default function RadioPlayer({
  station,
  hideTitle = false,
  playOnLoadKey,
}: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- UI State ---
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isFloating, setIsFloating] = useState(false);

  // --- Persisted volume ---
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 0.5;
    const saved = Number(window.localStorage.getItem(VOL_KEY));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  });

  // --- Scroll Logic: Handle Floating State ---
  useEffect(() => {
    const handleScroll = () => {
      // If user scrolls down more than 200px, shrink to corner
      setIsFloating(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Audio Engine Logic (Keeping your original logic) ---
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
    try {
      window.localStorage.setItem(VOL_KEY, String(volume));
    } catch {}
  }, [volume]);

  const stopOtherAudios = () => {
    if (typeof document === "undefined") return;
    const me = audioRef.current;
    document.querySelectorAll("audio").forEach((el) => {
      if (el !== me) (el as HTMLAudioElement).pause();
    });
  };

  const tryAutoplay = async () => {
    const a = audioRef.current;
    if (!a) return;
    setLoading(true);
    setErr(null);
    stopOtherAudios();
    try {
      await a.play();
      setPlaying(true);
      setLoading(false);
    } catch {
      setPlaying(false);
      setLoading(false);
      setErr("Click play to start.");
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = station.url;
    a.load();
    const shouldAutoplay = typeof window !== "undefined" && window.localStorage.getItem(AUTOPLAY_KEY) === "1";
    if (shouldAutoplay) void tryAutoplay();
  }, [station.id, station.url]);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
      window.localStorage.setItem(AUTOPLAY_KEY, "0");
    } else {
      try {
        await a.play();
        setPlaying(true);
        setErr(null);
        window.localStorage.setItem(AUTOPLAY_KEY, "1");
      } catch {
        setErr("Click play to start.");
      }
    }
  };

  return (
    <div 
      className={`
        fixed transition-all duration-500 z-[999] gpu-smooth flex items-center
        ${isFloating 
          ? "bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl bg-blue-600 border-none justify-center" 
          : "bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-md rounded-[2rem] bg-slate-900/80 backdrop-blur-xl border border-white/10 p-4 justify-between"
        }
      `}
    >
      {/* 1. Play Button */}
      <button 
        onClick={togglePlay} 
        className={`flex items-center justify-center shrink-0 transition-all ${
          isFloating ? "text-white" : "w-12 h-12 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20"
        }`}
      >
        {playing ? <Pause className={isFloating ? "w-7 h-7" : "w-5 h-5"} fill="currentColor" /> : <Play className={isFloating ? "w-7 h-7" : "w-5 h-5"} fill="currentColor" />}
      </button>

      {/* 2. Expanded Content (Hidden when Floating) */}
      {!isFloating && (
        <div className="flex-1 ml-4 flex items-center justify-between gap-4 overflow-hidden">
          <div className="min-w-0">
            {!hideTitle && (
              <h2 className="text-white text-xs font-black uppercase italic truncate tracking-tighter">
                {station.name}
              </h2>
            )}
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${playing ? "bg-green-500 animate-pulse" : "bg-slate-600"}`} />
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                {loading ? "Buffering..." : err ? "Error" : playing ? "Live" : "Ready"}
              </p>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-3 h-3 text-slate-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 md:w-20 accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              aria-label="Volume"
            />
          </div>
        </div>
      )}

      {/* 3. Audio Element */}
      <audio
        ref={audioRef}
        className="sr-only"
        preload="auto"
        crossOrigin="anonymous"
        playsInline
      />
      
      {/* Active Indicator for Floating Mode */}
      {isFloating && playing && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </div>
      )}
    </div>
  );
}