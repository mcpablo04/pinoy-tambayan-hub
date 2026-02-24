// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { AuthProvider } from "../context/AuthContext";
import { PlayerProvider } from "../context/PlayerContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; // Integrated Footer
import GlobalPlayer from "../components/GlobalPlayer";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <PlayerProvider>
        {/* flex flex-col and min-h-screen ensure the Footer 
          is pushed to the bottom even on short pages.
        */}
        <div className="flex flex-col min-h-screen bg-[#020617] selection:bg-blue-500/30 selection:text-blue-200">
          
          <Navbar />
          
          {/* flex-grow allows the main content area to expand, 
            pushing the footer down.
          */}
          <main className="flex-grow pt-32 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
              <Component {...pageProps} />
            </div>
          </main>

          {/* Integrated Footer - now visible on every page */}
          <Footer />

          {/* Floating Global Audio Player */}
          <GlobalPlayer />
          
        </div>
      </PlayerProvider>
    </AuthProvider>
  );
}