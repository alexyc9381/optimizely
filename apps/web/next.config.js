/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // SPA mode - no SSR, no prerendering
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Ensure SWC is used for compilation
  swcMinify: true,
  experimental: {
    esmExternals: false, // Disable to avoid import issues
  },
};

module.exports = nextConfig;
