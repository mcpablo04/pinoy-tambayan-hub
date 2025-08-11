import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Allow remote station logos used on /radio
    remotePatterns: [
      { protocol: "https", hostname: "static.mytuner.mobi" },
      { protocol: "https", hostname: "static2.mytuner.mobi" },
      // Add more hosts here if you start using other logo sources:
      // { protocol: "https", hostname: "upload.wikimedia.org" },
      // { protocol: "https", hostname: "i0.wp.com" },
    ],
  },
};

export default nextConfig;
