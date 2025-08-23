// src/pages/events.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type NewsItem = {
  title: string;
  link: string;
  pubDate: string; // from /api/news
  source?: string;
};

type Ev = {
  id: string;
  name: string;
  url: string;
  date: string | null; // we’ll use pubDate as a proxy
  venue?: string | null; // best effort via simple heuristics
  city?: string | null;  // best effort via heuristics
  source?: string | null;
};

const PER_PAGE = 12;

const PH_CITIES = [
  "All PH",
  "Manila",
  "Quezon City",
  "Cebu",
  "Davao",
  "Baguio",
  "Iloilo",
  "Cagayan de Oro",
];

const PRESETS = [
  { label: "All Gigs", q: 'gig OR concert OR "live show" OR "mall show" Philippines OPM' },
  { label: "Announcements", q: 'concert announced OR "tour dates" Philippines OPM' },
  { label: "Ticketing", q: '"tickets" AND (concert OR gig) Philippines OPM' },
  { label: "Festivals", q: 'music festival Philippines OPM' },
];

const ranges = [
  { key: "all", label: "All dates" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
] as const;

function fmtDate(d?: string | null) {
  if (!d) return "TBA";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Very light heuristics to pull a “venue” or “city” from title
function guessVenueAndCity(title: string): { venue?: string; city?: string } {
  const cityHit = PH_CITIES.slice(1).find((c) =>
    new RegExp(`\\b${c}\\b`, "i").test(title)
  );

  // Grab text after "at " or "@ " as a naive “venue”
  let venue: string | undefined;
  const atMatch = title.match(/\b(?:at|@)\s+([^–—\-|,]+?)(?:[,–—\-|]|$)/i);
  if (atMatch?.[1]) venue = atMatch[1].trim();

  return { venue, city: cityHit };
}

function buildQuery(baseQ: string, city: string, userQ: string) {
  const parts: string[] = [];
  // Required gig/concern intent
  parts.push("(" + baseQ + ")");
  // Optional free text
  if (userQ.trim()) parts.push("(" + userQ.trim() + ")");
  // City bias
  if (city !== "All PH") {
    parts.push(`("${city}" OR "${city}, Philippines")`);
  } else {
    parts.push("(Philippines OR PH)");
  }
  return parts.join(" AND ");
}

export default function EventsFromNews() {
  const [preset, setPreset] = useState(PRESETS[0].q);
  const [input, setInput] = useState("");
  const [city, setCity] = useState("All PH");
  const [range, setRange] = useState<(typeof ranges)[number]["key"]>("all");

  const [items, setItems] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(0);

  const load = async (effectiveQ: string) => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/news?q=${encodeURIComponent(effectiveQ)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load");

      const mapped: Ev[] =
        (j.items as NewsItem[]).map((it, idx) => {
          const { venue, city: guessedCity } = guessVenueAndCity(it.title);
          return {
            id: `${it.link}-${idx}`,
            name: it.title,
            url: it.link,
            date: it.pubDate || null, // using publish date as proxy
            venue: venue || null,
            city: guessedCity || null,
            source: it.source || null,
          };
        }) ?? [];

      setItems(mapped);
      setPage(0);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setItems([]);
      setPage(0);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    const q = buildQuery(preset, city, input);
    load(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when city or preset changes, reload
  useEffect(() => {
    const q = buildQuery(preset, city, input);
    load(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, preset]);

  // filter by publish date window
  const filteredByDate = useMemo(() => {
    if (range === "all") return items;
    const days = Number(range);
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - days);

    return items.filter((ev) => {
      if (!ev.date) return true;
      const d = new Date(ev.date);
      if (Number.isNaN(d.getTime())) return true;
      return d >= start && d <= now;
    });
  }, [items, range]);

  useEffect(() => setPage(0), [filteredByDate.length, range]);

  const pageCount = Math.max(1, Math.ceil(filteredByDate.length / PER_PAGE));
  const slice = useMemo(
    () => filteredByDate.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [filteredByDate, page]
  );

  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  return (
    <section className="pt-20 max-w-6xl mx-auto p-6 text-lighttext">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">📅 PH Concerts & Gigs (from News)</h1>
        <p className="text-gray-400 mt-1">
          Pulled from Google News (PH‑localized). We surface gig/concern stories as “events.”
        </p>
      </div>

      {/* Controls bar */}
      <div className="sticky top-24 z-40 -mx-4 sm:mx-0 bg-darkbg/80 backdrop-blur border-y sm:border border-white/5 py-3 px-4 sm:rounded-xl mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Free text + search */}
          <div className="flex-1 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = buildQuery(preset, city, input);
                  load(q);
                }
              }}
              placeholder='Search (e.g., "SB19", "Ben&Ben Cebu", "Moira tickets")'
              className="flex-1 rounded-md bg-gray-800/80 text-gray-100 placeholder-gray-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                const q = buildQuery(preset, city, input);
                load(q);
              }}
              className="px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              Search
            </button>
          </div>

          {/* Preset chips */}
          <div className="-mx-2 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 px-2">
              {PRESETS.map((p) => {
                const active = p.q === preset;
                return (
                  <button
                    key={p.label}
                    onClick={() => setPreset(p.q)}
                    className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
                      active
                        ? "bg-blue-600 border-blue-500 text-white shadow"
                        : "bg-gray-800/70 border-gray-700 text-gray-200 hover:bg-gray-700"
                    }`}
                    title={p.q}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* City chips */}
          <div className="-mx-2 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 px-2">
              {PH_CITIES.map((c) => {
                const active = c === city;
                return (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
                      active
                        ? "bg-blue-600 border-blue-500 text-white shadow"
                        : "bg-gray-800/70 border-gray-700 text-gray-200 hover:bg-gray-700"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div className="flex gap-2">
            {ranges.map((r) => {
              const active = r.key === range;
              return (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`px-3 py-1.5 rounded-md border text-sm transition ${
                    active
                      ? "bg-blue-600 border-blue-500 text-white shadow"
                      : "bg-gray-800/70 border-gray-700 text-gray-200 hover:bg-gray-700"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Top pager */}
        {!loading && !err && filteredByDate.length > 0 && (
          <div className="flex items-center justify-between mt-3 text-sm text-gray-400">
            <div>
              Showing{" "}
              <span className="text-gray-200">
                {page * PER_PAGE + 1}-{Math.min(filteredByDate.length, (page + 1) * PER_PAGE)}
              </span>{" "}
              of <span className="text-gray-200">{filteredByDate.length}</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded bg-gray-800 text-gray-200 disabled:opacity-50 hover:bg-gray-700"
              >
                ← Prev
              </button>
              <button
                disabled={!canNext}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="px-3 py-1.5 rounded bg-gray-800 text-gray-200 disabled:opacity-50 hover:bg-gray-700"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* States */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-gray-800/50 animate-pulse" />
          ))}
        </div>
      ) : err ? (
        <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-red-200">
          <div className="font-semibold mb-1">Couldn’t load events</div>
          <p className="text-sm opacity-90">{err}</p>
        </div>
      ) : slice.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-gray-800/40 p-6 text-center">
          <div className="text-xl mb-1">No events found</div>
          <p className="text-gray-400 text-sm">Try a different search, city, or preset.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {slice.map((ev) => (
            <li
              key={ev.id}
              className="group rounded-xl bg-gray-800/60 border border-white/5 p-4 hover:border-blue-500/40 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-blue-400">
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {ev.name}
                    </a>
                  </h3>
                  <p className="text-sm text-gray-300 mt-0.5">
                    {fmtDate(ev.date)}{ev.venue ? ` • ${ev.venue}` : ""}
                  </p>
                  {(ev.city || ev.source) && (
                    <p className="text-xs text-gray-400">
                      {ev.city ? ev.city : "Philippines"}
                      {ev.source ? ` • ${ev.source}` : ""}
                    </p>
                  )}
                </div>

                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
                >
                  View ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Bottom pager */}
      {filteredByDate.length > PER_PAGE && !loading && !err && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 rounded bg-gray-800 text-gray-300 disabled:opacity-50 hover:bg-gray-700"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-400">
            Page {page + 1} of {pageCount}
          </span>
          <button
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="px-4 py-2 rounded bg-gray-800 text-gray-300 disabled:opacity-50 hover:bg-gray-700"
          >
            Next →
          </button>
        </div>
      )}

      <div className="h-8" />
    </section>
  );
}
