// src/pages/index.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import ChatBox from "../components/ChatBox";
import { usePlayer } from "../context/PlayerContext";
import { STATIONS } from "../data/stations";
// at top with other imports
import MetaHead from "../components/MetaHead";


// 🔥 Firestore (adjust path if your db export lives elsewhere)
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  limit as fsLimit,
  query,
  type Timestamp,
} from "firebase/firestore";

/* ===================== helpers ===================== */
const byId = (id: string) => STATIONS.find((s) => s.id === id);

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

const peso = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
    : "—";

/* ===================== types ===================== */
type Product = {
  id: string;
  title: string;
  slug?: string | null;
  category?: string | null;
  pricePhp?: number | null;
  store?: string | null;
  imageUrl: string;
  affiliateUrl: string;
  blurb?: string | null;
  ownerName?: string | null;
  createdAt?: Timestamp | { seconds?: number } | null;
};

type Story = {
  id: string;
  title: string;
  slug?: string | null;
  createdAt?: Timestamp | { seconds?: number } | null;
};

/* ===================== featured lists ===================== */
const FEATURED_IDS = [
  "love-radio",
  "easy-rock",
  "barangay-ls",
  "energy-fm",
  "star-fm",
  "win-radio",
  "home-radio",
  "mor-entertainment",
];

