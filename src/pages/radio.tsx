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
    <div className="bg-darkbg text-lighttext min-h-screen overflow-x-hidden">
      <section className="section">
        <div className="container-page">
          <h1 className="page-title">Philippine Radio Stations</h1>

          {/* Search */}
          <div className="mb-4">
            <label htmlFor="station-search" className="sr-only">
              Search stations
            </label>
            <input
              id="station-search"
              className="input sm:w-96"
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
            <StationList
              stations={slice}
              currentStationId={current.id}
              onSelect={(s, playNow) => setStation(s, playNow)}
            />
          </div>

          {/* Pagination */}
          {filtered.length > PER_PAGE && (
            <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="btn btn-ghost disabled:opacity-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-400">
                Page {page + 1} of {pageCount}
              </span>
              <button
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="btn btn-ghost disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}

          {/* Spacer so floating player doesn't overlap content */}
          <div className="page-bottom-spacer" />
        </div>
      </section>
    </div>
  );
}
