// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* —— Google AdSense site verification (replace ID) —— */}
        <meta
          name="google-adsense-account"
          content="ca-pub-XXXXXXXXXXXXXXXX"
        />

        {/* —— Preconnect & font (keep for performance) —— */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />

        {/* —— Favicon & app icons (drop files in /public/brand) —— */}
        <link rel="icon" href="/brand/pt-hub-logo-32.png" sizes="32x32" />
        <link rel="icon" href="/brand/pt-hub-logo-64.png" sizes="64x64" />
        <link rel="apple-touch-icon" href="/brand/pt-hub-logo-180.png" />
        {/* Optional PWA manifest if you add one:
        <link rel="manifest" href="/site.webmanifest" /> */}

        {/* —— Open Graph / Twitter previews (update image path) —— */}
        <meta property="og:title" content="Pinoy Tambayan Hub" />
        <meta
          property="og:description"
          content="Tambayan vibes. OPM hits. Radio everywhere."
        />
        <meta property="og:image" content="/brand/og-cover.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Pinoy Tambayan Hub" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pinoy Tambayan Hub" />
        <meta
          name="twitter:description"
          content="Tambayan vibes. OPM hits. Radio everywhere."
        />
        <meta name="twitter:image" content="/brand/og-cover.png" />

        {/* Prefer dark color on supported UAs */}
        <meta name="color-scheme" content="dark light" />
        <meta name="theme-color" content="#0f1115" />
      </Head>

      <body className="antialiased">
        <Main />
        <NextScript />

        {/* —— Google AdSense script (replace client= ID) —— */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        ></script>
      </body>
    </Html>
  );
}
