"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const LINKS = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Radio", href: "/radio", icon: "📻" },
  { label: "Weather", href: "/weather", icon: "⛅" },
  { label: "Events", href: "/events", icon: "📅" },
  { label: "News", href: "/news", icon: "📰" },
  { label: "Stories", href: "/stories", icon: "✍️" },
];

const ICON_BAR_H = 48;      // h-12
const HYSTERESIS = 16;      // dead-zone to prevent jitter (a bit wider)
const EASE = "cubic-bezier(.22,.61,.36,1)"; // natural ease-out
const DURATION_MS = 280;    // small but snappy

export default function NavBar() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const photo = profile?.photoURL || user?.photoURL || null;
  const displayName = profile?.displayName || user?.displayName || "Profile";

  const isActive = (href: string) =>
    router.pathname === href || (href !== "/" && router.pathname.startsWith(href));

  /* ---- measure brand row once (and on resize) ---- */
  const brandRef = useRef<HTMLDivElement | null>(null);
  const [brandH, setBrandH] = useState(56);     // sensible default
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    let rafId = 0;
    const measure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const h = Math.round(brandRef.current?.getBoundingClientRect().height || 56);
        setBrandH(h);
      });
    };

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof window !== "undefined" && "ResizeObserver" in window && brandRef.current) {
      ro = new ResizeObserver(() => measure());
      ro.observe(brandRef.current);
    } else {
      const onResize = () => measure();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    return () => {
      if (ro && brandRef.current) ro.unobserve(brandRef.current);
      cancelAnimationFrame(rafId);
    };
  }, []);

  /* ---- scroll with hysteresis + rAF (write only on state change) ---- */
  useEffect(() => {
    let ticking = false;

    const readAndUpdate = () => {
      ticking = false;
      const y = window.scrollY;

      if (compact) {
        // expand only when comfortably above threshold
        if (y <= Math.max(0, brandH - HYSTERESIS)) setCompact(false);
      } else {
        // collapse only when comfortably below threshold
        if (y >= brandH + HYSTERESIS) setCompact(true);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(readAndUpdate);
      }
    };

    // initialize
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [brandH, compact]);

  const currentHeaderH = ICON_BAR_H + (compact ? 0 : brandH);

  /* ---------------- MOBILE: fixed two-row header (polished) ---------------- */
  const MobileHeader = () => (
    <>
      <div
        className="
          md:hidden fixed inset-x-0 z-[70]
          bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60
          border-b border-gray-800
          gpu-smooth
        "
        style={{ top: 0 }}
      >
        {/* Brand row – collapses smoothly with hysteresis */}
        <div
          ref={brandRef}
          className={`
            overflow-hidden
            will-change-[max-height,opacity]
            ${compact ? "max-h-0 opacity-0" : "max-h-[200px] opacity-100"}
          `}
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            transition: `max-height ${DURATION_MS}ms ${EASE}, opacity ${Math.max(
              140,
              DURATION_MS - 120
            )}ms linear`,
          }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
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
            <span className="hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Icon bar – always visible */}
        <div className="h-12 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-2 h-full flex items-center justify-between">
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

            <div className="ml-2 pl-2 border-l border-gray-700">
              {user ? (
                <Link href="/profile" scroll aria-label="Profile" className="block">
                  {photo ? (
                    <div className="avatar avatar-sm">
                      <img src={photo} alt="avatar" />
                    </div>
                  ) : (
                    <div className="avatar avatar-sm grid place-items-center text-sm text-gray-300">👤</div>
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
      </div>

      {/* Spacer – height also transitions so content never jumps */}
      <div
        className="md:hidden"
        style={{
          height: currentHeaderH,
          transition: `height ${DURATION_MS}ms ${EASE}`,
        }}
      />
    </>
  );

  /* ---------------- DESKTOP: fixed header (unchanged) ---------------- */
  const DesktopHeader = () => (
    <header className="hidden md:block fixed inset-x-0 top-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 gpu-smooth">
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
                isActive(href) ? "text-white bg-gray-800" : "text-gray-200 hover:text-blue-400"
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
                  <div className="avatar avatar-sm grid place-items-center text-sm text-gray-300">👤</div>
                )}
                <span className="text-gray-200 text-sm">{displayName}</span>
              </Link>
              <Link href="/logout" scroll className="text-sm text-red-300 hover:text-red-200">
                Sign out
              </Link>
            </div>
          ) : (
            <Link href="/login" scroll className="ml-2 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500">
              Login / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );

  return (
    <>
      <MobileHeader />
      <DesktopHeader />
    </>
  );
}
