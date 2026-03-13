import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
    "http://192.168.1.111:3000",
  ],
  devIndicators: false,
  images: {
    localPatterns: [
      {
        pathname: "/images/**",
        // search omitted — allows ?v=2, ?v=3, etc. for cache busting
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
