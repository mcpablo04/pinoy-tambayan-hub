"use client";

import { createContext, useContext, useMemo, useState, useEffect, ReactNode, useRef } from "react";
import { STATIONS } from "../data/stations";

export type Station = {
  id: string;
  name: string;
  streamUrl: string;
  logo: string;
};

type PlayerContextShape = {
  currentStation: Station;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  showUI: boolean;
  setShowUI: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  next: Station;
  prev: Station;
  setStation: (s: Station, playNow?: boolean) => void;
};

const PlayerContext = createContext<PlayerContextShape | null>(null);
const STORAGE_KEY = "pth_station_id";
const VOL_KEY = "pth_volume";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const stationsList = STATIONS as Station[];
  const [currentStation, setCurrentStation] = useState<Station>(stationsList[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    const savedStation = localStorage.getItem(STORAGE_KEY);
    if (savedStation) {
      const restored = stationsList.find((s) => s.id === savedStation);
      if (restored) setCurrentStation(restored);
    }
    const savedVol = localStorage.getItem(VOL_KEY);
    if (savedVol) {
      const v = parseFloat(savedVol);
      setVolume(v);
      audioRef.current.volume = v;
    }
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, [stationsList]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (audioRef.current.src !== currentStation.streamUrl) {
      audioRef.current.src = currentStation.streamUrl;
      audioRef.current.load(); 
    }
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
    localStorage.setItem(STORAGE_KEY, currentStation.id);
  }, [currentStation, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem(VOL_KEY, volume.toString());
    }
  }, [volume]);

  const value: PlayerContextShape = {
    currentStation,
    isPlaying,
    setIsPlaying,
    showUI,
    setShowUI,
    volume,
    setVolume,
    setStation: (s: Station, playNow?: boolean) => {
      setCurrentStation(s);
      setShowUI(true);
      if (playNow) setIsPlaying(true);
    },
    next: stationsList[(stationsList.findIndex(x => x.id === currentStation.id) + 1) % stationsList.length],
    prev: stationsList[(stationsList.findIndex(x => x.id === currentStation.id) - 1 + stationsList.length) % stationsList.length],
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};