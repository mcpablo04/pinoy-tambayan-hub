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
  /** bump this key (from context) to force auto-play (from a user click like next/prev) */
  playOnLoadKey?: number;
}

const VOL_KEY = "pth_volume";
const AUTOPLAY_KEY = "pth_autoplay_on_load";

export default function RadioPlayer({
  station,
  hideTitle = false,
  playOnLoadKey,
}: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Persisted volume
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 0.5;
    const saved = Number(window.localStorage.getItem(VOL_KEY));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
  });

  // Keep volume synced
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
    try {
      window.localStorage.setItem(VOL_KEY, String(volume));
    } catch {}
  }, [volume]);

  // Ensure only one audio plays on the page
  const stopOtherAudios = () => {
    if (typeof document === "undefined") return;
    const me = audioRef.current;
    document.querySelectorAll("audio").forEach((el) => {
      if (el !== me) {
        try {
          (el as HTMLAudioElement).pause();
        } catch {}
      }
    });
  };

  // Normal (non-muted) autoplay attempt
  const tryAutoplay = async () => {
    const a = audioRef.current;
    if (!a) return;

    setLoading(true);
    setErr(null);
    stopOtherAudios();

    try {
      await a.play(); // no muted trick
      setPlaying(true);
      setLoading(false);
    } catch {
      // Browser blocked autoplay — require explicit user gesture
      setPlaying(false);
      setLoading(false);
      setErr("Click play to start the stream.");
    }
  };

  // Load new station; only attempt autoplay if user had played before
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.src = station.url;
    a.load();

    const shouldAutoplay =
      typeof window !== "undefined" &&
      window.localStorage.getItem(AUTOPLAY_KEY) === "1";

    if (shouldAutoplay) {
      void tryAutoplay(); // may still be blocked, then we show the hint
    } else {
      setPlaying(false);
      setLoading(false);
      setErr(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station.id, station.url]);

  // Media event listeners to keep UI state accurate
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
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setLoading(false);
    };
    const onError = () => {
      setPlaying(false);
      setLoading(false);
      setErr("Stream error. Try again.");
    };

    a.addEventListener("waiting", onWaiting);
    a.addEventListener("playing", onPlaying);
    a.addEventListener("stalled", onStalled);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);

    return () => {
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("stalled", onStalled);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
    };
  }, []);

  // When playOnLoadKey changes (e.g., Next/Prev button was clicked),
  // attempt a normal play. If the browser blocks, show the hint.
  const lastKeyRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (playOnLoadKey === undefined) return;
    if (lastKeyRef.current === playOnLoadKey) return;
    lastKeyRef.current = playOnLoadKey;

    // Since the bump is caused by a user action (click), most browsers allow play()
    try {
      window.localStorage.setItem(AUTOPLAY_KEY, "1");
    } catch {}
    void tryAutoplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playOnLoadKey]);

  // Toggle play/pause (and remember preference only from a click)
  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;

    if (playing) {
      try {
        a.pause();
      } finally {
        setPlaying(false);
        try {
          window.localStorage.setItem(AUTOPLAY_KEY, "0");
        } catch {}
      }
    } else {
      try {
        await a.play(); // direct, user-gesture
        setPlaying(true);
        setErr(null);
        try {
          window.localStorage.setItem(AUTOPLAY_KEY, "1");
        } catch {}
      } catch {
        setErr("Click play to start the stream.");
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      {!hideTitle && (
        <h2 className="text-white font-semibold truncate max-w-[70vw]">
          <span suppressHydrationWarning>{station.name}</span>
        </h2>
      )}

      <div className="flex items-center gap-3">
        <button onClick={togglePlay} className="p-2 bg-blue-600 rounded-full transition">
          {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
        </button>

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

      {/* status line */}
      <div className="text-xs text-gray-400 min-h-[1rem]">
        {loading ? "Buffering…" : err ? err : playing ? "Live" : "Ready"}
      </div>

      <audio
        ref={audioRef}
        className="sr-only"
        preload="auto"
        crossOrigin="anonymous"
        playsInline
      />
    </div>
  );
}
