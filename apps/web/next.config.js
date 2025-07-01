/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Temporarily disable ESLint during builds due to version conflict with ESLint v9
    // This will be re-enabled once all packages are using compatible configurations
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable modern bundling features
    esmExternals: true,
  },
  transpilePackages: ['@optimizely/tracking'],
};

module.exports = nextConfig;
