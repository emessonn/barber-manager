import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.gravatar.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-*', 'lucide-react'],
  },
}

export default nextConfig
