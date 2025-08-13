// src/pages/radio.tsx
import { useMemo, useState, useEffect, useRef } from "react";
import Head from "next/head";
import StationList from "../components/StationList";
import { usePlayer } from "../context/PlayerContext";
import { STATIONS } from "../data/stations";

const PER_PAGE = 8;

export default function RadioPage() {
  const { station: current, setStation } = usePlayer();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(0);

  // ---- debounce search input ~200ms ----
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    if (!debouncedQ) return STATIONS;
    return STATIONS.filter((s) => s.name.toLowerCase().includes(debouncedQ));
  }, [debouncedQ]);

  useEffect(() => setPage(0), [debouncedQ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const slice = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  // ---- prevent layout shrinking while typing ----
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [maxGridHeight, setMaxGridHeight] = useState(0);

  // Track the largest height we've seen so far (so it never shrinks)
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const update = () => setMaxGridHeight((m) => Math.max(m, el.offsetHeight));
    update();

    // Watch for expansion on resize/breakpoints
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Also re-check height after each filter/page change (in case it expands)
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    // wait a frame for DOM to paint
    const id = requestAnimationFrame(() =>
      setMaxGridHeight((m) => Math.max(m, el.offsetHeight))
    );
    return () => cancelAnimationFrame(id);
  }, [slice.length, page, debouncedQ]);

  const gridStyle =
    maxGridHeight > 0 ? { minHeight: `${maxGridHeight}px` } : undefined;

  // ---- optional JSON-LD ----
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Philippine Radio Stations",
    hasPart: filtered.slice(0, 20).map((s) => ({
      "@type": "RadioStation",
      name: s.name,
      url:
        typeof window !== "undefined"
          ? window.location.origin + "/radio"
          : "https://example.com/radio",
      logo: s.logo,
    })),
  };

  return (
    <div className="pt-16 bg-darkbg text-lighttext min-h-screen px-4">
      <Head>
        <title>Philippine Radio Stations — Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Listen to live Philippine radio stations. Browse and play OPM hits, news, and more."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">
        Philippine Radio Stations
      </h1>

      {/* AdSense block (TOP). Keep clear of inputs and cards */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="my-4 rounded-lg border border-gray-800 bg-gray-900/60 p-3 min-h-[90px] flex items-center justify-center text-gray-400 text-sm">
          {/* Replace with your AdSense code */}
          Ad — 728×90 / responsive
        </div>

        {/* Search */}
        <label htmlFor="station-search" className="sr-only">
          Search stations
        </label>
        <input
          id="station-search"
          className="w-full md:w-96 rounded-md bg-gray-800/80 text-gray-100 placeholder-gray-400 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search stations…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="mt-2 text-xs text-gray-400">
          Showing {slice.length} of {filtered.length}
        </p>
      </div>

      {/* Grid — minHeight locked to the largest seen so far */}
      <div className="max-w-6xl mx-auto" ref={gridRef} style={gridStyle}>
        {slice.length ? (
          <StationList
            stations={slice}
            currentStationId={current?.id}
            onSelect={(s, playNow) => setStation(s, playNow)}
          />
        ) : (
          <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-8 text-center text-gray-300">
            No stations match “{q}”. Try a different search.
          </div>
        )}
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

      {/* AdSense block (BOTTOM) */}
      <div className="max-w-6xl mx-auto my-10">
        <div className="my-2 rounded-lg border border-gray-800 bg-gray-900/60 p-3 min-h-[250px] flex items-center justify-center text-gray-400 text-sm">
          {/* Replace with your AdSense code */}
          Ad — 300×250 / responsive
        </div>
      </div>
    </div>
  );
}
