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
  { label: "Stories", href: "/stories", icon: "✍️" },
];

const ICON_BAR_H = 48; // h-12
const SAFE_TOP = "env(safe-area-inset-top, 0px)";

export default function NavBar() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const photo = profile?.photoURL || user?.photoURL || null;
  const displayName = profile?.displayName || user?.displayName || "Profile";
  const isActive = (href: string) =>
    router.pathname === href || (href !== "/" && router.pathname.startsWith(href));

  // --- measure brand row (expanded height)
  const brandRef = useRef<HTMLDivElement | null>(null);
  const [brandH, setBrandH] = useState(56); // sensible default

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

  // --- smooth progress 0..1 for brand slide (0 = fully visible, 1 = fully hidden)
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

  // Live header height: icon bar + remaining brand
  const headerH = ICON_BAR_H + Math.round(brandH * (1 - progress));

  /* ---------------- MOBILE: brand slides & container collapses ---------------- */
  const MobileHeader = () => (
    <>
      {/* Fixed header layer; height collapses with the brand; icon bar stays */}
      <div
        className="
          md:hidden fixed inset-x-0 top-0 z-[70]
          bg-gray-900/85 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60
          border-b border-gray-800 gpu-smooth
        "
        style={
          {
            // @ts-ignore — CSS custom props for perfect matching with spacer
            "--safeTop": SAFE_TOP,
            // @ts-ignore
            "--hdrH": `calc(${headerH}px + var(--safeTop))`,
            height: "var(--hdrH)",
            paddingTop: "var(--safeTop)",
            overflow: "hidden",           // clip the brand background as it collapses
            transition: "height 160ms ease",
            willChange: "height",
          } as React.CSSProperties
        }
      >
        {/* Inner box exactly headerH tall (excl. safeTop) */}
        <div className="relative" style={{ height: headerH }}>
          {/* BRAND ROW — slides up and fades out */}
          <div
            ref={brandRef}
            className="absolute left-0 right-0"
            style={{
              top: 0,
              transform: `translate3d(0, ${-progress * brandH}px, 0)`,
              transition: "transform 160ms linear, opacity 140ms linear",
              opacity: 1 - progress,
              willChange: "transform, opacity",
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

          {/* ICON BAR — pinned to bottom; always visible */}
          <div
            className="absolute left-0 right-0 border-t border-gray-800"
            style={{ bottom: 0, height: ICON_BAR_H }}
          >
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
      </div>

      {/* Spacer matches header total height (incl. safeTop) so content never jumps */}
      <div
        className="md:hidden"
        style={
          {
            // @ts-ignore
            "--safeTop": SAFE_TOP,
            // @ts-ignore
            "--hdrH": `calc(${headerH}px + var(--safeTop))`,
            height: "var(--hdrH)",
            transition: "height 160ms ease",
            willChange: "height",
          } as React.CSSProperties
        }
      />
    </>
  );

  /* ---------------- DESKTOP: fixed header (unchanged) ---------------- */
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
