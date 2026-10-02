import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway uruchamia samodzielny serwer: node .next/standalone/server.js
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
