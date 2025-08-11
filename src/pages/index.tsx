"use client";

import Link from "next/link";
import ChatBox from "../components/ChatBox";
import { usePlayer } from "../context/PlayerContext";

export default function Home() {
  const { setShowUI } = usePlayer();

  return (
    <>
      {/* Hero Section */}
      <section className="text-center py-12">
        <h2 className="text-4xl font-bold mb-4 text-blue-400">
          Welcome to Pinoy Tambayan Hub
        </h2>
        <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
          Your daily dose of OPM hits, live radio, and tambayan vibes — all in one
          place.
        </p>
        <Link
          href="/radio"
          onClick={() => setShowUI(true)}
          className="text-blue-400 hover:underline font-semibold"
          prefetch={false}
        >
          Start Listening
        </Link>
      </section>

      {/* Live Chat Section */}
      <section className="py-12">
        <ChatBox />
      </section>
    </>
  );
}
