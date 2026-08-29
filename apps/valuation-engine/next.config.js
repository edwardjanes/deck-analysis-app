/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
  },
};

module.exports = nextConfig;
