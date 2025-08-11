// src/context/PlayerContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";
import { Station } from "../components/RadioPlayer";
import { STATIONS } from "../data/stations";

interface PlayerContextValue {
  station: Station;
  setStation: (s: Station) => void;
  next: Station;
  prev: Station;
  showUI: boolean;
  setShowUI: (show: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [station, setStation] = useState<Station>(STATIONS[0]);
  const idx = STATIONS.findIndex((s) => s.id === station.id);
  const next = STATIONS[(idx + 1) % STATIONS.length];
  const prev = STATIONS[(idx - 1 + STATIONS.length) % STATIONS.length];

  // By default showUI = false on Home, true elsewhere
  const initialShow = pathname !== "/";
  const [showUI, setShowUI] = useState(initialShow);

  // If the user navigates back to Home, auto-hide
  useEffect(() => {
    if (pathname === "/") setShowUI(false);
  }, [pathname]);

  return (
    <PlayerContext.Provider
      value={{ station, setStation, next, prev, showUI, setShowUI }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}
