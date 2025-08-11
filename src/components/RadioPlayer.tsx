// src/components/RadioPlayer.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export interface Station {
  id: string;
  name: string;
  url: string;
  logo: string;
}

export interface RadioPlayerProps {
  station: Station;
  hideTitle?: boolean;
}

export default function RadioPlayer({
  station,
  hideTitle = false,
}: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // whenever station changes, load & force-play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = station.url;
    audio.load();
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        // if auto-play is blocked, remain paused
        setPlaying(false);
      });
  }, [station]);

  // keep volume in sync without pausing
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          /* ignore */
        });
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* optional station title */}
      {!hideTitle && (
        <h2 className="text-white font-semibold">{station.name}</h2>
      )}

      {/* play/pause */}
      <button
        onClick={togglePlay}
        className="p-2 bg-blue-600 rounded-full transition"
      >
        {playing ? (
          <Pause className="w-5 h-5 text-white" />
        ) : (
          <Play className="w-5 h-5 text-white" />
        )}
      </button>

      {/* volume slider */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-white" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24"
        />
      </div>

      {/* hidden audio element */}
      <audio ref={audioRef} className="sr-only" preload="auto" />
    </div>
  );
}
