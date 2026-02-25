// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="bg-[#020617] scroll-smooth">
      <Head>
        <meta charSet="utf-8" />

        {/* ✅ Google AdSense Integration */}
        <meta name="google-adsense-account" content="ca-pub-8634966596493595" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8634966596493595"
          crossOrigin="anonymous"
        ></script>

        {/* ✅ Premium Typography Kit */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,700;0,800;1,800&display=swap"
          rel="stylesheet"
        />

        {/* ✅ Icons & PWA Strategy */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Mobile Experience */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="application-name" content="Pinoy Tambayan Hub" />
        <meta name="apple-mobile-web-app-title" content="Pinoy Hub" />
        
        {/* Theme & Color Scheme */}
        <meta name="theme-color" content="#020617" />
        <meta name="color-scheme" content="dark" />

        {/* Default OpenGraph (Social Sharing) */}
        <meta property="og:site_name" content="Pinoy Tambayan Hub" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/brand/og-cover.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <body className="antialiased bg-[#020617] text-slate-200 selection:bg-blue-600/30">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}