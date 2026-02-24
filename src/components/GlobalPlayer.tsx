"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "../context/PlayerContext";
import { Play, Pause, Volume2, SkipForward, SkipBack, Maximize2 } from "lucide-react";

export default function GlobalPlayerUI() {
  const { 
    currentStation, isPlaying, setIsPlaying, 
    volume, setVolume, next, prev, 
    setStation, showUI 
  } = usePlayer();

  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Docks to corner after 200px scroll. 
      // Does NOT reset when scrolling back up.
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
        fixed transition-all duration-700 z-[1000] gpu-smooth flex items-center
        ${isFloating 
          ? "bottom-6 right-6 w-16 h-16 rounded-full bg-blue-600 shadow-xl justify-center border-none cursor-pointer hover:scale-110 active:scale-95" 
          : "bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl rounded-[2.5rem] bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-4 shadow-2xl justify-between"
        }
      `}
      onClick={() => isFloating && setIsFloating(false)}
    >
      
      {/* 1. Play/Pause Toggle */}
      <button 
        onClick={(e) => {
          if (isFloating) e.stopPropagation(); 
          setIsPlaying(!isPlaying);
        }}
        className={`flex items-center justify-center transition-all duration-300 shrink-0 ${
          isFloating 
          ? "text-white" 
          : "w-14 h-14 bg-white text-black rounded-[1.2rem] shadow-lg hover:bg-blue-50"
        }`}
      >
        {isPlaying ? (
          <Pause size={isFloating ? 28 : 24} fill="currentColor" />
        ) : (
          <Play size={isFloating ? 28 : 24} fill="currentColor" className="ml-1" />
        )}
      </button>

      {/* 2. Expanded Content */}
      {!isFloating && (
        <div className="flex-1 ml-5 flex items-center justify-between gap-6 overflow-hidden">
          {/* Station Info */}
          <div className="min-w-0 flex-1">
            <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">Now Playing</h4>
            <p className="text-sm font-black text-white truncate italic uppercase tracking-tighter">
              {currentStation.name}
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Volume Control */}
            <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              <Volume2 size={16} className="text-slate-400" />
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-20 accent-blue-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Navigation & Minimize */}
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setStation(prev, true); }}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setStation(next, true); }}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>
              
              <div className="w-px h-6 bg-white/10 mx-1" />

              <button 
                onClick={(e) => { e.stopPropagation(); setIsFloating(true); }}
                className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all hover:bg-white/10"
                title="Minimize Player"
              >
                <Maximize2 size={16} className="rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Status Ring for Mini Mode */}
      {isFloating && isPlaying && (
        <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping pointer-events-none" />
      )}
    </div>
  );
}