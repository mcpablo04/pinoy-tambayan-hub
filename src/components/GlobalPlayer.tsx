"use client";

import { useEffect } from "react";
import { useRouter } from "next/router"; // pages-router
import { ChevronLeft, ChevronRight } from "lucide-react";
import RadioPlayer from "./RadioPlayer";
import { usePlayer } from "../context/PlayerContext";

export default function GlobalPlayer() {
  const { station, next, prev, setStation, showUI, setShowUI } = usePlayer();
  const router = useRouter();

  // Show only on /radio by default
  useEffect(() => {
    setShowUI(router.pathname === "/radio");
  }, [router.pathname, setShowUI]);

  // Keep in sync on client-side route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => setShowUI(url === "/radio");
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events, setShowUI]);

  // Use side insets so it never overflows small screens
  const wrapperClass = showUI
    ? "fixed bottom-4 inset-x-4 z-50 bg-gray-900/90 p-4 rounded-xl shadow-xl flex items-center gap-4 max-w-xl mx-auto"
    : "hidden";

  return (
    <>
      <div className={wrapperClass}>
        {/* Prev */}
        <button
          onClick={() => setStation(prev)}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition"
          aria-label="Previous station"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Station info + controls */}
        <div className="flex-1 flex flex-col min-w-0">
          <h2 className="text-white text-sm sm:text-base font-semibold mb-1 truncate">
            {station.name}
          </h2>
          {/* Reuse RadioPlayer controls but hide its title */}
          <RadioPlayer station={station} hideTitle />
        </div>

        {/* Next */}
        <button
          onClick={() => setStation(next)}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition"
          aria-label="Next station"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        {/* Hide button (keeps audio playing; just hides UI) */}
        <button
          onClick={() => setShowUI(false)}
          className="ml-2 text-xs text-red-400 hover:underline"
        >
          Hide
        </button>
      </div>

      {/* Show button when hidden (UI toggle only) */}
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
