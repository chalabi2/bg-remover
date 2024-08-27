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
      {
        protocol: 'https',
        hostname: 'api.jchalabi.xyz',
      },
    ],
    domains: ['localhost', 'rmbg.jchalabi.xyz', 'api.jchalabi.xyz'],
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'https://api.jchalabi.xyz/:path*',
      },
    ]
  },
}

export default nextConfig;