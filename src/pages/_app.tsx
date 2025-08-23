// src/pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import GlobalPlayer from "../components/GlobalPlayer";
import { PlayerProvider } from "../context/PlayerContext";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
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
      path === "/news" ||
      path === "/events"   // ⬅️ include events too (optional)
    );
  }, [router.pathname]);

  // width & side padding only; top padding is applied globally below
  const mainShell = isSelfContained ? "flex-grow w-full" : "flex-grow max-w-6xl mx-auto p-6";

  // ⬅️ add a global top padding to clear the fixed NavBar on ALL pages
  const mainClass = `${mainShell} pt-20 md:pt-24`;

  return (
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
