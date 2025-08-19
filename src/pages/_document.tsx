// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google AdSense site verification (replace with your meta code from AdSense dashboard) */}
        <meta
          name="google-adsense-account"
          content="ca-pub-XXXXXXXXXXXXXXXX" 
        />

        {/* Optional: preload fonts for speed */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />

        {/* Google AdSense script (async) */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        ></script>
      </body>
    </Html>
  );
}
