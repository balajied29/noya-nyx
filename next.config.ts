import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [62, 75],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
};

export default nextConfig;
