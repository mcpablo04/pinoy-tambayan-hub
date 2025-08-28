// src/pages/about.tsx
"use client";

export default function AboutPage() {
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <h1 className="page-title mb-2">About Us</h1>
        <p className="text-gray-400 mb-6">
          Welcome to <span className="text-white font-semibold">Pinoy Tambayan Hub</span> — your online
          tambayan for music, news, weather, and community. Our mission is to bring Filipinos together
          with entertainment, information, and connection.
        </p>

        <div className="rounded-lg bg-white/5 border border-white/10 p-4 sm:p-5">
          <h2 className="text-lg font-semibold mb-2">What we do</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Curate live Pinoy radio stations you can play anywhere.</li>
            <li>Surface PH-localized news, events, and weather at a glance.</li>
            <li>Offer a friendly space to chat and share stories.</li>
          </ul>
        </div>

        <p className="text-gray-300 mt-6 leading-relaxed">
          This project is made for kababayans who love radio, live updates, and hanging out online.
          We keep improving based on your feedback — salamat sa suporta!
        </p>
      </div>
    </section>
  );
}
