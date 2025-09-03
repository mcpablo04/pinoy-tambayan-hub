"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { Station } from "../components/RadioPlayer";
import { STATIONS } from "../data/stations";

type PlayerContextShape = {
  station: Station;
  setStation: (s: Station, playNow?: boolean) => void;

  // Floating player UI visibility
  showUI: boolean;
  setShowUI: (v: boolean) => void;

  // Signal for RadioPlayer to start playback immediately
  playOnLoadKey: number;
  _bumpPlayOnLoadKey: () => void;

  // Helpers (current neighbors)
  next: Station;
  prev: Station;
};

const PlayerContext = createContext<PlayerContextShape | null>(null);

// Keys for persistence
const STORAGE_KEY = "pth_station_id";

function findById(id?: string): Station {
  if (!id) return STATIONS[0];
  return STATIONS.find((s) => s.id === id) ?? STATIONS[0];
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  // Hydration-safe: start with default, then restore on mount
  const [station, setStationState] = useState<Station>(STATIONS[0]);
  const [showUI, setShowUI] = useState(false);

  // When true, GlobalPlayer/RadioPlayer will trigger immediate play on station change
  const [autoPlay, setAutoPlay] = useState(false);

  // Integer key the RadioPlayer can watch to call play()
  const [playOnLoadKey, setPlayOnLoadKey] = useState(0);
  const _bumpPlayOnLoadKey = () => setPlayOnLoadKey((k) => k + 1);

  const setStation = (s: Station, playNow = false) => {
    setStationState(s);
    if (playNow) {
      setAutoPlay(true); // next microtask will bump the key
      setShowUI(true);   // ensure the floating player is visible
    }
  };

  // Restore saved station after mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) || undefined;
      if (saved) {
        const restored = findById(saved);
        setStationState(restored);
      }
    } catch {}
  }, []);

  // Persist selected station id on change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, station.id);
    } catch {}
  }, [station.id]);

  // derive next/prev (loop over STATIONS)
  const { next, prev } = useMemo(() => {
    const idx = STATIONS.findIndex((x) => x.id === station.id);
    const next = STATIONS[(idx + 1) % STATIONS.length];
    const prev = STATIONS[(idx - 1 + STATIONS.length) % STATIONS.length];
    return { next, prev };
  }, [station]);

  const value: PlayerContextShape = {
    station,
    setStation,
    showUI,
    setShowUI,
    playOnLoadKey,
    _bumpPlayOnLoadKey,
    next,
    prev,
  };

  return (
    <PlayerContext.Provider value={value}>
      <AutoPlayBridge
        autoPlay={autoPlay}
        clearAutoPlay={() => setAutoPlay(false)}
        bump={_bumpPlayOnLoadKey}
      />
      {children}
    </PlayerContext.Provider>
  );
}

function AutoPlayBridge({
  autoPlay,
  clearAutoPlay,
  bump,
}: {
  autoPlay: boolean;
  clearAutoPlay: () => void;
  bump: () => void;
}) {
  if (autoPlay) {
    queueMicrotask(() => {
      bump();
      clearAutoPlay();
    });
  }
  return null;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
