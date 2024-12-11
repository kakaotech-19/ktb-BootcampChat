/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static HTML Export 활성화
  images: {
    unoptimized: true, // Image Optimization 비활성화
  },
  reactStrictMode: true
};

module.exports = nextConfig;