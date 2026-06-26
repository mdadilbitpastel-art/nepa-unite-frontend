/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  eslint: {
    // Linting runs in CI; don't block production builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
