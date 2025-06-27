/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: { unoptimized: true },
  typescript: {
    // Temporarily ignore type errors during build to prevent hanging
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;