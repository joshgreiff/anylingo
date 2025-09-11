/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Handle static files
  async rewrites() {
    return [
      {
        source: '/app/:path*',
        destination: '/app/:path*'
      }
    ]
  }
}

module.exports = nextConfig
