"use client";

import { Pause, Play, Radio } from "lucide-react";

interface RadioButtonProps {
  isPlaying: boolean;
  togglePlay: () => void;
  loading?: boolean;
}

export default function RadioButton({ isPlaying, togglePlay, loading = false }: RadioButtonProps) {
  return (
    // Replaced outer container "div" to remove the box structure
    <div className="relative flex items-center justify-center p-0">
      
      {/* 
         1. Outer glow ring:
         Now floats freely against the background, completely circular.
      */}
      <div
        className={`
          absolute w-[140px] h-[140px] rounded-full bg-blue-500/25 blur-3xl
          transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-90"}
          pointer-events-none
        `}
      />

      {/* 
         2. Rotating dashed ring:
         Now always present in the DOM for smoother transitions,
         but its opacity is controlled. Easing is improved.
      */}
      <div
        className={`
          absolute w-[110px] h-[110px] rounded-full border border-dashed 
          border-blue-400/20 animate-spin [animation-duration:12s] 
          ease-[cubic-bezier(0.1,0.7,0.1,1)] pointer-events-none 
          transition-opacity duration-500
          ${isPlaying ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* 
         3. Main button:
         Maintained the radius and dark/blue themes, 
         but the shape is now fully self-contained.
      */}
      <button
        onClick={togglePlay}
        disabled={loading}
        aria-label={isPlaying ? "Pause radio" : "Play radio"}
        className={`
          relative w-20 h-20 rounded-[1.75rem] flex flex-col items-center justify-center
          overflow-hidden isolation-isolate
          shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]
          
          /* Refined interaction animation */
          transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
          hover:scale-[1.03] active:scale-95
          
          disabled:opacity-50 disabled:cursor-not-allowed
          
          ${isPlaying
            ? "bg-blue-600 hover:bg-blue-500"
            : "bg-slate-800 hover:bg-slate-700 border border-white/5"
          }
        `}
      >
        {/* Shimmer overlay when playing */}
        {isPlaying && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        )}

        {/* Icons and Text (unchanged structure, small tweaks) */}
        <div className="relative z-10 flex flex-col items-center gap-1.5 text-white">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={28} fill="currentColor" />
          ) : (
            <Play size={28} fill="currentColor" className="ml-1" />
          )}

          <div className="flex items-center gap-1.5 opacity-70">
            <Radio 
              size={12} 
              className={isPlaying ? "text-blue-200 animate-pulse" : "text-white/60"} 
            />
            <span className="text-[8px] font-black uppercase tracking-widest">
              {loading ? "..." : isPlaying ? "Live" : "Play"}
            </span>
          </div>
        </div>

        {/* Subtle inner border */}
        <div className="absolute inset-0 rounded-[1.75rem] border border-white/10 pointer-events-none" />
      </button>
    </div>
  );
}