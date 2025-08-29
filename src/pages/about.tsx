// src/pages/about.tsx
"use client";

import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://pinoytambayanhub.com"; // update if different

export default function AboutPage() {
  const canonical = `${SITE_URL}/about`;
  const metaTitle = "About Us | Pinoy Tambayan Hub";
  const metaDesc =
    "Pinoy Tambayan Hub is your online tambayan for OPM radio, PH-localized news, weather, stories, and community chat — built by and for Filipinos.";

  return (
    <>
      {/* SEO */}
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />

        <meta property="og:title" content="About Us | Pinoy Tambayan Hub" />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="/brand/og-cover.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Us | Pinoy Tambayan Hub" />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content="/brand/og-cover.png" />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AboutPage",
              name: "About Pinoy Tambayan Hub",
              description: metaDesc,
              url: canonical,
              isPartOf: {
                "@type": "WebSite",
                name: "Pinoy Tambayan Hub",
                url: SITE_URL,
              },
              primaryImageOfPage: `${SITE_URL}/brand/og-cover.png`,
            }),
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Pinoy Tambayan Hub",
              url: SITE_URL,
              logo: `${SITE_URL}/brand/pt-hub-logo-180.png`,
              sameAs: [],
            }),
          }}
        />
      </Head>

      <section className="section">
        <div className="container-page max-w-3xl">
          <h1 className="page-title mb-2">About Us</h1>
          <p className="text-gray-400 mb-6">
            Welcome to <span className="text-white font-semibold">Pinoy Tambayan Hub</span> — your online
            tambayan for music, news, weather, and community. Our mission is to bring Filipinos together
            with entertainment, information, and connection.
          </p>

          {/* What we do */}
          <div className="rounded-lg bg-white/5 border border-white/10 p-4 sm:p-5">
            <h2 className="text-lg font-semibold mb-2">What we do</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Curate live Pinoy radio stations you can play anywhere.</li>
              <li>Surface PH-localized news, events, and weather at a glance.</li>
              <li>Offer a friendly space to chat and share stories.</li>
            </ul>
          </div>

          {/* Values / highlights */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <div className="text-2xl mb-2" aria-hidden>🎧</div>
              <h3 className="font-semibold text-white mb-1">For the Community</h3>
              <p className="text-gray-300 text-sm">
                Built for kababayans who love OPM, radio, and chill tambayan vibes.
              </p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <div className="text-2xl mb-2" aria-hidden>⚡</div>
              <h3 className="font-semibold text-white mb-1">Fast & Simple</h3>
              <p className="text-gray-300 text-sm">
                Lightweight UI, quick access to stations, and clean reading experience.
              </p>
            </div>
          </div>

          <p className="text-gray-300 mt-6 leading-relaxed">
            This project is made for kababayans who love radio, live updates, and hanging out online.
            We keep improving based on your feedback — salamat sa suporta!
          </p>

          {/* CTA links */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/radio" className="btn btn-primary">Start Listening</Link>
            <Link href="/stories" className="btn btn-ghost">Read Stories</Link>
            <Link href="/contact" className="btn btn-ghost">Contact Us</Link>
          </div>

          <div className="page-bottom-spacer" />
        </div>
      </section>
    </>
  );
}
