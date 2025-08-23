// src/components/NavBar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Radio", href: "/radio" },
  { label: "Weather", href: "/weather" },
  { label: "Events", href: "/events" },
  { label: "News", href: "/news" },
  { label: "Stories", href: "/stories" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOutApp } = useAuth();
  const router = useRouter();

  const handleLinkClick = () => setOpen(false);
  const photo = profile?.photoURL || user?.photoURL || null;
  const displayName = profile?.displayName || user?.displayName || "Profile";

  const isActive = (href: string) => router.pathname === href;

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 text-white font-bold"
          onClick={handleLinkClick}
          aria-label="Pinoy Tambayan Hub"
        >
          <Image
            src="/brand/pt-hub-logo.png"
            alt="Pinoy Tambayan Hub"
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-md object-contain"
          />
          <span className="text-xl md:text-2xl">Pinoy Tambayan Hub</span>
        </Link>

        {/* Desktop menu */}
        <nav className="hidden md:flex items-center space-x-1">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={handleLinkClick}
              className={`px-3 py-1 rounded transition ${
                isActive(href)
                  ? "text-white bg-gray-800"
                  : "text-gray-200 hover:text-blue-400"
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Auth area */}
          {user ? (
            <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-700">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:opacity-90"
                onClick={handleLinkClick}
              >
                {photo ? (
                  <div className="avatar avatar-sm">
                    <img src={photo} alt="avatar" />
                  </div>
                ) : (
                  <div className="avatar avatar-sm grid place-items-center text-sm text-gray-300">
                    👤
                  </div>
                )}
                <span className="text-gray-200 text-sm">{displayName}</span>
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
              className="ml-2 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500"
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
          {/* Mobile auth header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-700">
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-3"
                onClick={handleLinkClick}
              >
                {photo ? (
                  <div className="avatar avatar-md">
                    <img src={photo} alt="avatar" />
                  </div>
                ) : (
                  <div className="avatar avatar-md grid place-items-center text-gray-300">
                    👤
                  </div>
                )}
                <span className="text-gray-200">{displayName}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-blue-400"
                onClick={handleLinkClick}
              >
                Login / Register
              </Link>
            )}

            {user && (
              <button onClick={signOutApp} className="text-red-300">
                Sign out
              </button>
            )}
          </div>

          {/* Mobile links */}
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-3 transition ${
                isActive(href)
                  ? "bg-gray-700 text-white"
                  : "text-gray-200 hover:bg-gray-700"
              }`}
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
