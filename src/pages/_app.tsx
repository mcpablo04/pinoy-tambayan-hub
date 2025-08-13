// src/pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import GlobalPlayer from "../components/GlobalPlayer";
import { PlayerProvider } from "../context/PlayerContext";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";

// ⬇️ NEW: import AuthProvider
import { AuthProvider } from "../context/AuthContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

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
    ? "flex-grow w-full"
    : "flex-grow max-w-6xl mx-auto p-6";

  return (
    // ⬇️ NEW: wrap everything in AuthProvider
    <AuthProvider>
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
    </AuthProvider>
  );
}
