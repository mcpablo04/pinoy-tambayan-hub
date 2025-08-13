// src/pages/stations/[id].tsx
import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";
import { usePlayer } from "../../context/PlayerContext";
import type { Station as BaseStation } from "../../components/RadioPlayer";
import { STATIONS } from "../../data/stations";

type StationEx = BaseStation & {
  description?: string;
  genre?: string;
  city?: string;
  country?: string;
  website?: string;
  officialEmbedUrl?: string;
};

function norm(s?: string) {
  return (s || "").trim().toLowerCase();
}

export default function StationDetail({ station }: { station: StationEx }) {
  const { setStation, setShowUI } = usePlayer();

  // --- smarter "related" picking -------------------------------------------
  const related = useMemo(() => {
    const g = norm(station.genre);
    const c = norm(station.city);
    const co = norm(station.country);

    // Score by similarity. Higher score = more related.
    // +2 same genre, +1 same city, +0.5 same country
    const scored = STATIONS
      .filter((s) => s.id !== station.id)
      .map((s) => {
        const sx = s as StationEx;
        let score = 0;
        if (g && norm(sx.genre) === g) score += 2;
        if (c && norm(sx.city) === c) score += 1;
        if (co && norm(sx.country) === co) score += 0.5;
        return { s: sx, score };
      })
      .sort((a, b) => b.score - a.score);

    // Take all with positive score first
    const positives = scored.filter((x) => x.score > 0).map((x) => x.s);

    // If not enough, top up from the rest (keeps page lively even with sparse metadata)
    const remainder = scored.filter((x) => x.score === 0).map((x) => x.s);

    const pick = [...positives, ...remainder].slice(0, 8);

    return pick;
  }, [station]);

  const title = `${station.name} — Listen Live | Pinoy Tambayan Hub`;
  const desc =
    station.description ||
    `${station.name} live stream • ${station.genre ?? "Radio"} • ${station.city ?? ""} ${station.country ?? ""}`.trim();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RadioStation",
    name: station.name,
    areaServed: station.country || "Philippines",
    genre: station.genre,
    url: station.website || "https://example.com",
    logo: station.logo,
  };

  const playInFloating = () => {
    setStation(station, true); // set & play now
    setShowUI(true);
  };

  return (
    <div className="pt-20 bg-darkbg text-lighttext min-h-screen px-4">
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto text-sm text-gray-400 mb-4">
        <Link href="/radio" className="hover:text-blue-400">Radio</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">{station.name}</span>
      </nav>

      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-5 md:items-center mb-8">
        <img
          src={station.logo}
          alt={station.name}
          className="w-24 h-24 rounded-lg object-contain bg-gray-800 p-2"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold">{station.name}</h1>
          <p className="text-gray-400 mt-1 truncate">
            {station.genre ? `${station.genre} • ` : ""}
            {station.city ?? ""}{station.city && station.country ? ", " : ""}{station.country ?? ""}
          </p>

          {station.website && (
            <p className="mt-2">
              <a
                href={station.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Official Website ↗
              </a>
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={playInFloating}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              ▶ Play in Floating Player
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {station.description && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">About {station.name}</h3>
              <p className="text-gray-300 leading-relaxed">{station.description}</p>
            </div>
          )}

          <div className="card bg-gray-900/70 border-blue-500/30">
            <h3 className="text-lg font-semibold mb-2">Disclaimer</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Pinoy Tambayan Hub is a directory that links to publicly available radio streams or
              official players. We do not host or claim ownership of the streams. If you own this
              station and wish to update details or request removal, please contact us via the
              Contact page.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <aside className="md:col-span-1 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">Related Stations</h3>

            {related.length ? (
              <ul className="space-y-3">
                {related.map((s) => {
                  const sx = s as StationEx;
                  return (
                    <li key={s.id} className="flex items-center gap-3">
                      <img
                        src={s.logo}
                        alt={s.name}
                        className="w-10 h-10 rounded bg-gray-800 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/stations/${s.id}`}
                          className="text-sm text-gray-200 hover:text-blue-400 truncate"
                        >
                          {s.name}
                        </Link>
                        <div className="text-xs text-gray-500 truncate">
                          {sx.genre ?? "Radio"}
                          {sx.city ? ` • ${sx.city}` : ""}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setStation(sx, true);
                          setShowUI(true);
                        }}
                        className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-100 shrink-0"
                      >
                        Play
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No related stations found.</p>
            )}
          </div>

          <div className="card text-center">
            <div className="text-xs text-gray-500 mb-2">Advertisement</div>
            <div style={{ minHeight: 250 }} className="bg-gray-800 rounded" />
          </div>
        </aside>
      </section>
    </div>
  );
}

export async function getStaticPaths() {
  return {
    paths: STATIONS.map((s) => ({ params: { id: s.id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  const station = (STATIONS as StationEx[]).find((s) => s.id === params.id) || null;
  if (!station) return { notFound: true };
  return { props: { station } };
}
