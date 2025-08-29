// src/pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import Head from "next/head";

import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import GlobalPlayer from "../components/GlobalPlayer";
import { PlayerProvider } from "../context/PlayerContext";
import { AuthProvider } from "../context/AuthContext";

import { useEffect } from "react";
import { useRouter } from "next/router";

function hardScrollToTop() {
  // 1) window/document
  try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch {}
  try { document.scrollingElement && (document.scrollingElement.scrollTop = 0); } catch {}
  try { document.documentElement && (document.documentElement.scrollTop = 0); } catch {}
  try { document.body && (document.body.scrollTop = 0); } catch {}

  // 2) common app wrappers
  const ids = ["__next"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollTop = 0;
  });

  // 3) main & any element marked scrollable
  const mains = document.querySelectorAll<HTMLElement>("main, [data-scrollable]");
  mains.forEach((el) => (el.scrollTop = 0));
}

function ScrollReset() {
  const router = useRouter();

  // Disable native scroll restoration (back/forward)
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // On every route/nav, blast scroll positions to 0
  useEffect(() => {
    const toTopNow = () => {
      // run immediately
      hardScrollToTop();
      // run next paint (after DOM/layout updates)
      requestAnimationFrame(hardScrollToTop);
      // and once more after microtasks (some components mount late)
      setTimeout(hardScrollToTop, 0);
    };

    router.events.on("routeChangeStart", toTopNow);
    router.events.on("routeChangeComplete", toTopNow);
    router.events.on("hashChangeComplete", toTopNow);

    // Also handle back/forward specifically
    const popState = () => toTopNow();
    window.addEventListener("popstate", popState);

    // First mount
    toTopNow();

    return () => {
      router.events.off("routeChangeStart", toTopNow);
      router.events.off("routeChangeComplete", toTopNow);
      router.events.off("hashChangeComplete", toTopNow);
      window.removeEventListener("popstate", popState);
    };
  }, [router.events, router.asPath]);

  return null;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <AuthProvider>
      <PlayerProvider>
        {/* Head here so viewport is NOT in _document (silences Next.js warning) */}
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {/* Optional defaults; individual pages can override with next/head */}
          <title>Pinoy Tambayan Hub</title>
          <meta
            name="description"
            content="Pinoy Tambayan Hub – your daily OPM hits, live radio, weather, events, news, and tambayan vibes in one place."
          />
          <link rel="canonical" href="https://pinoytambayanhub.com/" />
        </Head>

        {/* Google AdSense (replace client ID) */}
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />

        <div className="app-shell">
          <NavBar />
          <ScrollReset />
          {/* Give main a data attribute so we can target it if it ever scrolls */}
          <main
            className="flex-grow pt-20 sm:pt-24 px-4 md:px-6 max-w-6xl mx-auto w-full"
            data-scrollable
            // Force a fresh mount per route; useful when a child holds internal scroll
            key={router.asPath}
          >
            <Component {...pageProps} />
          </main>
          <Footer />
          <GlobalPlayer />
        </div>
      </PlayerProvider>
    </AuthProvider>
  );
}
