import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This will be removed in future versions
    serverComponentsExternalPackages: ['mongoose'],
  },
  // Temporary compatibility flag
  typescript: {
    ignoreBuildErrors: true, // Use with caution
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
