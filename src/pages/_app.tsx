// src/pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import GlobalPlayer from "../components/GlobalPlayer";
import { PlayerProvider } from "../context/PlayerContext";
import { useEffect } from "react";

export default function MyApp({ Component, pageProps }: AppProps) {
  // Stop browsers/Next from restoring old scroll position
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  return (
    <PlayerProvider>
      <div className="bg-darkbg text-lighttext min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow max-w-6xl mx-auto p-6">
          <Component {...pageProps} />
        </main>
        <Footer />
        <GlobalPlayer />
      </div>
    </PlayerProvider>
  );
}
