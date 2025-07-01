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
        protocol: 'http',
        hostname: 'mqutnb0hqp8s99tlf80v1v7d6s.ingress.hurricane.akash.pub',
      },
    ],
    domains: ['localhost', 'rmbg.jchalabi.xyz', 'mqutnb0hqp8s99tlf80v1v7d6s.ingress.hurricane.akash.pub'],
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://mqutnb0hqp8s99tlf80v1v7d6s.ingress.hurricane.akash.pub/:path*',
      },
    ]
  },
}

export default nextConfig;