// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Radio", href: "/radio", icon: "📻" },
  { label: "Weather", href: "/weather", icon: "⛅" },
  { label: "Events", href: "/events", icon: "📅" },
  { label: "News", href: "/news", icon: "📰" },
  { label: "Marketplace", href: "/marketplace", icon: "🛍️" }, // routes to /pages/marketplace/index.tsx
  { label: "Stories", href: "/stories", icon: "✍️" },
];

const ICON_BAR_H = 48;
const SAFE_TOP = "env(safe-area-inset-top, 0px)";

export default function NavBar() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const photo = profile?.photoURL || user?.photoURL || null;
  const displayName = profile?.displayName || user?.displayName || "Profile";
  const isActive = (href: string) =>
    router.pathname === href || (href !== "/" && router.pathname.startsWith(href));

  const brandRef = useRef<HTMLDivElement | null>(null);
  const [brandH, setBrandH] = useState(56);

  useLayoutEffect(() => {
    const measure = () => {
      const h = Math.round(brandRef.current?.getBoundingClientRect().height || 56);
      if (h) setBrandH(h);
    };
    measure();
    let ro: ResizeObserver | null = null;
    if ("ResizeObserver" in window && brandRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(brandRef.current);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro && brandRef.current) ro.unobserve(brandRef.current);
      window.removeEventListener("resize", measure);
    };
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
          <div
            ref={brandRef}
            className="absolute left-0 right-0"
            style={{
              top: 0,
              transform: `translate3d(0, ${-progress * brandH}px, 0)`,
              transition: "transform 160ms linear, opacity 140ms linear",
              opacity: 1 - progress,
            }}
          >
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
              <Link href="/" scroll className="flex items-center gap-3 text-white font-bold">
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

          {/* ICON BAR */}
          <div className="absolute left-0 right-0 border-t border-gray-800" style={{ bottom: 0, height: ICON_BAR_H }}>
            <div className="max-w-6xl mx-auto px-2 h-full flex items-center">
              <nav className="flex-1" aria-label="Primary">
                <ul className="flex gap-1 overflow-x-auto no-scrollbar">
                  {LINKS.map(({ label, href, icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={href} className="shrink-0">
                        <Link
                          href={href}
                          scroll
                          className={`grid place-items-center w-12 h-10 rounded-lg transition ${
                            active ? "bg-gray-800 text-white" : "text-gray-200 hover:bg-gray-800/60"
                          }`}
                        >
                          <span className="text-xl leading-none">{icon}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div
        className="md:hidden"
        style={
          {
            "--safeTop": SAFE_TOP,
            "--hdrH": `calc(${headerH}px + var(--safeTop))`,
            height: "var(--hdrH)",
          } as React.CSSProperties
        }
      />
    </>
  );

  /* ---------------- DESKTOP ---------------- */
  const DesktopHeader = () => (
    <header className="hidden md:block fixed inset-x-0 top-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 pt-3 pb-2">
        <Link href="/" scroll className="flex items-center gap-3 text-white font-bold">
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

      <nav className="max-w-6xl mx-auto flex items-center gap-1 px-3 pb-3">
        {LINKS.map(({ label, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              scroll
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
