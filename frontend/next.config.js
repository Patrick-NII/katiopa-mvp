/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration pour Docker et production
  output: 'standalone',
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  swcMinify: true,
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? `${process.env.BACKEND_URL || 'http://backend:4000'}/api/:path*`
          : 'http://localhost:4000/api/:path*',
      },
    ];
  },
  
  images: {
    domains: ['localhost', process.env.DOMAIN_NAME || 'katiopa.com'],
  },
};
module.exports = nextConfig;