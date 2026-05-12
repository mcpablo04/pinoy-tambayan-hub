"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Wifi, WifiOff } from "lucide-react";
import Image from "next/image";

/* ============================================================
   TYPES
   ============================================================ */
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

/* ============================================================
   CONSTANTS
   ============================================================ */
const VOL_KEY        = "pth_volume";
const AUTOPLAY_KEY   = "pth_autoplay_on_load";
const SCROLL_THRESHOLD = 200;

/* ============================================================
   COMPONENT
   ============================================================ */
export default function RadioPlayer({ station, hideTitle = false }: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playing,    setPlaying]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [isFloating, setIsFloating] = useState(false);
  const [muted,      setMuted]      = useState(false);

  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 0.8;
    const saved = localStorage.getItem(VOL_KEY);
    return saved ? Math.min(1, Math.max(0, Number(saved))) : 0.8;
  });

  /* ----------------------------------------------------------
     SCROLL → floating mode
  ---------------------------------------------------------- */
  useEffect(() => {
    const onScroll = () => setIsFloating(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ----------------------------------------------------------
     SYNC VOLUME to audio element + localStorage
  ---------------------------------------------------------- */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = muted ? 0 : volume;
    localStorage.setItem(VOL_KEY, String(volume));
  }, [volume, muted]);

  /* ----------------------------------------------------------
     TOGGLE PLAY / PAUSE
  ---------------------------------------------------------- */
  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a || loading) return;

    if (playing) {
      a.pause();
      setPlaying(false);
      localStorage.setItem(AUTOPLAY_KEY, "0");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Reset src to force reload — fixes stale stream issue
      a.src = "";
      a.src = station.url;
      a.volume = muted ? 0 : volume;
      await a.play();
      setPlaying(true);
      localStorage.setItem(AUTOPLAY_KEY, "1");
    } catch {
      setError("Stream unavailable");
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }, [playing, loading, station.url, volume, muted]);

  /* ----------------------------------------------------------
     STATION CHANGE → reload and auto-play if was playing
  ---------------------------------------------------------- */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.pause();
    a.src = station.url;
    setPlaying(false);
    setError(null);

    if (localStorage.getItem(AUTOPLAY_KEY) === "1") {
      // Small delay so the src change settles
      setTimeout(() => togglePlay(), 100);
    }
  }, [station.id]);

  /* ----------------------------------------------------------
     AUDIO EVENT HANDLERS
  ---------------------------------------------------------- */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onError = () => {
      setError("Stream error");
      setPlaying(false);
      setLoading(false);
    };
    const onStalled = () => setLoading(true);
    const onPlaying = () => { setLoading(false); setError(null); };

    a.addEventListener("error",   onError);
    a.addEventListener("stalled", onStalled);
    a.addEventListener("playing", onPlaying);

    return () => {
      a.removeEventListener("error",   onError);
      a.removeEventListener("stalled", onStalled);
      a.removeEventListener("playing", onPlaying);
    };
  }, []);

  /* ----------------------------------------------------------
     RENDER — FLOATING (mini pill)
  ---------------------------------------------------------- */
  if (isFloating) {
    return (
      <div className="fixed bottom-6 right-6 z-[1000]">
        {/* Glow */}
        {playing && (
          <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse pointer-events-none" />
        )}
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className={`
            relative w-16 h-16 rounded-2xl flex items-center justify-center
            shadow-2xl shadow-black/50 transition-all duration-300
            active:scale-90 overflow-hidden isolation-isolate
            ${playing ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-800 hover:bg-slate-700 border border-white/10"}
          `}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : playing ? (
            <Pause size={24} fill="currentColor" className="text-white" />
          ) : (
            <Play size={24} fill="currentColor" className="text-white ml-0.5" />
          )}
          {playing && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          )}
        </button>
        {/* Ping ring when playing */}
        {playing && (
          <div className="absolute -inset-1 rounded-3xl border border-blue-400/40 animate-ping pointer-events-none" />
        )}
      </div>
    );
  }

  /* ----------------------------------------------------------
     RENDER — FULL BAR
  ---------------------------------------------------------- */
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[92%] max-w-lg">
      <div className="
        relative flex items-center gap-4 px-4 py-3
        bg-slate-900/80 backdrop-blur-2xl
        border border-white/10 rounded-[2rem]
        shadow-2xl shadow-black/60
        overflow-hidden isolation-isolate
      ">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent pointer-events-none" />

        {/* Play / Pause button */}
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className={`
            relative shrink-0 w-12 h-12 rounded-[1.25rem] flex items-center justify-center
            shadow-lg transition-all duration-300 active:scale-90 overflow-hidden
            ${playing
              ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
              : "bg-white/10 hover:bg-white/20"
            }
          `}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : playing ? (
            <Pause size={20} fill="currentColor" className="text-white" />
          ) : (
            <Play size={20} fill="currentColor" className="text-white ml-0.5" />
          )}
        </button>

        {/* Station info */}
        {!hideTitle && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {station.logo && (
              <div className="relative w-9 h-9 shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <Image
                  src={station.logo}
                  alt={station.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-xs font-black uppercase tracking-tight truncate">
                {station.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Live bars animation */}
                {playing && !error && (
                  <div className="flex gap-px items-end h-3">
                    {[0.1, 0.3, 0.2, 0.4, 0.15].map((delay, i) => (
                      <div
                        key={i}
                        className="w-px bg-blue-400 rounded-full animate-bounce"
                        style={{
                          height: `${[8, 12, 6, 10, 7][i]}px`,
                          animationDelay: `${delay}s`,
                          animationDuration: "0.8s",
                        }}
                      />
                    ))}
                  </div>
                )}
                <span className={`text-[9px] font-black uppercase tracking-widest ${
                  error ? "text-red-400" : playing ? "text-blue-400" : "text-slate-500"
                }`}>
                  {error ? "Offline" : playing ? "Live" : "Standby"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Volume controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMuted(m => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setMuted(false);
            }}
            aria-label="Volume"
            className="w-20 accent-blue-500 h-1 cursor-pointer"
          />
        </div>

        {/* Stream status icon */}
        <div className={`shrink-0 ${error ? "text-red-400" : playing ? "text-green-400" : "text-slate-600"}`}>
          {error ? <WifiOff size={14} /> : <Wifi size={14} />}
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" playsInline />
    </div>
  );
}