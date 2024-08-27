/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'rmbg.jchalabi.xyz',
      },
    ],
    domains: ['localhost', 'rmbg.jchalabi.xyz'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://rmbg.jchalabi.xyz/api/:path*',
      },
    ]
  },
}

export default nextConfig;