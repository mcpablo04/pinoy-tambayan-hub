"use client";

import Link from "next/link";
import ChatBox from "../components/ChatBox";
import { usePlayer } from "../context/PlayerContext";

export default function Home() {
  const { setShowUI } = usePlayer();

  return (
    <>
      {/* HERO */}
      <section className="pt-20 sm:pt-24 pb-6 bg-darkbg text-lighttext">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mx-auto max-w-3xl text-center text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-blue-400 leading-snug">
            Welcome to Pinoy Tambayan Hub
          </h1>

          <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-center text-[15px] sm:text-base text-gray-300">
            Your daily dose of OPM hits, live radio, and tambayan vibes — all in one
            place.
          </p>

          <div className="mt-5 flex justify-center">
            <Link
              href="/radio"
              onClick={() => setShowUI(true)}
              prefetch={false}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm sm:text-base font-semibold text-white 
                         shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900
                         transition"
            >
              Start Listening
            </Link>
          </div>
        </div>
      </section>

      {/* LIVE CHAT */}
      <section className="py-8 sm:py-10 pb-24">
        {/* pb-24 == space so the floating player button never overlaps inputs */}
        <div className="mx-auto w-full max-w-3xl px-3 sm:px-4">
          <ChatBox />
        </div>
      </section>
    </>
  );
}
