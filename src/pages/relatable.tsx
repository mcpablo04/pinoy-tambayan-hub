"use client";

import RelatableFeed from "../components/RelatableFeed";

export default function RelatablePage() {
  return (
    <div className="pt-20 min-h-screen bg-darkbg text-lighttext">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Relatable PH 🔥
        </h1>

        <RelatableFeed />
      </div>
    </div>
  );
}