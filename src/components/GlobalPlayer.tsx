"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "../context/PlayerContext";
import { 
  Play, 
  Pause, 
  Volume2, 
  SkipForward, 
  SkipBack, 
  Maximize2, 
  Radio,
  Loader2 
} from "lucide-react";

export default function GlobalPlayerUI() {
  const { 
    currentStation, 
    isPlaying, 
    setIsPlaying, 
    isBuffering,
    volume, 
    setVolume, 
    next, 
    prev, 
    showUI 
  } = usePlayer();

  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200 && !isFloating) {
        setIsFloating(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFloating]);

  if (!showUI) return null;

  return (
    <div 
      className={`
        fixed transition-all duration-700 z-[1000] flex items-center
        ${isFloating 
          ? "bottom-8 right-8 w-20 h-20 justify-center hover:scale-110 active:scale-95 cursor-pointer" 
          : "bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl h-24 p-4 justify-between shadow-2xl"
        }
        /* THE FIX: We explicitly define the rounding for BOTH states in the clip-path */
        ${isFloating 
          ? "[clip-path:inset(0_round_2rem)]" 
          : "[clip-path:inset(0_round_2.5rem)]"
        }
        isolation-isolate
        transform-gpu
      `}
      onClick={() => isFloating && setIsFloating(false)}
    >
      {/* 0. THE BACKGROUND LAYER: Handles colors separately to prevent ghosting */}
      <div className={`
        absolute inset-0 -z-10 transition-all duration-700
        ${isFloating 
          ? "bg-blue-600 shadow-xl shadow-blue-600/40 border-4 border-white/20 rounded-[2rem]" 
          : "bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem]"
        }
      `} />

      {/* 1. Play/Pause Toggle */}
      <button 
        onClick={(e) => {
          if (isFloating) e.stopPropagation(); 
          setIsPlaying(!isPlaying);
        }}
        className={`relative flex items-center justify-center transition-all duration-500 shrink-0 overflow-hidden ${
          isFloating 
          ? "text-white w-full h-full" 
          : "w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] shadow-lg hover:bg-blue-500 active:scale-90"
        }`}
      >
        {isBuffering ? (
          <Loader2 size={isFloating ? 32 : 28} className="animate-spin text-white/80" />
        ) : (
          <div className="relative z-10">
            {isPlaying ? (
              <Pause size={isFloating ? 32 : 28} fill="currentColor" />
            ) : (
              <Play size={isFloating ? 32 : 28} fill="currentColor" className="ml-1" />
            )}
          </div>
        )}
        
        {isPlaying && !isBuffering && (
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
        )}
      </button>

      {/* 2. Expanded Content */}
      {!isFloating && (
        <div className="flex-1 ml-6 flex items-center justify-between gap-6 overflow-hidden animate-in fade-in duration-700">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex h-2 w-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                {isBuffering ? "Connecting..." : "Live Stream"}
              </h4>
            </div>
            <p className="text-xl font-black text-white italic uppercase tracking-tighter truncate">
              {currentStation?.name || "Select Station"}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <Volume2 size={16} className="text-slate-500" />
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-20 accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsFloating(true); }}
                className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
              >
                <Maximize2 size={18} className="rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating Extras */}
      {isFloating && (
        <>
          {isPlaying && (
            <div className="absolute -inset-[3px] rounded-[2.1rem] border-2 border-blue-400/50 animate-ping pointer-events-none" />
          )}
          <Radio size={12} className="absolute bottom-2 text-white/40" />
        </>
      )}
    </div>
  );
}