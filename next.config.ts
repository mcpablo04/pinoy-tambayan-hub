// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Radio & Media Assets
      { protocol: "https", hostname: "static.mytuner.mobi" },
      { protocol: "https", hostname: "static2.mytuner.mobi" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "azura.loveradio.com.ph" },
      { protocol: "https", hostname: "azura.easyrock.com.ph" },
      { protocol: "http",  hostname: "ph-icecast.eradioportal.com" },
      { protocol: "https", hostname: "magic.radioca.st" },
      { protocol: "https", hostname: "hrmanila.radioca.st" },
      { protocol: "https", hostname: "stream-172.zeno.fm" },
      { protocol: "https", hostname: "a4.asurahosting.com" },

      // ✅ Google Profile Pictures (Fixes your current error)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // Some Google accounts use different numbered subdomains (lh4, lh5, etc.)
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },

      // ✅ Vercel Blob avatars
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/avatars/**",
      },

      // ✅ GitHub Avatars (Handy if you add GitHub Login later)
      { 
        protocol: "https", 
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;