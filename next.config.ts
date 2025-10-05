import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
  experimental: {
    // ensure R3F runs only on client
    reactCompiler: false,
  },
};

export default nextConfig;
