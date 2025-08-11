// src/pages/radio.tsx
import { useMemo, useState, useEffect } from "react";
import StationList from "../components/StationList";
import { usePlayer } from "../context/PlayerContext";
import { STATIONS } from "../data/stations";

const PER_PAGE = 8;

export default function RadioPage() {
  const { station: current, setStation } = usePlayer();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return STATIONS;
    return STATIONS.filter((s) => s.name.toLowerCase().includes(term));
  }, [q]);

  useEffect(() => setPage(0), [q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const slice = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <div className="pt-16 bg-darkbg text-lighttext min-h-screen px-4">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">
        Philippine Radio Stations
      </h1>

      {/* Search */}
      <div className="max-w-6xl mx-auto mb-6">
        <input
          className="w-full md:w-96 rounded-md bg-gray-800/80 text-gray-100 placeholder-gray-400 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search stations…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="mt-2 text-xs text-gray-400">
          Showing {slice.length} of {filtered.length}
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto">
        <StationList
          stations={slice}
          currentStationId={current.id}
          onSelect={setStation}
        />
      </div>

      {/* Pagination */}
      {filtered.length > PER_PAGE && (
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 mt-8">
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
    </div>
  );
}