export default function Home() {
  const { setShowUI } = usePlayer();

  const [products, setProducts] = useState<Product[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    // latest 6 marketplace products
    const pq = query(collection(db, "products"), orderBy("createdAt", "desc"), fsLimit(6));
    const unsubP = onSnapshot(pq, (snap) => {
      const arr: Product[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setProducts(arr);
    });

    // latest 4 stories
    const sq = query(collection(db, "stories"), orderBy("createdAt", "desc"), fsLimit(4));
    const unsubS = onSnapshot(sq, (snap) => {
      const arr: Story[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setStories(arr);
    });

    return () => {
      unsubP();
      unsubS();
    };
  }, []);

  const productCards = useMemo(
    () =>
      products.map((p) => {
        const pretty = p.slug && p.slug.length ? p.slug : slugify(p.title);
        return {
          ...p,
          href: `/marketplace/p/${p.id}-${pretty}`,
        };
      }),
    [products]
  );

  const storyLinks = useMemo(
    () =>
      stories.map((s) => ({
        ...s,
        href: `/stories/${s.slug && s.slug.length ? s.slug : s.id}`,
      })),
    [stories]
  );

  return (
    <>
      {/* SEO */}
      {/* replace the whole <Head>…</Head> block with this */}
<MetaHead
  title="Pinoy Tambayan Hub — OPM Radio, Weather, Events & News"
  description="Listen to Pinoy radio online, check PH weather, browse events and stories, shop community marketplace picks, and hang out with the tambayan."
  image="/brand/og-cover.png"
/>

{/* keep your SearchAction JSON-LD (nice touch!) */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Pinoy Tambayan Hub",
      url: "https://pinoytambayanhub.com/",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://pinoytambayanhub.com/radio?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    }),
  }}
/>


      {/* HERO */}
      <section className="section bg-darkbg text-lighttext scroll-mt-24 md:scroll-mt-28">
        <div className="container-page">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="page-title text-blue-400">Welcome to Pinoy Tambayan Hub</h1>
              <p className="mt-3 text-[15px] sm:text-base text-gray-300 max-w-prose">
                Your daily dose of OPM hits, live radio, tambayan stories, and community marketplace picks.
              </p>
              <div className="mt-5 flex gap-3 flex-wrap">
                <Link
                  href="/radio"
                  onClick={() => setShowUI(true)}
                  prefetch={false}
                  className="btn btn-primary px-5 py-3 text-sm sm:text-base"
                >
                  Start Listening
                </Link>
                <Link href="/marketplace" prefetch={false} className="btn btn-ghost px-5 py-3 text-sm sm:text-base">
                  Shop Picks
                </Link>
              </div>
            </div>

            {/* Quick links / cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <Link href="/stories" className="card card-hover">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400">
                    <span className="text-white text-xl">📖</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Stories</h3>
                    <p className="text-sm text-gray-400">Drama • Romance • One-shots</p>
                  </div>
                </div>
              </Link>

              <Link href="/events" className="card card-hover">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-500">
                    <span className="text-white text-xl">📅</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Events</h3>
                    <p className="text-sm text-gray-400">Concerts & meetups</p>
                  </div>
                </div>
              </Link>

              <Link href="/radio" onClick={() => setShowUI(true)} className="card card-hover">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-400">
                    <span className="text-white text-xl">📻</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Live Radio</h3>
                    <p className="text-sm text-gray-400">Pinoy stations</p>
                  </div>
                </div>
              </Link>

              <Link href="/news" className="card card-hover">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-tr from-orange-500 to-yellow-400">
                    <span className="text-white text-xl">🗞️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Latest News</h3>
                    <p className="text-sm text-gray-400">Headlines & updates</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED STATIONS */}
      <section className="section">
        <div className="container-page">
          <h2 className="page-title mb-3">Featured Stations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {FEATURED_IDS.map((id) => {
              const s = byId(id);
              if (!s) return null;
              return (
                <Link
                  key={s.id}
                  href={`/stations/${s.id}`}
                  className="rounded-lg bg-gray-800/70 px-4 py-3 border border-white/10 hover:bg-gray-800 transition flex items-center gap-3"
                  onClick={() => setShowUI(true)}
                >
                  {s.logo ? (
                    <Image
                      src={s.logo}
                      alt={s.name}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-md object-contain bg-black/10"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-gray-700 grid place-items-center text-[10px] text-gray-300">
                      LOGO
                    </div>
                  )}
                  <span className="font-medium leading-tight">{s.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-3">
            <Link href="/radio" onClick={() => setShowUI(true)} className="text-blue-400 hover:underline">
              Browse all stations →
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED MARKETPLACE */}
      <section className="section">
        <div className="container-page">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <h2 className="page-title mb-0">Featured Marketplace</h2>
            <Link href="/marketplace" className="text-blue-400 hover:underline">
              See all →
            </Link>
          </div>

          {productCards.length === 0 ? (
            <div className="card text-center text-neutral-300">No products yet. Be the first to post!</div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {productCards.map((p) => (
                <li key={p.id} className="card card-hover">
                  <Link href={p.href} className="block" aria-label={`${p.title} – details`}>
                    {p.imageUrl && (
                      <div className="mb-3 overflow-hidden rounded-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="aspect-[16/10] w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h3 className="text-base font-semibold leading-snug line-clamp-2">{p.title}</h3>
                  </Link>

                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-300">
                      <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs">
                        {p.category || "Others"}
                      </span>
                      {p.store && <span className="text-xs text-neutral-400">via {p.store}</span>}
                    </div>
                    {p.blurb && <p className="text-sm text-neutral-300 line-clamp-2">{p.blurb}</p>}
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-lg font-semibold">{peso(p.pricePhp ?? undefined)}</div>
                      <a
                        href={(p as any).affiliateUrl}
                        rel="nofollow sponsored noopener"
                        target="_blank"
                        className="text-xs text-blue-400 underline-offset-4"
                      >
                        Check price →
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* LATEST STORIES */}
      <section className="section">
        <div className="container-page">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <h2 className="page-title mb-0">Latest Stories</h2>
            <Link href="/stories" className="text-blue-400 hover:underline">
              Browse stories →
            </Link>
          </div>

          {storyLinks.length === 0 ? (
            <div className="card text-center text-neutral-300">No stories yet. Write the first one!</div>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {storyLinks.map((s) => (
                <li key={s.id} className="card card-hover p-4">
                  <h3 className="font-semibold">
                    <Link href={s.href} className="hover:underline">
                      {s.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-gray-400">New on the tambayan</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* QUICK WEATHER TEASER */}
      <section className="section">
        <div className="container-page">
          <div className="rounded-xl bg-gray-800/70 p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-3xl">🌤️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Weather at a glance</h3>
              <p className="text-gray-300 text-sm">See today’s forecast and alerts for your area.</p>
            </div>
            <Link href="/weather" className="btn btn-primary">
              Open Weather
            </Link>
          </div>
        </div>
      </section>

      {/* COMMUNITY CHAT */}
      <section className="section pb-24">
        <div className="container-page">
          <h2 className="page-title mb-3">Community Chat</h2>
          <div className="mx-auto w-full max-w-3xl min-h-0">
            <ChatBox />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-page">
          <h2 className="page-title mb-3">FAQ</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <details className="rounded-lg bg-gray-800/60 border border-white/10 p-4">
              <summary className="cursor-pointer font-semibold">Is Pinoy Tambayan Hub free?</summary>
              <p className="mt-2 text-gray-300 text-sm">
                Yes — listening and chatting are free. Some features may be supported by ads.
              </p>
            </details>
            <details className="rounded-lg bg-gray-800/60 border border-white/10 p-4">
              <summary className="cursor-pointer font-semibold">Do I need an account?</summary>
              <p className="mt-2 text-gray-300 text-sm">
                You can listen without an account. Sign in to personalize your profile and chat with an avatar.
              </p>
            </details>
            <details className="rounded-lg bg-gray-800/60 border border-white/10 p-4">
              <summary className="cursor-pointer font-semibold">How do I request a station?</summary>
              <p className="mt-2 text-gray-300 text-sm">
                Ping us via the Contact page — we’ll try to add it asap if it’s available online.
              </p>
            </details>
            <details className="rounded-lg bg-gray-800/60 border border-white/10 p-4">
              <summary className="cursor-pointer font-semibold">Can I report issues?</summary>
              <p className="mt-2 text-gray-300 text-sm">Yes! Use the Contact page to report broken streams or bugs.</p>
            </details>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section">
        <div className="container-page">
          <div className="rounded-xl bg-gray-800/70 p-6 border border-white/10">
            <h3 className="text-lg font-semibold">Get updates</h3>
            <p className="text-gray-300 text-sm">Be the first to know about new stations and features.</p>
            <form
              action="https://formspree.io/f/your-form-id"
              method="POST"
              className="mt-3 flex flex-col sm:flex-row gap-2"
            >
              <input type="email" name="email" required placeholder="you@email.com" className="input" />
              <button type="submit" className="btn btn-primary">
                Subscribe
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-400">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>
    </>
  );
}
