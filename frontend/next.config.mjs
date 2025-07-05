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
        hostname: 'backend-rmbg.jchalabi.xyz',
      },
    ],
    domains: ['localhost', 'rmbg.jchalabi.xyz', 'backend-rmbg.jchalabi.xyz'],
  },
  // Remove old rewrites - we'll use Next.js API routes instead
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/auth/:path*',
  //       destination: '/api/auth/:path*',
  //     },
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://mqutnb0hqp8s99tlf80v1v7d6s.ingress.hurricane.akash.pub/:path*',
  //     },
  //   ]
  // },
}

export default nextConfig;