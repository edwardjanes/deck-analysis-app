/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
    outputFileTracingIncludes: {
      '/api/valuation/compute': ['./node_modules/@sparticuz/chromium/**/*'],
      '/api/valuation/[snapshotId]/pdf': ['./node_modules/@sparticuz/chromium/**/*'],
    },
  },
};

module.exports = nextConfig;
