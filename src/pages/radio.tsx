"use client";

import { useMemo, useState, useEffect } from "react";
import Head from "next/head";
import StationList from "../components/StationList";
import { usePlayer, Station } from "../context/PlayerContext";
import { STATIONS } from "../data/stations";

const PER_PAGE = 8;

export default function RadioPage() {
  const [mounted, setMounted] = useState(false);
  const { currentStation, setStation } = usePlayer();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return STATIONS as Station[];
    return (STATIONS as Station[]).filter((s) => s.name.toLowerCase().includes(term));
  }, [q]);

  useEffect(() => setPage(0), [q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const slice = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Philippine Radio Stations | Pinoy Tambayan Hub</title>
      </Head>

      <div className="container-page">
        <h1 className="text-4xl font-black text-white uppercase italic mb-8">Philippine Radio Stations</h1>

        <div className="mb-8">
          <input
            className="w-full sm:w-96 bg-slate-900 border border-white/10 rounded-xl p-4 text-white"
            placeholder="Search stations…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <StationList
  stations={slice}
  currentStationId={currentStation?.id}
  // Added the '?' after playNow to match the Context type
  onSelect={(s: Station, playNow?: boolean) => setStation(s, playNow)}
/>

        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} className="text-white disabled:opacity-30">← Prev</button>
            <span className="text-slate-500">Page {page + 1} of {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount-1, p+1))} disabled={page >= pageCount-1} className="text-white disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </>
  );
}