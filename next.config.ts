import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true }, // ← allow build to pass on ESLint errors
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.mytuner.mobi" },
      { protocol: "https", hostname: "static2.mytuner.mobi" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "azura.loveradio.com.ph" },
      { protocol: "https", hostname: "azura.easyrock.com.ph" },
      { protocol: "http", hostname: "ph-icecast.eradioportal.com" },
      { protocol: "https", hostname: "magic.radioca.st" },
      { protocol: "https", hostname: "hrmanila.radioca.st" },
      { protocol: "https", hostname: "stream-172.zeno.fm" },
      { protocol: "https", hostname: "a4.asurahosting.com" },
    ],
  },
};

export default nextConfig;
