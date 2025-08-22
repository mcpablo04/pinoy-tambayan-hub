// src/components/GlobalPlayer.tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RadioPlayer from "./RadioPlayer";
import { usePlayer } from "../context/PlayerContext";

/**
 * Keep the player ALWAYS mounted so audio never restarts on navigation.
 * We only toggle visibility with CSS (no conditional render).
 */
export default function GlobalPlayer() {
  const {
    station,
    next,
    prev,
    setStation,
    showUI,
    setShowUI,
    playOnLoadKey,
  } = usePlayer();

  // Avoid SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Slide off-screen when hidden; keep mounted so the <audio> persists.
  const wrapperClass =
    "fixed z-50 right-4 bottom-4 max-w-xl w-[360px] rounded-2xl shadow-xl bg-gray-900/90 backdrop-blur border border-white/10 p-3 transition-all duration-200 " +
    (showUI
      ? "opacity-100 translate-y-0 pointer-events-auto"
      : "opacity-0 translate-y-6 pointer-events-none");

  return (
    <>
      {/* Controls + audio (ALWAYS mounted) */}
      <div className={wrapperClass}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-200 truncate">
            {station?.name || "Live Radio"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStation(prev, true)}
              className="rounded-md bg-white/10 hover:bg-white/20 p-1.5 text-gray-100"
              aria-label="Previous station"
              title="Previous station"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setStation(next, true)}
              className="rounded-md bg-white/10 hover:bg-white/20 p-1.5 text-gray-100"
              aria-label="Next station"
              title="Next station"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setShowUI(false)}
              className="ml-1 rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-xs text-gray-100"
              aria-label="Hide player"
              title="Hide player"
            >
              Hide
            </button>
          </div>
        </div>

        {/* IMPORTANT: Do not conditionally render RadioPlayer */}
        <RadioPlayer station={station} hideTitle playOnLoadKey={playOnLoadKey} />
      </div>

      {/* Small FAB to reveal when hidden (does NOT mount/unmount audio) */}
      {!showUI && (
        <button
          onClick={() => setShowUI(true)}
          className="fixed bottom-4 right-4 bg-blue-600 p-3 rounded-full shadow-lg text-white z-50"
          title="Show Player"
          aria-label="Show Player"
        >
          🎵
        </button>
      )}
    </>
  );
}
