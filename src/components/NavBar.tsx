// src/components/NavBar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { label: "Home",    href: "/" },
  { label: "Radio",   href: "/radio" },
  { label: "Weather", href: "/weather" }, // ← changed from Lyrics → Weather
  { label: "Events",  href: "/events" },
  { label: "News",    href: "/news" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const handleLinkClick = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gray-900 bg-opacity-90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center text-white text-2xl font-bold" onClick={handleLinkClick}>
          <span className="mr-2">🎵</span>Pinoy Tambayan Hub
        </Link>

        {/* Desktop menu */}
        <nav className="hidden md:flex space-x-6">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-gray-200 hover:text-blue-400 px-3 py-1 rounded transition"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-200 text-2xl"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="block px-4 py-3 text-gray-200 hover:bg-gray-700 transition"
              onClick={handleLinkClick}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
