// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="bg-darkbg">
      <Head>
        {/* Encoding */}
        <meta charSet="utf-8" />

        {/* ✅ Replace with your real AdSense Publisher ID */}
        <meta name="google-adsense-account" content="ca-pub-8634966596493595" />

        {/* ✅ Official AdSense script (site-wide) */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8634966596493595"
          crossOrigin="anonymous"
        ></script>

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Favicons / PWA */}
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/icons/safari-pinned-tab.svg"
          color="#3b82f6"
        />

        <meta name="application-name" content="Pinoy Tambayan Hub" />
        <meta name="apple-mobile-web-app-title" content="Pinoy Tambayan Hub" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="color-scheme" content="dark light" />

        {/* OG defaults */}
        <meta property="og:site_name" content="Pinoy Tambayan Hub" />
        <meta property="og:image" content="/brand/og-cover.png" />
      </Head>
      <body className="antialiased bg-darkbg text-lighttext">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
