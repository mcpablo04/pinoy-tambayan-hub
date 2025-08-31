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
  try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch {}
  try { document.scrollingElement && (document.scrollingElement.scrollTop = 0); } catch {}
  try { document.documentElement && (document.documentElement.scrollTop = 0); } catch {}
  try { document.body && (document.body.scrollTop = 0); } catch {}

  const ids = ["__next"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollTop = 0;
  });

  const mains = document.querySelectorAll<HTMLElement>("main, [data-scrollable]");
  mains.forEach((el) => (el.scrollTop = 0));
}

function ScrollReset() {
  const router = useRouter();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      (window.history as any).scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const toTopNow = () => {
      hardScrollToTop();
      requestAnimationFrame(hardScrollToTop);
      setTimeout(hardScrollToTop, 0);
    };

    router.events.on("routeChangeStart", toTopNow);
    router.events.on("routeChangeComplete", toTopNow);
    router.events.on("hashChangeComplete", toTopNow);

    const popState = () => toTopNow();
    window.addEventListener("popstate", popState);

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
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
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

        {/* `isolate` helps avoid odd ancestor effects */}
        <div className="app-shell isolate">
          <NavBar />
          <ScrollReset />

          {/* Mobile: small gap (sticky takes space in flow); Desktop: clear fixed header */}
          <main
            className="flex-grow pt-4 md:pt-24 px-4 md:px-6 max-w-6xl mx-auto w-full"
            data-scrollable
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
