// src/pages/events.tsx
"use client";

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

/* ========= Types ========= */
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
  date: string | null;   // publish date as proxy
  venue?: string | null; // heuristic
  city?: string | null;  // heuristic
  source?: string | null;
};

/* ========= Config ========= */
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

/* ========= Helpers ========= */
function fmtDateShort(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function guessVenueAndCity(title: string): { venue?: string; city?: string } {
  const cityHit = PH_CITIES.slice(1).find((c) =>
    new RegExp(`\\b${c}\\b`, "i").test(title)
  );
  // venue: text after "at " or "@ "
  let venue: string | undefined;
  const atMatch = title.match(/\b(?:at|@)\s+([^–—\-|,]+?)(?:[,–—\-|]|$)/i);
  if (atMatch?.[1]) venue = atMatch[1].trim();
  return { venue, city: cityHit };
}

function buildQuery(baseQ: string, city: string, userQ: string) {
  const parts: string[] = [];
  parts.push("(" + baseQ + ")");
  if (userQ.trim()) parts.push("(" + userQ.trim() + ")");
  if (city !== "All PH") {
    parts.push(`("${city}" OR "${city}, Philippines")`);
  } else {
    parts.push("(Philippines OR PH)");
  }
  return parts.join(" AND ");
}

/* ========= Page ========= */
export default function EventsFromNews() {
  const [preset, setPreset] = useState(PRESETS[0].q);
  const [city, setCity] = useState("All PH");
  const [input, setInput] = useState("");
  const [items, setItems] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // pagination state
  const [page, setPage] = useState(0);

  const load = async (query: string) => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load");

      const mapped: Ev[] =
        (j.items as NewsItem[]).map((it, idx) => {
          const { venue, city: guessedCity } = guessVenueAndCity(it.title);
          return {
            id: `${it.link}-${idx}`,
            name: it.title,
            url: it.link,
            date: it.pubDate || null,
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
    load(buildQuery(preset, city, input));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const slice = useMemo(
    () => items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [items, page]
  );
  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  return (
    <>
      {/* SEO */}
      <Head>
        <title>OPM Concerts & Community Events | Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Discover upcoming OPM concerts, local gigs, and community events across the Philippines. Curated from PH-localized news."
        />
        <link rel="canonical" href="https://pinoytambayanhub.com/events" />

        <meta property="og:title" content="OPM Concerts & Community Events" />
        <meta
          property="og:description"
          content="Find gigs and events near you. Search by city or preset filters."
        />
        <meta property="og:image" content="/brand/og-cover.png" />
        <meta property="og:url" content="https://pinoytambayanhub.com/events" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="OPM Concerts & Community Events" />
        <meta
          name="twitter:description"
          content="Discover upcoming OPM concerts, local gigs, and festivals."
        />
        <meta name="twitter:image" content="/brand/og-cover.png" />
      </Head>

      <section className="section">
        <div className="container-page">
          {/* Header */}
          <h1 className="page-title">📅 PH Concerts & Gigs</h1>
          <p className="text-gray-400 mb-5">
            Curated from Google News (PH-localized).
          </p>

          {/* Search & actions */}
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load(buildQuery(preset, city, input));
              }}
              placeholder='Search (e.g., "SB19", "Ben&Ben Cebu", "Moira tickets")'
              className="input"
              aria-label="Search events"
            />
            <div className="flex gap-2 md:w-auto">
              <button
                onClick={() => load(buildQuery(preset, city, input))}
                className="btn btn-primary w-full md:w-auto"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setInput("");
                  setPreset(PRESETS[0].q);
                  setCity("All PH");
                  load(buildQuery(PRESETS[0].q, "All PH", ""));
                }}
                className="btn btn-ghost w-full md:w-auto"
                title="Reset filters"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Preset chips */}
          <div className="-mx-2 px-2 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setPreset(p.q); load(buildQuery(p.q, city, input)); }}
                  className={`shrink-0 px-3 py-1.5 rounded-full border whitespace-nowrap ${
                    preset === p.q
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800/70 border-gray-700 text-gray-200 hover:bg-gray-700"
                  }`}
                  title={p.q}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* City chips */}
          <div className="-mx-2 px-2 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 mb-6">
              {PH_CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCity(c); load(buildQuery(preset, c, input)); }}
                  className={`shrink-0 px-3 py-1.5 rounded-full border whitespace-nowrap ${
                    city === c
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800/70 border-gray-700 text-gray-200 hover:bg-gray-700"
                  }`}
                  title={c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Top pager */}
          {!loading && !err && items.length > 0 && (
            <div className="flex items-center justify-between mb-3 text-sm text-gray-400">
              <div>
                Showing{" "}
                <span className="text-gray-200">
                  {page * PER_PAGE + 1}-{Math.min(items.length, (page + 1) * PER_PAGE)}
                </span>{" "}
                of <span className="text-gray-200">{items.length}</span>
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

          {/* Results */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: PER_PAGE }).map((_, i) => (
                <div key={i} className="h-36 rounded-lg bg-gray-800/50 animate-pulse" />
              ))}
            </div>
          ) : err ? (
            <p className="text-amber-400">Error: {err}</p>
          ) : items.length === 0 ? (
            <p className="text-gray-400">No events found for this query.</p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slice.map((ev) => (
                  <a
                    key={ev.id}
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg bg-gray-800/60 border border-white/5 p-4 hover:bg-gray-800 transition"
                  >
                    <div className="text-sm text-gray-400 mb-1">
                      {(ev.source || "Source") + " • " + fmtDateShort(ev.date)}
                      {(ev.city || ev.venue) && (
                        <>
                          {" • "}
                          {ev.city ? `📍 ${ev.city}` : ""}
                          {ev.city && ev.venue ? " • " : ""}
                          {ev.venue ? `🏟️ ${ev.venue}` : ""}
                        </>
                      )}
                    </div>
                    <div className="font-semibold text-gray-100 line-clamp-3">
                      {ev.name}
                    </div>
                  </a>
                ))}
              </div>

              {/* Bottom pager */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 rounded bg-gray-800 text-gray-200 disabled:opacity-50 hover:bg-gray-700"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-400">
                  Page {page + 1} of {pageCount}
                </span>
                <button
                  disabled={!canNext}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="px-4 py-2 rounded bg-gray-800 text-gray-200 disabled:opacity-50 hover:bg-gray-700"
                >
                  Next →
                </button>
              </div>
            </>
          )}

          <div className="page-bottom-spacer" />
        </div>
      </section>
    </>
  );
}
