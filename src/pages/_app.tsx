// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { AuthProvider } from "../context/AuthContext";
import { PlayerProvider } from "../context/PlayerContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GlobalPlayer from "../components/GlobalPlayer";
import "../styles/globals.css";

// Smooth scroll and font smoothing for that premium feel
export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <PlayerProvider>
        <div className="flex flex-col min-h-screen bg-[#020617] text-slate-200 antialiased selection:bg-blue-600/30 selection:text-blue-200 transition-colors duration-500">
          
          {/* Navbar sits outside flex-grow to stay at the top */}
          <Navbar />
          
          {/* pt-32 accounts for the fixed Navbar height.
            pb-32 accounts for the GlobalPlayer height so content isn't hidden behind it.
          */}
          <main className="flex-grow pt-32 pb-32 px-4 md:px-8">
            <div className="max-w-7xl mx-auto w-full">
              <Component {...pageProps} />
            </div>
          </main>

          <Footer />

          {/* Floating Global Audio Player - Usually z-indexed in its own component */}
          <GlobalPlayer />
          
        </div>
      </PlayerProvider>
    </AuthProvider>
  );
}