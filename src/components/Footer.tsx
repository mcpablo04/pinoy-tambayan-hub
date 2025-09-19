// src/components/Footer.tsx
"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-6 mt-8 border-t border-gray-700">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left: copyright */}
        <div className="text-center md:text-left">
          © {year} <span className="text-gray-200">Pinoy Tambayan Hub</span> — All Rights Reserved
        </div>

        {/* Middle: nav links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/about" className="hover:text-blue-400">About Us</Link>
          <Link href="/terms" className="hover:text-blue-400">Terms</Link>
          <Link href="/contact" className="hover:text-blue-400">Contact</Link>
          <Link href="/privacy" className="hover:text-blue-400">Privacy</Link>
          <Link href="/support" className="hover:text-blue-400">Support</Link>
        </nav>

        {/* Right: social */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-gray-500 hidden sm:inline">Follow us:</span>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/profile.php?id=61579365553033"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Pinoy Tambayan Hub on Facebook"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition"
            title="Facebook"
          >
            {/* FB icon */}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.23 0-1.61.77-1.61 1.56v1.87h2.74l-.44 2.9h-2.3V22c4.78-.76 8.42-4.92 8.42-9.94Z" />
            </svg>
          </a>

          {/* X / Twitter */}
          <a
            href="https://x.com/pnoytambayanhub"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Pinoy Tambayan Hub on X"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition"
            title="X (Twitter)"
          >
            {/* X icon */}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M18.244 2H21l-6.53 7.454L22 22h-6.873l-4.7-6.16L4.8 22H2l7.06-8.06L2 2h6.985l4.255 5.64L18.244 2Zm-2.4 18h2.041L8.24 4H6.1l9.744 16Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
