// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add headers to help with WebChannel connections
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      }
    ]
  },
  
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features you need
  }
}

module.exports = nextConfig