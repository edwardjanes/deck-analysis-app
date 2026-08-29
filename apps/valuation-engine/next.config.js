/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['@sparticuz/chromium-min', 'playwright-core'],
  },
};

module.exports = nextConfig;
