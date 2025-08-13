// src/components/RadioPlayer.tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, Loader2, RotateCcw } from "lucide-react";

export interface Station {
  id: string;
  name: string;
  url: string;
  logo: string;
}

export interface RadioPlayerProps {
  station: Station;
  hideTitle?: boolean;
  /** When this number changes, the player will attempt to start immediately */
  playOnLoadKey?: number;
}

export default function RadioPlayer({
  station,
  hideTitle = false,
  playOnLoadKey,
}: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Persisted volume (default 0.5)
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 0.5;
    const saved = window.localStorage.getItem("pth_volume");
    return saved ? Math.min(1, Math.max(0, Number(saved))) : 0.5;
  });

  // keep volume in sync & persist it
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pth_volume", String(volume));
    }
  }, [volume]);

  // Load new station source WITHOUT autoplay (policy/UX friendly)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setErr(null);
    setLoading(false);
    setPlaying(false);
    a.src = station.url;
    a.load();
  }, [station]);

  // Robust play with small retry/backoff
  const startPlayback = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;

    setErr(null);
    setLoading(true);

    const tryPlay = async (attempt: number): Promise<void> => {
      try {
        await a.play();
        setPlaying(true);
        setLoading(false);
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 500));
          await tryPlay(attempt + 1);
        } else {
          setLoading(false);
          setPlaying(false);
          setErr("Couldn’t start the stream. Tap retry or check your connection.");
        }
      }
    };

    await tryPlay(0);
  }, []);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;

    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      await startPlayback();
    }
  };

  // Reflect network events
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onWaiting = () => setLoading(true);
    const onPlaying = () => {
      setLoading(false);
      setErr(null);
      setPlaying(true);
    };
    const onStalled = () => setLoading(true);
    const onError = () => {
      setLoading(false);
      setPlaying(false);
      setErr("Stream error. Try again.");
    };
    const onEnded = () => {
      setPlaying(false);
    };

    a.addEventListener("waiting", onWaiting);
    a.addEventListener("playing", onPlaying);
    a.addEventListener("stalled", onStalled);
    a.addEventListener("error", onError);
    a.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("stalled", onStalled);
      a.removeEventListener("error", onError);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  // 🔑 NEW: whenever playOnLoadKey changes, start immediately (1-click play)
  useEffect(() => {
    if (playOnLoadKey === undefined) return;
    // if the key changed, we intend to start playback now
    startPlayback();
  }, [playOnLoadKey, startPlayback]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      {!hideTitle && (
        <h2 className="text-white font-semibold truncate max-w-[70vw]">
          {station.name}
        </h2>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="p-2 bg-blue-600 rounded-full transition disabled:opacity-60"
          disabled={loading}
          aria-label={playing ? "Pause" : "Play"}
          title={playing ? "Pause" : "Play"}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : playing ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
        </button>

        {err && (
          <button
            onClick={startPlayback}
            className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded bg-gray-700 text-gray-100 hover:bg-gray-600"
            title="Retry"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}

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
            aria-label="Volume"
          />
        </div>
      </div>

      <div className="text-xs text-gray-400 min-h-[1rem]">
        {loading ? "Buffering…" : err ? err : playing ? "Live" : "Ready"}
      </div>

      <audio
        ref={audioRef}
        className="sr-only"
        preload="none"
        crossOrigin="anonymous"
        playsInline
      />
    </div>
  );
}
