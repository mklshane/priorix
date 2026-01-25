import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15 stable config
  serverExternalPackages: ["mongoose"],

  // TEMPORARY: only while stabilizing the project
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
