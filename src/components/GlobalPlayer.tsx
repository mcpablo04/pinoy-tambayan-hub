// src/components/GlobalPlayer.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RadioPlayer from "./RadioPlayer";
import { usePlayer } from "../context/PlayerContext";

/**
 * Auto-hide behavior:
 * - On /radio → controls visible.
 * - On any other page → controls auto-hidden, but the component stays mounted
 *   and audio keeps playing.
 * - A small 🎵 button lets users show the controls anywhere.
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

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Auto-hide on route changes:
  useEffect(() => {
    const setFromPath = (path: string) => setShowUI(path === "/radio");
    setFromPath(router.pathname);

    const handleRouteChange = (url: string) => setFromPath(url);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.pathname, router.events, setShowUI]);

  if (!mounted) return null;

  // Keep the whole player mounted; slide off-screen when hidden so audio keeps playing.
  const wrapperClass =
    "fixed z-50 max-w-xl mx-auto inset-x-4 rounded-xl shadow-xl flex items-center gap-4 bg-gray-900/90 p-4 transition-all duration-200 " +
    (showUI
      ? "bottom-4 opacity-100 pointer-events-auto"
      : "-bottom-96 opacity-0 pointer-events-none");

  return (
    <>
      {/* Always mounted (audio persists even when hidden) */}
      <div className={wrapperClass}>
        {/* Prev */}
        <button
          onClick={() => setStation(prev, true)}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition"
          aria-label="Previous station"
          title="Previous station"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Station info + controls (RadioPlayer contains the <audio/>) */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm sm:text-base font-semibold mb-1 truncate">
            {station.name}
          </div>
          <RadioPlayer station={station} hideTitle playOnLoadKey={playOnLoadKey} />
        </div>

        {/* Next */}
        <button
          onClick={() => setStation(next, true)}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition"
          aria-label="Next station"
          title="Next station"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        {/* Hide UI (audio keeps playing; just hides the controls) */}
        <button
          onClick={() => setShowUI(false)}
          className="ml-2 text-xs text-red-400 hover:underline"
          title="Hide player"
        >
          Hide
        </button>
      </div>

      {/* Tiny toggle button when hidden (optional; keeps your UX flexible) */}
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
