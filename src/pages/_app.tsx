import "../styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import Head from "next/head";

import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import GlobalPlayer from "../components/GlobalPlayer";
import { PlayerProvider } from "../context/PlayerContext";
import { AuthProvider } from "../context/AuthContext";

import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";

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

        <div className="app-shell isolate">
          <NavBar />

          {/* Desktop gets padding to clear fixed header; mobile handled by NavBar spacer */}
          <main
            className="flex-grow md:pt-24 px-4 md:px-6 max-w-6xl mx-auto w-full overflow-anchor-none"
            key={router.asPath}
          >
            <Component {...pageProps} />
          </main>

          <Footer />
          <GlobalPlayer />
        </div>

        {/* Global toaster – aligned top-right, under the fixed navbar */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={10}
          containerStyle={{ top: 88, right: 16 }}
          toastOptions={{
            style: {
              background: "#121722",
              color: "#e5e7eb",
              border: "1px solid #374151",
              boxShadow: "0 10px 30px rgba(0,0,0,.35)",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#121722" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#121722" } },
          }}
        />
      </PlayerProvider>
    </AuthProvider>
  );
}
