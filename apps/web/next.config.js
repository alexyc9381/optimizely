/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during builds to use root config instead
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
