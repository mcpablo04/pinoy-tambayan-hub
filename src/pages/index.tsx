// src/pages/index.tsx
"use client";

import Link from "next/link";
import ChatBox from "../components/ChatBox";
import { usePlayer } from "../context/PlayerContext";

export default function Home() {
  const { setShowUI } = usePlayer();

  return (
    <>
      {/* HERO (left-aligned, not centered) */}
      <section className="pt-20 sm:pt-24 pb-8 bg-darkbg text-lighttext">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Text */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-blue-400 leading-snug">
                Welcome to Pinoy Tambayan Hub
              </h1>
              <p className="mt-3 sm:mt-4 text-[15px] sm:text-base text-gray-300 max-w-prose">
                Your daily dose of OPM hits, live radio, and tambayan vibes — all in
                one place.
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
              <Link
                href="/news"
                className="rounded-xl bg-gray-800/70 p-4 border border-white/10 hover:bg-gray-800 transition"
              >
                <div className="text-2xl mb-2">📰</div>
                <h3 className="font-semibold">OPM & Community News</h3>
                <p className="text-sm text-gray-400 mt-1">Gig updates & releases</p>
              </Link>

              <Link
                href="/events"
                className="rounded-xl bg-gray-800/70 p-4 border border-white/10 hover:bg-gray-800 transition"
              >
                <div className="text-2xl mb-2">📅</div>
                <h3 className="font-semibold">Events</h3>
                <p className="text-sm text-gray-400 mt-1">Concerts & meetups</p>
              </Link>

              <Link
                href="/radio"
                onClick={() => setShowUI(true)}
                className="rounded-xl bg-gray-800/70 p-4 border border-white/10 hover:bg-gray-800 transition"
              >
                <div className="text-2xl mb-2">📻</div>
                <h3 className="font-semibold">Live Radio</h3>
                <p className="text-sm text-gray-400 mt-1">Pinoy stations</p>
              </Link>

              {/* Replaced Lyrics with News */}
              <Link
                href="/news"
                className="rounded-xl bg-gray-800/70 p-4 border border-white/10 hover:bg-gray-800 transition"
              >
                <div className="text-2xl mb-2">🗞️</div>
                <h3 className="font-semibold">Latest News</h3>
                <p className="text-sm text-gray-400 mt-1">Headlines & updates</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY CHAT — always shown */}
      <section className="py-8 sm:py-10 pb-24">
        {/* pb-24 == space so the floating player button never overlaps inputs */}
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Community Chat</h2>
          <div className="mx-auto w-full max-w-3xl">
            <ChatBox />
          </div>
        </div>
      </section>
    </>
  );
}
