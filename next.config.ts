// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      // existing allowlist
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

      // ✅ Vercel Blob avatars (project-specific subdomain)
      // Matches: {project-id}.public.blob.vercel-storage.com/avatars/...
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/avatars/**",
      },
      // (optional) Google photos/common CDN sources you might use later:
      // { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
