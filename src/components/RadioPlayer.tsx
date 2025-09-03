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
  /** bump this key (from context) to force auto-play, e.g. on next/prev */
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

  // Persisted volume
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 0.5;
    const saved = window.localStorage.getItem("pth_volume");
    return saved ? Math.min(1, Math.max(0, Number(saved))) : 0.5;
  });

  // Track last key to avoid duplicate autoplay triggers
  const lastKeyRef = useRef<number | undefined>(undefined);

  const stopOtherAudios = () => {
    if (typeof document === "undefined") return;
    const me = audioRef.current;
    document.querySelectorAll("audio").forEach((el) => {
      if (el !== me) {
        try { (el as HTMLAudioElement).pause(); } catch {}
        try { (el as HTMLAudioElement).src = ""; (el as HTMLAudioElement).load(); } catch {}
      }
    });
  };

  const killAudio = () => {
    const a = audioRef.current;
    if (!a) return;
    try { a.pause(); } catch {}
    try { a.src = ""; a.load(); } catch {}
    setPlaying(false);
    setLoading(false);
    setErr(null);
  };

  // On mount/unmount
  useEffect(() => {
    stopOtherAudios();
    return () => {
      killAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Volume sync
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pth_volume", String(volume));
    }
  }, [volume]);

  // Load new station (no autoplay here)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    killAudio();            // clean stop previous
    stopOtherAudios();      // enforce singleton
    a.src = station.url;    // set new src
    a.load();               // prepare
  }, [station.url]);

  // Media event handlers -> keep status accurate
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onWaiting = () => { setLoading(true); setErr(null); };
    const onPlaying = () => { setLoading(false); setErr(null); setPlaying(true); };
    const onStalled  = () => { setLoading(true); };
    const onPause    = () => { setPlaying(false); };
    const onEnded    = () => { setPlaying(false); setLoading(false); };
    const onError    = () => { setLoading(false); setPlaying(false); setErr("Stream error. Try again."); };

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

  // Auto-play when the key from context bumps (e.g., next/prev or card click)
  useEffect(() => {
    if (playOnLoadKey === undefined) return;
    if (lastKeyRef.current === playOnLoadKey) return; // already handled this key
    lastKeyRef.current = playOnLoadKey;

    const a = audioRef.current;
    if (!a) return;

    setErr(null);
    setLoading(true);
    stopOtherAudios();
    a.play()
      .then(() => { setPlaying(true); setLoading(false); })
      .catch(() => { setPlaying(false); setLoading(false); setErr("Couldn’t start the stream."); });
  }, [playOnLoadKey]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;

    if (playing) {
      a.pause();
      // onPause handler will setPlaying(false)
    } else {
      setErr(null);
      setLoading(true);
      stopOtherAudios();
      a.play()
        .then(() => { setPlaying(true); setLoading(false); })
        .catch(() => { setPlaying(false); setLoading(false); setErr("Couldn’t start the stream."); });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      {!hideTitle && (
        <h2 className="text-white font-semibold truncate max-w-[70vw]">
          {station.name}
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

      {/* 👇 Buffering/Status line */}
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
