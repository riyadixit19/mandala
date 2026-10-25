/** @type {import('next').NextConfig} */
let withPWA = (config) => config;

try {
  const nextPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    // Disable PWA in development to avoid the warning
    disable: process.env.NODE_ENV === 'development',
    // These build files can't be fetched by the browser; precaching them makes the
    // service worker fail to install with the App Router.
    buildExcludes: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
  });
  withPWA = nextPWA;
} catch (e) {
  console.warn('next-pwa not installed, skipping PWA setup');
}

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Optional: reduce webpack warnings in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = 'cheap-module-source-map';
    }
    return config;
  },
});