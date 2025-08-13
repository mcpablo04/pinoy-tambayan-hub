"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { label: "Home",    href: "/" },
  { label: "Radio",   href: "/radio" },
  { label: "Weather", href: "/weather" },
  { label: "News",    href: "/news" },
  { label: "Events",  href: "/events" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOutApp } = useAuth();

  const handleLinkClick = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gray-900 bg-opacity-90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center text-white text-2xl font-bold"
          onClick={handleLinkClick}
        >
          <span className="mr-2">🎵</span> Pinoy Tambayan Hub
        </Link>

        {/* Desktop menu */}
        <nav className="hidden md:flex items-center space-x-2">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-gray-200 hover:text-blue-400 px-3 py-1 rounded transition"
            >
              {label}
            </Link>
          ))}

          {/* Auth area */}
          {user ? (
            <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-700">
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-90">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700 grid place-items-center">👤</div>
                )}
                <span className="text-gray-200 text-sm">
                  {profile?.displayName || "Profile"}
                </span>
              </Link>
              <button
                onClick={signOutApp}
                className="text-sm text-red-300 hover:text-red-200"
                aria-label="Sign out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              Login / Register
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-200 text-2xl"
          onClick={() => setOpen((o) => !o)}
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

          {/* Mobile auth links */}
          <div className="px-4 py-3 border-t border-gray-700">
            {user ? (
              <div className="flex items-center justify-between">
                <Link href="/profile" className="text-blue-400" onClick={handleLinkClick}>
                  Profile
                </Link>
                <button onClick={signOutApp} className="text-red-300">
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-blue-400" onClick={handleLinkClick}>
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
