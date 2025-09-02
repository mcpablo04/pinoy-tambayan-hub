// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="bg-darkbg">
      <Head>
        {/* Keep encoding; let per-page <Head> handle titles/descriptions */}
        <meta charSet="utf-8" />

        {/* AdSense site verification (keep your real ID) */}
        <meta name="google-adsense-account" content="ca-pub-XXXXXXXXXXXXXXXX" />

        {/* Fonts performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

        {/* --------- Favicons / PWA --------- */}
        {/* Primary */}
        <link rel="icon" href="/favicon.ico" />
        {/* PNG fallbacks (and used by some crawlers) */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        {/* Apple */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        {/* Android/manifest */}
        <link rel="manifest" href="/site.webmanifest" />
        {/* Safari pinned tab (optional if you have a mono SVG) */}
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#3b82f6" />

        <meta name="application-name" content="Pinoy Tambayan Hub" />
        <meta name="apple-mobile-web-app-title" content="Pinoy Tambayan Hub" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="color-scheme" content="dark light" />

        {/* Site-wide OG defaults (pages override) */}
        <meta property="og:site_name" content="Pinoy Tambayan Hub" />
        <meta property="og:image" content="/brand/og-cover.png" />
      </Head>
      <body className="antialiased bg-darkbg text-lighttext">
        <Main />
        <NextScript />
        {/* AdSense script is loaded in _app.tsx */}
      </body>
    </Html>
  );
}
