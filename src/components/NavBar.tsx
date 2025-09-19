// src/components/NavBar.tsx
"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Radio", href: "/radio", icon: "📻" },
  { label: "Weather", href: "/weather", icon: "⛅" },
  { label: "Events", href: "/events", icon: "📅" },
  { label: "News", href: "/news", icon: "📰" },
  { label: "Forums", href: "/forums", icon: "💬" }, // ← added
  { label: "Marketplace", href: "/marketplace", icon: "🛍️" },
  { label: "Stories", href: "/stories", icon: "✍️" },
  { label: "Tools", href: "/tools", icon: "🛠️" },
  { label: "Support", href: "/support", icon: "💙" },
];

// Show these as the main 5 items on mobile; the rest go under “More”.
const PRIMARY_MOBILE = ["Home", "Radio", "Weather", "Events", "News"];

const ICON_BAR_H = 64;
const SAFE_TOP = "env(safe-area-inset-top, 0px)";

export default function NavBar() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const photo = profile?.photoURL || user?.photoURL || null;
  const displayName = profile?.displayName || user?.displayName || "Profile";

  const isActive = (href: string) =>
    router.pathname === href || (href !== "/" && router.pathname.startsWith(href));

  // --- shrinking brand header ---
  const brandRef = useRef<HTMLDivElement | null>(null);
  const [brandH, setBrandH] = useState(56);

  useLayoutEffect(() => {
    const measure = () => {
      const h = Math.round(brandRef.current?.getBoundingClientRect().height || 56);
      if (h && h !== brandH) setBrandH(h);
    };
    measure();
    let ro: ResizeObserver | null = null;
    if (typeof window !== "undefined" && "ResizeObserver" in window && brandRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(brandRef.current);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro && brandRef.current) ro.unobserve(brandRef.current);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY || 0);
        const p = brandH > 1 ? Math.min(1, y / brandH) : 1;
        setProgress(p);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [brandH]);

  const headerH = ICON_BAR_H + Math.round(brandH * (1 - progress));

  // --- More sheet state ---
  const [showMore, setShowMore] = useState(false);
  useEffect(() => {
    const close = () => setShowMore(false);
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  // Body scroll lock while sheet is open
  useEffect(() => {
    if (!showMore) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showMore]);

  const mobilePrimary = LINKS.filter((l) => PRIMARY_MOBILE.includes(l.label));
  const mobileMore = LINKS.filter((l) => !PRIMARY_MOBILE.includes(l.label));

  /* ---------------- MOBILE ---------------- */
  const MobileHeader = () => (
    <>
      <div
        className="md:hidden fixed inset-x-0 top-0 z-[70] bg-gray-900/85 backdrop-blur border-b border-gray-800"
        style={
          {
            "--safeTop": SAFE_TOP,
            "--hdrH": `calc(${headerH}px + var(--safeTop))`,
            height: "var(--hdrH)",
            paddingTop: "var(--safeTop)",
            overflow: "hidden",
            transition: "height 160ms ease",
          } as React.CSSProperties
        }
      >
        <div className="relative" style={{ height: headerH }}>
          {/* Brand row */}
          <div
            ref={brandRef}
            className="absolute left-0 right-0 z-0 pointer-events-none"
            style={{
              top: 0,
              transform: `translate3d(0, ${-progress * brandH}px, 0)`,
              transition: "transform 160ms linear, opacity 140ms linear",
              opacity: 1 - progress,
            }}
          >
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 pointer-events-auto">
              <Link href="/" scroll className="flex items-center gap-3 text-white font-bold" aria-current={isActive("/") ? "page" : undefined}>
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

              <div className="ml-2">
                {user ? (
                  <Link href="/profile" scroll aria-label="Profile" className="hover:opacity-90">
                    <div className="avatar avatar-md ring-1 ring-gray-700/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo ?? "/images/avatar-default.png"} alt="avatar" />
                    </div>
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

          {/* ICON BAR — 5 primary + More */}
          <div className="absolute left-0 right-0 border-t border-gray-800 z-20" style={{ bottom: 0, height: ICON_BAR_H }}>
            <div className="max-w-6xl mx-auto px-1 h-full">
              <nav className="h-full" aria-label="Primary">
                <ul className="grid grid-cols-6 gap-1 h-full">
                  {mobilePrimary.slice(0, 5).map(({ label, href, icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={href} className="min-w-0">
                        <Link
                          href={href}
                          scroll
                          className={`flex flex-col items-center justify-center h-full rounded-lg transition px-1 text-center ${
                            active ? "bg-gray-800 text-white" : "text-gray-200 hover:bg-gray-800/60"
                          }`}
                          aria-label={label}
                          aria-current={active ? "page" : undefined}
                          title={label}
                        >
                          <span className="text-2xl leading-none">{icon}</span>
                          <span className="mt-0.5 text-[10px] leading-tight truncate w-full">{label}</span>
                        </Link>
                      </li>
                    );
                  })}

                  {/* More button */}
                  <li>
                    <button
                      type="button"
                      onClick={() => setShowMore(true)}
                      className="flex flex-col items-center justify-center h-full rounded-lg text-gray-200 hover:bg-gray-800/60 transition px-1 text-center"
                      aria-haspopup="dialog"
                      aria-expanded={showMore}
                      aria-controls="more-sheet"
                      title="More"
                    >
                      <span className="text-2xl leading-none">⋯</span>
                      <span className="mt-0.5 text-[10px] leading-tight">More</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* spacer so content doesn't hide under header */}
      <div
        className="md:hidden overflow-anchor-none"
        style={
          {
            "--safeTop": SAFE_TOP,
            "--hdrH": `calc(${headerH}px + var(--safeTop))`,
            height: "var(--hdrH)",
          } as React.CSSProperties
        }
      />

      {/* Bottom Sheet for "More" */}
      {showMore && (
        <div id="more-sheet" role="dialog" aria-modal="true" className="fixed inset-0 z-[80]">
          {/* Backdrop */}
          <button
            aria-label="Close More"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMore(false)}
          />

          {/* Sheet panel */}
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-gray-900/95 backdrop-blur border-t border-white/10 p-4"
            style={{ maxHeight: "70vh" }}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-white/15 mb-3" />
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-200">More</h2>
              <button onClick={() => setShowMore(false)} className="text-sm text-gray-300 hover:text-white">
                Close
              </button>
            </div>

            <ul className="grid grid-cols-4 gap-2">
              {mobileMore.map(({ label, href, icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    scroll
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-gray-800/60 hover:bg-gray-800 p-3 text-center text-gray-100"
                    onClick={() => setShowMore(false)}
                    aria-current={isActive(href) ? "page" : undefined}
                  >
                    <span className="text-2xl leading-none">{icon}</span>
                    <span className="text-xs leading-tight">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );

  /* ---------------- DESKTOP ---------------- */
  const DesktopHeader = () => (
    <header className="hidden md:block fixed inset-x-0 top-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 pt-3 pb-2">
        <Link href="/" scroll className="flex items-center gap-3 text-white font-bold" aria-current={isActive("/") ? "page" : undefined}>
          <Image
            src="/brand/pt-hub-logo.png"
            alt="Pinoy Tambayan Hub"
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-md object-contain"
          />
          <span className="text-2xl tracking-tight">Pinoy Tambayan Hub</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/profile" scroll aria-label="Profile" className="flex items-center gap-2 hover:opacity-90">
              <div className="avatar avatar-md ring-1 ring-gray-700/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo ?? "/images/avatar-default.png"} alt="avatar" />
              </div>
              <span className="hidden lg:inline text-gray-200 text-sm">{displayName}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              scroll
              className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/70"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>

      <nav className="max-w-6xl mx-auto flex items-center gap-1 px-3 pb-3" aria-label="Primary">
        {LINKS.map(({ label, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              scroll
              aria-current={active ? "page" : undefined}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors outline-none ${
                active
                  ? "text-white bg-gray-800 ring-1 ring-white/10"
                  : "text-gray-200 hover:text-white hover:bg-gray-800/60 focus-visible:ring-2 focus-visible:ring-blue-400/70"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );

  return (
    <>
      <MobileHeader />
      <DesktopHeader />
    </>
  );
}
