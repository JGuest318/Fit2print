/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "galaxy-prod.tlcdn.com" },
      { protocol: "https", hostname: "cdn.galaxy.ai" },
      { protocol: "https", hostname: "g.tlcdn.com" },
    ],
  },
}
module.exports = nextConfig;
