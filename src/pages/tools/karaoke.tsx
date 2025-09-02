// src/pages/tools/karaoke.tsx
"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Song = { title: string; artist: string; year?: number };

const OPM_SONGS: Song[] = [
  { title: "Tagpuan", artist: "Moira Dela Torre" },
  { title: "214", artist: "Rivermaya" },
  { title: "Tadhana", artist: "Up Dharma Down" },
  { title: "Ikaw", artist: "Yeng Constantino" },
  { title: "Rainbow", artist: "South Border" },
  { title: "Migraine", artist: "Moonstar88" },
  { title: "Hawak Kamay", artist: "Yeng Constantino" },
  { title: "Kathang Isip", artist: "Ben&Ben" },
  { title: "Akin Ka Na Lang", artist: "Morissette" },
  { title: "Buwan", artist: "JK Labajo" },
  { title: "Forevermore", artist: "Side A" },
  { title: "Pare Ko", artist: "Eraserheads" },
  { title: "With A Smile", artist: "Eraserheads" },
  { title: "Mundo", artist: "IV of Spades" },
  { title: "Hari ng Sablay", artist: "Sugarfree" },
];

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function KaraokeRoulette() {
  const [current, setCurrent] = useState<Song | null>(null);

  const title = "Karaoke Roulette — Pinoy Tambayan Hub";
  const description =
    "Spin a random OPM hit to sing! Family-friendly karaoke idea generator for tambayan nights.";

  // snap to the real top on mount
  useEffect(() => {
    try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch {}
  }, []);

  const searchUrl = useMemo(() => {
    if (!current) return "#";
    const q = encodeURIComponent(`${current.title} ${current.artist} karaoke`);
    return `https://www.youtube.com/results?search_query=${q}`;
  }, [current]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pinoytambayanhub.com/" },
      { "@type": "ListItem", position: 2, name: "Tools", item: "https://pinoytambayanhub.com/tools" },
      { "@type": "ListItem", position: 3, name: "Karaoke Roulette", item: "https://pinoytambayanhub.com/tools/karaoke" },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pinoytambayanhub.com/tools/karaoke" />
        <meta property="og:image" content="https://pinoytambayanhub.com/brand/og-card.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        <link rel="canonical" href="https://pinoytambayanhub.com/tools/karaoke" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <section className="section">
        <div className="container-page max-w-3xl text-lighttext">
          {/* Back to Tools */}
          <div className="mb-3">
            <Link href="/tools" className="text-sm text-gray-400 hover:text-blue-400">
              ← Back to Tools
            </Link>
          </div>

          <h1 className="page-title">🎤 Karaoke Roulette</h1>
          <p className="text-gray-400 mb-6">
            Spin to get a random OPM hit to sing! We only suggest titles/artists and send you to a YouTube search
            for karaoke versions — no copyrighted media embedded.
          </p>

          <div className="card space-y-5">
            <button
              onClick={() => setCurrent(pickRandom(OPM_SONGS))}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Spin Song 🎶
            </button>

            {current ? (
              <div className="rounded-lg bg-gray-800/60 border border-white/5 p-4">
                <div className="text-sm text-gray-400 mb-1">You got:</div>
                <div className="text-xl font-semibold">{current.title}</div>
                <div className="text-gray-300">{current.artist}</div>

                <a
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-100"
                >
                  Search karaoke on YouTube ↗
                </a>
              </div>
            ) : (
              <p className="text-gray-400">Press “Spin Song” to get a random pick.</p>
            )}
          </div>

          <div className="mt-6 text-sm text-gray-500">
            Tip: Open <a href="/radio" className="underline">Radio</a> in another tab for background vibes.
          </div>

          <div className="page-bottom-spacer" />
        </div>
      </section>
    </>
  );
}
