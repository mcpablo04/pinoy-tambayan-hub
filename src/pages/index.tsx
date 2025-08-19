// src/pages/index.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import ChatBox from "../components/ChatBox";
import { usePlayer } from "../context/PlayerContext";
import { STATIONS } from "../data/stations";

// Helper: quickly get a station by id (for logos/titles)
const byId = (id: string) => STATIONS.find((s) => s.id === id);

const CARDS = [
  {
    href: "/news",
    // Use a news/talk station logo
    stationId: "dzrh", // 666 AM DZRH
    title: "OPM & Community News",
    blurb: "Gig updates & releases",
  },
  {
    href: "/events",
    // A recognizable station logo to visually brand the card
    stationId: "star-fm",
    title: "Events",
    blurb: "Concerts & meetups",
  },
  {
    href: "/radio",
    stationId: "love-radio",
    title: "Live Radio",
    blurb: "Pinoy stations",
    onClick: "showUI",
  },
  {
    href: "/news",
    stationId: "dzmm",
    title: "Latest News",
    blurb: "Headlines & updates",
  },
];

// Featured stations list (logos shown instead of emoji)
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
  const heroRef = useRef<HTMLElement | null>(null);

  // Avoid initial scroll/focus jumps on load
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    heroRef.current?.scrollIntoView({ block: "start", inline: "nearest" });
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  return (
    <>
      {/* HERO */}
      <section ref={heroRef} className="pt-20 sm:pt-24 pb-8 bg-darkbg text-lighttext">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-blue-400 leading-snug">
                Welcome to Pinoy Tambayan Hub
              </h1>
              <p className="mt-3 sm:mt-4 text-[15px] sm:text-base text-gray-300 max-w-prose">
                Your daily dose of OPM hits, live radio, and tambayan vibes — all in one place.
              </p>
              <div className="mt-5 flex gap-3">
                <Link
                  href="/radio"
                  onClick={() => setShowUI(true)}
                  prefetch={false}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm sm:text-base font-semibold text-white 
                             shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition"
                >
                  Start Listening
                </Link>
                <Link
                  href="/weather"
                  prefetch={false}
                  className="inline-flex items-center justify-center rounded-lg bg-gray-800 px-5 py-3 text-sm sm:text-base font-semibold text-gray-100 
                             border border-white/10 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                >
                  Check Weather
                </Link>
              </div>
            </div>

            {/* Quick links / cards */}
<div className="grid grid-cols-2 gap-3 md:gap-4">
  <Link href="/news" className="card hover:bg-card transition">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400">
        <span className="text-white text-xl">📰</span>
      </div>
      <div>
        <h3 className="font-semibold">OPM & Community News</h3>
        <p className="text-sm text-gray-400">Gig updates & releases</p>
      </div>
    </div>
  </Link>

  <Link href="/events" className="card hover:bg-card transition">
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

  <Link href="/radio" onClick={() => setShowUI(true)} className="card hover:bg-card transition">
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

  <Link href="/news" className="card hover:bg-card transition">
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

      {/* FEATURED STATIONS (logos) */}
      <section className="py-8 sm:py-10">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Featured Stations</h2>
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

      {/* QUICK WEATHER TEASER */}
      <section className="py-6">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="rounded-xl bg-gray-800/70 p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-3xl">🌤️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Weather at a glance</h3>
              <p className="text-gray-300 text-sm">See today’s forecast and alerts for your area.</p>
            </div>
            <Link
              href="/weather"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Open Weather
            </Link>
          </div>
        </div>
      </section>

      {/* COMMUNITY CHAT */}
      <section className="py-8 sm:py-10 pb-24">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Community Chat</h2>
        <div className="mx-auto w-full max-w-3xl min-h-0">
            <ChatBox />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 sm:py-10">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">FAQ</h2>
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
              <p className="mt-2 text-gray-300 text-sm">
                Yes, please! Use the Contact page to report broken streams or bugs.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-8 sm:py-10">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="rounded-xl bg-gray-800/70 p-6 border border-white/10">
            <h3 className="text-lg font-semibold">Get updates</h3>
            <p className="text-gray-300 text-sm">Be the first to know about new stations and features.</p>
            <form
              action="https://formspree.io/f/your-form-id" // ← replace with your Formspree endpoint
              method="POST"
              className="mt-3 flex flex-col sm:flex-row gap-2"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@email.com"
                className="flex-1 rounded-md bg-gray-700/90 text-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
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
