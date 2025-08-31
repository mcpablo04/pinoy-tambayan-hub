// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Radio", href: "/radio", icon: "📻" },
  { label: "Weather", href: "/weather", icon: "⛅" },
  { label: "Events", href: "/events", icon: "📅" },
  { label: "News", href: "/news", icon: "📰" },
  { label: "Stories", href: "/stories", icon: "✍️" },
];

export default function NavBar() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const photo = profile?.photoURL || user?.photoURL || null;
  const displayName = profile?.displayName || user?.displayName || "Profile";

  const isActive = (href: string) =>
    router.pathname === href || (href !== "/" && router.pathname.startsWith(href));

  // ===== Measure brand row height & detect when we've scrolled past it
  const brandRowRef = useRef<HTMLDivElement | null>(null);
  const [brandH, setBrandH] = useState(48);            // fallback height
  const [pastBrand, setPastBrand] = useState(false);   // true once we scrolled past the brand row

  useEffect(() => {
    const measure = () => {
      const h = brandRowRef.current?.getBoundingClientRect().height ?? 48;
      setBrandH(Math.round(h));
    };
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof window !== "undefined" && "ResizeObserver" in window && brandRowRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(brandRowRef.current);
    } else {
      window.addEventListener("resize", measure);
    }

    return () => {
      if (ro && brandRowRef.current) ro.unobserve(brandRowRef.current);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      // once we've scrolled more than the brand's height, snap icons to very top
      setPastBrand(window.scrollY >= brandH - 1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [brandH]);

  // ---------- MOBILE: brand row (normal flow; scrolls away) ----------
  const MobileBrandRow = () => (
    <div className="md:hidden bg-gray-900 border-b border-gray-800">
      <div
        ref={brandRowRef}
        className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3"
      >
        <Link
          href="/"
          scroll
          className="flex items-center gap-3 text-white font-bold"
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
          <span className="text-xl">Pinoy Tambayan Hub</span>
        </Link>
        {/* nothing on the right per request */}
        <span className="hidden" aria-hidden="true" />
      </div>
    </div>
  );

  // ---------- MOBILE: fixed icon bar
  // Sits UNDER the brand row at first (top = brandH),
  // then snaps to the very top as soon as you scroll (top = env(safe-area-inset-top))
  const MobileIconBar = () => {
    const topStyle: string | number = pastBrand ? "env(safe-area-inset-top)" : brandH; // px if number
    return (
      <div
        className="
          md:hidden fixed inset-x-0 z-[70]
          h-12
          bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60
          border-b border-gray-800
          transition-[top] duration-200 ease-out
        "
        style={{ top: topStyle }}
      >
        <div className="max-w-6xl mx-auto px-2 h-full flex items-center justify-between">
          {/* Icons (left) */}
          <nav className="flex-1" aria-label="Primary">
            <ul className="flex gap-1 overflow-x-auto no-scrollbar">
              {LINKS.map(({ label, href, icon }) => {
                const active = isActive(href);
                return (
                  <li key={href} className="shrink-0">
                    <Link
                      href={href}
                      scroll
                      className={`grid place-items-center w-12 h-10 rounded-lg transition
                        ${active ? "bg-gray-800 text-white" : "text-gray-200 hover:bg-gray-800/60"}
                      `}
                      aria-label={label}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="text-xl leading-none">{icon}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right: avatar (logged in) or Login pill (logged out) */}
          <div className="ml-2 pl-2 border-l border-gray-700">
            {user ? (
              <Link href="/profile" scroll aria-label="Profile" className="block">
                {photo ? (
                  <div className="avatar avatar-sm">
                    <img src={photo} alt="avatar" />
                  </div>
                ) : (
                  <div className="avatar avatar-sm grid place-items-center text-sm text-gray-300">
                    👤
                  </div>
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                scroll
                className="inline-flex items-center justify-center h-9 px-3 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Spacer so page content never hides under the fixed icon bar
  const MobileBarSpacer = () => <div className="md:hidden h-12" />;

  // ---------- DESKTOP: fixed header (unchanged) ----------
  const DesktopHeader = () => (
    <header className="hidden md:block fixed inset-x-0 top-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link
          href="/"
          scroll
          className="flex items-center gap-3 text-white font-bold"
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
          <span className="text-2xl">Pinoy Tambayan Hub</span>
        </Link>

        <nav className="flex items-center space-x-1">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              scroll
              className={`px-3 py-1 rounded transition ${
                isActive(href)
                  ? "text-white bg-gray-800"
                  : "text-gray-200 hover:text-blue-400"
              }`}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-700">
              <Link
                href="/profile"
                scroll
                className="flex items-center gap-2 hover:opacity-90"
                aria-label="Profile"
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
              <Link
                href="/logout"
                scroll
                className="text-sm text-red-300 hover:text-red-200"
              >
                Sign out
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              scroll
              className="ml-2 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              Login / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );

  return (
    <>
      {/* MOBILE: brand row first (normal flow) */}
      <MobileBrandRow />

      {/* MOBILE: fixed icon bar that starts under the brand, then snaps to top on scroll */}
      <MobileIconBar />
      <MobileBarSpacer />

      {/* DESKTOP: fixed header */}
      <DesktopHeader />
    </>
  );
}
