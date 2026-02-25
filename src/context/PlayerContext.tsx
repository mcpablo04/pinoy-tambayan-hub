"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { STATIONS } from "../data/stations";

/* --------------------------- TYPES --------------------------- */
export type Station = {
  id: string;
  name: string;
  streamUrl: string;
  logo: string;
  tags?: string[]; // Added to fix the property error
};

type PlayerContextShape = {
  currentStation: Station;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  isBuffering: boolean;
  showUI: boolean;
  setShowUI: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
  setStation: (s: Station, playNow?: boolean) => void;
};

const PlayerContext = createContext<PlayerContextShape | null>(null);
const STORAGE_KEY = "pth_station_id";
const VOL_KEY = "pth_volume";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const stationsList = STATIONS as Station[];
  const [currentStation, setCurrentStation] = useState<Station>(stationsList[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initial Setup
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const savedStation = localStorage.getItem(STORAGE_KEY);
    if (savedStation) {
      const restored = stationsList.find((s) => s.id === savedStation);
      if (restored) setCurrentStation(restored);
    }

    const savedVol = localStorage.getItem(VOL_KEY);
    if (savedVol) {
      const v = parseFloat(savedVol);
      setVolume(v);
      audio.volume = v;
    }

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onError = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };

    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [stationsList]);

  // 2. Stream Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audio.src !== currentStation.streamUrl) {
        audio.src = currentStation.streamUrl;
        audio.load();
      }
      
      audio.play().catch(() => setIsPlaying(false));

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentStation.name,
          artist: "Pinoy Tambayan Radio",
          album: "Live Stream",
          artwork: [{ src: currentStation.logo, sizes: '512x512', type: 'image/png' }]
        });
      }
    } else {
      audio.pause();
      audio.src = ""; 
      audio.load();
    }
    
    localStorage.setItem(STORAGE_KEY, currentStation.id);
  }, [currentStation, isPlaying]);

  // 3. Volume Sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem(VOL_KEY, volume.toString());
    }
  }, [volume]);

  const currentIndex = stationsList.findIndex(x => x.id === currentStation.id);

  const setStation = (s: Station, playNow?: boolean) => {
    setCurrentStation(s);
    setShowUI(true);
    if (playNow) setIsPlaying(true);
  };

  const value: PlayerContextShape = {
    currentStation,
    isPlaying,
    setIsPlaying,
    isBuffering,
    showUI,
    setShowUI,
    volume,
    setVolume,
    setStation,
    next: () => setStation(stationsList[(currentIndex + 1) % stationsList.length], isPlaying),
    prev: () => setStation(stationsList[(currentIndex - 1 + stationsList.length) % stationsList.length], isPlaying),
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};