// src/context/PlayerContext.tsx
"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Station } from "../components/RadioPlayer";
import { STATIONS } from "../data/stations";

type PlayerContextShape = {
  station: Station;
  setStation: (s: Station, playNow?: boolean) => void;

  // UI visibility for the floating player
  showUI: boolean;
  setShowUI: (v: boolean) => void;

  // signal for RadioPlayer to start playback immediately
  playOnLoadKey: number;
  _bumpPlayOnLoadKey: () => void;

  // optional helpers you might want later
  next: Station;
  prev: Station;
};

const PlayerContext = createContext<PlayerContextShape | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  // pick a sensible default station so UI can show something
  const [station, setStationState] = useState<Station>(STATIONS[0]);
  const [showUI, setShowUI] = useState(false);

  // when true, GlobalPlayer will trigger immediate play on station change
  const [autoPlay, setAutoPlay] = useState(false);

  // a simple integer signal that RadioPlayer watches to call play()
  const [playOnLoadKey, setPlayOnLoadKey] = useState(0);
  const _bumpPlayOnLoadKey = () => setPlayOnLoadKey((k) => k + 1);

  const setStation = (s: Station, playNow = false) => {
    setStationState(s);
    if (playNow) {
      setAutoPlay(true);
      setShowUI(true); // make sure the floating player is visible
    }
  };

  // derive next/prev (simple loop over STATIONS)
  const { next, prev } = useMemo(() => {
    const idx = STATIONS.findIndex((x) => x.id === station.id);
    const next = STATIONS[(idx + 1) % STATIONS.length];
    const prev = STATIONS[(idx - 1 + STATIONS.length) % STATIONS.length];
    return { next, prev };
  }, [station]);

  // Expose everything
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
      {/* Global autoplay bridge:
          When autoPlay=true and station changed, bump the key and clear flag */}
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
  // This small component runs in the tree; whenever autoPlay flips true,
  // we bump the key so RadioPlayer will call play(), then clear the flag.
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
