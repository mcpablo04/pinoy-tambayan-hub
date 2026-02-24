// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="bg-[#020617] scroll-smooth">
      <Head>
        {/* Encoding */}
        <meta charSet="utf-8" />

        {/* ✅ AdSense Publisher ID */}
        <meta name="google-adsense-account" content="ca-pub-8634966596493595" />

        {/* ✅ Official AdSense script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8634966596493595"
          crossOrigin="anonymous"
        ></script>

        {/* Fonts: Added Plus Jakarta Sans for that premium bold header look */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,700;0,800;1,800&display=swap"
          rel="stylesheet"
        />

        {/* Favicons / PWA */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Safari / iOS specific */}
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <meta name="application-name" content="Pinoy Tambayan Hub" />
        <meta name="apple-mobile-web-app-title" content="Pinoy Tambayan" />
        
        {/* Match the theme to your new deep blue background */}
        <meta name="theme-color" content="#020617" />
        <meta name="color-scheme" content="dark" />

        {/* OG defaults */}
        <meta property="og:site_name" content="Pinoy Tambayan Hub" />
        <meta property="og:image" content="/brand/og-cover.png" />
      </Head>
      <body className="antialiased bg-[#020617] text-slate-200 selection:bg-blue-500/30">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}