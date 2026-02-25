"use client";

import { Pause, Play, Radio } from "lucide-react";

export default function RadioButton({ isPlaying, togglePlay }: { isPlaying: boolean, togglePlay: () => void }) {
  return (
    <div className="relative group p-4">
      <button
        onClick={togglePlay}
        className="
          relative w-24 h-24 
          flex flex-col items-center justify-center 
          transition-all duration-500 ease-in-out
          active:scale-90
          /* THE FIX: clip-path forces the browser to ignore the 'box' background */
          [clip-path:inset(0_round_2.5rem)]
          isolation-isolate
        "
      >
        {/* BACKGROUND LAYER: We apply the color here instead of the button itself */}
        <div className="absolute inset-0 bg-blue-600 group-hover:bg-blue-500 transition-colors duration-500" />
        
        {/* ICON LAYER */}
        <div className="relative z-10 flex flex-col items-center justify-center text-white">
          {isPlaying ? (
            <Pause size={32} fill="currentColor" className="transition-transform" />
          ) : (
            <Play size={32} fill="currentColor" className="ml-1 transition-transform" />
          )}
          
          <div className="mt-1 flex items-center gap-1 opacity-70">
            <Radio size={12} className={isPlaying ? "animate-pulse" : ""} />
            <span className="text-[8px] font-black uppercase tracking-tighter">Live</span>
          </div>
        </div>

        {/* EDGE SMOOTHING: A very subtle inner border to prevent aliasing (jagged edges) */}
        <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none" />
      </button>

      {/* OUTER GLOW: Separated to prevent the 'box' artifact */}
      <div className={`
        absolute inset-0 bg-blue-600/20 blur-2xl rounded-full transition-opacity duration-700
        ${isPlaying ? "opacity-100" : "opacity-0"}
      `} />
    </div>
  );
}