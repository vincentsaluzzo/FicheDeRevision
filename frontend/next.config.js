/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'sharp', 'pdfkit', 'openai'],
  },
};

module.exports = nextConfig;