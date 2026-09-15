import { defineConfig } from 'workbox-cli';

export default defineConfig({
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{js,html,css,png,svg,woff2,ico,json}',
  ],
  swDest: 'dist/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/data\.sec\.gov\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'sec-api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/www\.sec\.gov\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'sec-www-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/query1\.finance\.yahoo\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'yahoo-api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'coingecko-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.frankfurter\.app\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'fx-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.marketstack\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'marketstack-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/.*\.exchangeratesapi\.io\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'exchangerates-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
  // Don't precache the index.html to always serve fresh
  dontCacheBustURLsMatching: /\.\w{8}\./,
  cleanupOutdatedCaches: true,
});