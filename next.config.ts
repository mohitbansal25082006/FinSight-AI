/** @type {import('next').NextConfig} */
const nextConfig = {
  // Updated turbo configuration to new format
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'static.finnhub.io',
      'cdn.finnhub.io',
    ],
  },
  // Moved API configuration to the correct location
  serverRuntimeConfig: {
    // Will only be available on the server side
    api: {
      bodyParser: {
        sizeLimit: '1mb',
      },
      responseLimit: '8mb',
    },
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
}

module.exports = nextConfig