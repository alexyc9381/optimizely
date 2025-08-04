/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Docker deployment
  trailingSlash: false,
  eslint: {
    // Temporarily disable ESLint during builds due to version conflict with ESLint v9
    // This will be re-enabled once all packages are using compatible configurations
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable modern bundling features
    esmExternals: true,
  },
  // transpilePackages removed for standalone deployment
  // Disable all static optimization for Railway deployment
  unstable_runtimeJS: true,
  generateBuildId: async () => {
    return 'railway-build'
  },
  // Skip pre-rendering and make it SPA-only
  typescript: {
    ignoreBuildErrors: true
  },
  distDir: '.next',
  // Force all pages to be server-side rendered (no static generation)
  async exportPathMap() {
    return {}; // Empty object completely disables static export
  }
};

module.exports = nextConfig;
