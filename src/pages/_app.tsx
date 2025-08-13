// src/pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import GlobalPlayer from "../components/GlobalPlayer";
import { PlayerProvider } from "../context/PlayerContext";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Stop browsers/Next from restoring old scroll position
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  /**
   * Pages that already handle their own container/padding:
   * - Home ("/")
   * - Radio ("/radio")
   * - Weather ("/weather")
   * - News ("/news")
   *
   * These get a full‑width <main> so we don’t double-wrap and cause
   * subtle right-side overflow on mobile.
   *
   * All other pages keep the global container & padding.
   */
  const isSelfContained = useMemo(() => {
    const path = router.pathname;
    return (
      path === "/" ||
      path === "/radio" ||
      path === "/weather" ||
      path === "/news"
    );
  }, [router.pathname]);

  const mainClass = isSelfContained
    ? "flex-grow w-full"            // page controls its own container/padding
    : "flex-grow max-w-6xl mx-auto p-6"; // global container for the rest

  return (
    <PlayerProvider>
      <div className="bg-darkbg text-lighttext min-h-screen flex flex-col overflow-x-hidden">
        <NavBar />
        <main className={mainClass}>
          <Component {...pageProps} />
        </main>
        <Footer />
        <GlobalPlayer />
      </div>
    </PlayerProvider>
  );
}
