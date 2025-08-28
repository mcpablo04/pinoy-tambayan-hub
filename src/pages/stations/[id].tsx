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

export default function StationDetail({ station }: { station: StationEx }) {
  const { setStation, setShowUI } = usePlayer();

  const related = useMemo(() => {
    const key = (station.genre ?? "").toLowerCase();
    const pool = STATIONS.filter((s) => s.id !== station.id);
    const genreMatches = pool.filter(
      (s) => (s as StationEx).genre?.toLowerCase() === key
    );
    const list = genreMatches.length ? genreMatches : pool;
    return list.slice(0, 8);
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
    <section className="section">
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="container-page max-w-6xl">
        {/* Breadcrumb (scrollable on tiny screens) */}
        <nav className="-mx-4 px-4 overflow-x-auto no-scrollbar text-sm text-gray-400 mb-3">
          <Link href="/radio" className="hover:text-blue-400">
            Radio
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300 whitespace-nowrap">{station.name}</span>
        </nav>

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-6">
          <img
            src={station.logo}
            alt={station.name}
            loading="lazy"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-contain bg-gray-800 p-2 shrink-0"
          />

          {/* min-w-0 so long names can truncate */}
          <div className="flex-1 min-w-0">
            <h1 className="page-title mb-0 truncate">{station.name}</h1>

            <p className="text-gray-400 mt-1 truncate">
              {station.genre ? `${station.genre} • ` : ""}
              {station.city ?? ""}
              {station.city && station.country ? ", " : ""}
              {station.country ?? ""}
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

            <div className="mt-4 flex gap-2">
              <button
                onClick={playInFloating}
                className="btn btn-primary w-full sm:w-auto h-11"
              >
                ▶ Play in Floating Player
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="grid md:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="md:col-span-2 space-y-4">
            {station.description && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">
                  About {station.name}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {station.description}
                </p>
              </div>
            )}

            <div className="card bg-gray-900/70 border-blue-500/30">
              <h3 className="text-lg font-semibold mb-2">Disclaimer</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Pinoy Tambayan Hub is a directory that links to publicly
                available radio streams or official players. We do not host or
                claim ownership of the streams. If you own this station and wish
                to update details or request removal, please contact us via the
                Contact page.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="md:col-span-1 space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">Related Stations</h3>

              {/* Tight grid on mobile, list on desktop */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                {related.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 min-w-0 py-1.5">
                    <img
                      src={s.logo}
                      alt={s.name}
                      loading="lazy"
                      className="w-10 h-10 rounded bg-gray-800 p-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/stations/${s.id}`}
                        className="text-sm text-gray-200 hover:text-blue-400 truncate"
                      >
                        {s.name}
                      </Link>
                      <div className="text-xs text-gray-500 truncate">
                        {(s as StationEx).genre ?? "Radio"}
                      </div>
                    </div>
                  </li>
                ))}
                {!related.length && (
                  <li className="text-sm text-gray-400">No related stations.</li>
                )}
              </ul>
            </div>

            <div className="card text-center">
              <div className="text-xs text-gray-500 mb-2">Advertisement</div>
              <div className="bg-gray-800 rounded aspect-[16/9] sm:aspect-[1/1.25]" />
            </div>
          </aside>
        </section>

        {/* keep breathing room for floating player */}
        <div className="page-bottom-spacer" />
      </div>
    </section>
  );
}

export async function getStaticPaths() {
  return {
    paths: STATIONS.map((s) => ({ params: { id: s.id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  const station =
    (STATIONS as StationEx[]).find((s) => s.id === params.id) || null;
  if (!station) return { notFound: true };
  return { props: { station } };
}
