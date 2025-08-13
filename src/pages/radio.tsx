// src/pages/radio.tsx
import { useMemo, useState, useEffect } from "react";
import Head from "next/head";
import StationList from "../components/StationList";
import { usePlayer } from "../context/PlayerContext";
import { STATIONS } from "../data/stations";

const PER_PAGE = 8;

export default function RadioPage() {
  const { station: current, setStation } = usePlayer();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  // Filter by search
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return STATIONS;
    return STATIONS.filter((s) => s.name.toLowerCase().includes(term));
  }, [q]);

  // Reset page when search changes
  useEffect(() => setPage(0), [q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const slice = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <div className="bg-darkbg text-lighttext min-h-screen overflow-x-hidden">
      <Head>
        <title>Philippine Radio Stations — Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Listen to live Philippine radio stations. Browse and play OPM hits, news, and more."
        />
      </Head>

      {/* Self-contained container & spacing so it doesn't depend on _app */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 pt-20">
        <h1 className="text-3xl font-bold mb-6 text-center md:text-left">
          Philippine Radio Stations
        </h1>

        {/* Search */}
        <div className="mb-6">
          <label htmlFor="station-search" className="sr-only">
            Search stations
          </label>
          <input
            id="station-search"
            className="w-full sm:w-96 rounded-md bg-gray-800/80 text-gray-100 placeholder-gray-400 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search stations…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <p className="mt-2 text-xs text-gray-400">
            Showing {slice.length} of {filtered.length}
          </p>
        </div>

        {/* Grid */}
        <div>
          {slice.length ? (
            <StationList
              stations={slice}
              currentStationId={current?.id}
              onSelect={setStation}
            />
          ) : (
            <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-8 text-center text-gray-300">
              No stations match “{q}”. Try a different search.
            </div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-4 py-2 rounded bg-gray-800 text-gray-300 disabled:opacity-50 hover:bg-gray-700"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-400">
              Page {page + 1} of {pageCount}
            </span>
            <button
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="px-4 py-2 rounded bg-gray-800 text-gray-300 disabled:opacity-50 hover:bg-gray-700"
            >
              Next →
            </button>
          </div>
        )}

        {/* Spacer so floating player button doesn't overlap content */}
        <div className="h-8" />
      </div>
    </div>
  );
}
