/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  swcMinify: false,
  compiler: {
    reactRemoveProperties: true,
    removeConsole: true,
    styledComponents: true,
  },
};

module.exports = nextConfig;