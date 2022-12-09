/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV !== 'production',
});

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['en-US', 'es-ES'],
    defaultLocale: 'es-ES',
  },
  images: {
    domains: ['cdn.simpleicons.org', 'res.cloudinary.com'],
  },
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
