// src/components/GlobalPlayer.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RadioPlayer from "./RadioPlayer";
import { usePlayer } from "../context/PlayerContext";

/**
 * Floating compact player (lower-right).
 * - Always mounted so audio persists
 * - Auto-show on /radio, hide elsewhere (🎵 FAB can reopen)
 * - Passes playOnLoadKey so clicks trigger immediate play
 */
export default function GlobalPlayer() {
  const {
    station,
    next,
    prev,
    setStation,
    showUI,
    setShowUI,
    playOnLoadKey, // ← important for auto-play on click
  } = usePlayer();

  const router = useRouter();

  // Auto-show only on /radio
  useEffect(() => {
    setShowUI(router.pathname === "/radio");
  }, [router.pathname, setShowUI]);

  useEffect(() => {
    const handleRouteChange = (url: string) => setShowUI(url === "/radio");
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events, setShowUI]);

  const wrapperClass =
    "fixed bottom-4 right-4 z-50 max-w-sm w-[340px] rounded-2xl shadow-xl bg-gray-900/90 backdrop-blur border border-white/10 p-3 transition-all duration-200 " +
    (showUI
      ? "opacity-100 translate-y-0 pointer-events-auto"
      : "opacity-0 translate-y-6 pointer-events-none");

  return (
    <>
      {/* Player panel (kept mounted) */}
      <div className={wrapperClass}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-200 truncate">
            {station.name}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStation(prev, true)}
              className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-gray-100"
              aria-label="Previous"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setStation(next, true)}
              className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-gray-100"
              aria-label="Next"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setShowUI(false)}
              className="ml-1 text-xs text-red-300 hover:text-red-200"
              aria-label="Hide player"
              title="Hide player"
            >
              Hide
            </button>
          </div>
        </div>

        {/* Pass playOnLoadKey so RadioPlayer starts when user clicked Play on a card */}
        <RadioPlayer station={station} hideTitle playOnLoadKey={playOnLoadKey} />
      </div>

      {/* Floating button when hidden */}
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
