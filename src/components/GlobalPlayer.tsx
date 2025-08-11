// src/components/GlobalPlayer.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RadioPlayer from "./RadioPlayer";
import { usePlayer } from "../context/PlayerContext";

export default function GlobalPlayer() {
  const { station, next, prev, setStation } = usePlayer();
  const router = useRouter();

  // showUI is true only on /radio or if user manually toggles
  const [showUI, setShowUI] = useState(false);

  // on first mount, decide based on current path
  useEffect(() => {
    setShowUI(router.pathname === "/radio");
  }, [router.pathname]);

  // on every route change, show only if the target is /radio
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      setShowUI(url === "/radio");
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  // wrapper classes
  const wrapperClass = showUI
    ? "fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-90 p-4 rounded-xl shadow-xl flex items-center gap-4 max-w-xl w-full z-50"
    : "hidden";

  return (
    <>
      <div className={wrapperClass}>
        {/* ← Prev */}
        <button
          onClick={() => setStation(prev)}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Station info + controls */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-1">
            {station.name}
          </h2>
          {/* embed RadioPlayer but hide its own title */}
          <RadioPlayer station={station} hideTitle />
        </div>

        {/* Next → */}
        <button
          onClick={() => setStation(next)}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        {/* Hide link */}
        <button
          onClick={() => setShowUI(false)}
          className="ml-4 text-sm text-red-400 hover:underline"
        >
          Hide
        </button>
      </div>

      {/* Show button when hidden */}
      {!showUI && (
        <button
          onClick={() => setShowUI(true)}
          className="fixed bottom-4 right-4 bg-blue-600 p-3 rounded-full shadow-lg text-white z-50"
          title="Show Player"
        >
          🎵
        </button>
      )}
    </>
  );
}
