import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable image optimization for external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile pictures
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com', // LinkedIn profile pictures
      },
    ],
  },

  // Strict mode for better development
  reactStrictMode: true,

  // Output standalone for better Netlify compatibility
  output: 'standalone',
};

export default nextConfig;
