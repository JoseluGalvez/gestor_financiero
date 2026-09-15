import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const SEC_USER_AGENT = 'Portafolio-Intel contact@example.com';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'],
      manifest: {
        name: 'Portafolio Intel - Análisis Fundamental',
        short_name: 'Portafolio Intel',
        description: 'Análisis fundamental de empresas con datos SEC EDGAR, DCF, ratios y calidad contable',
        theme_color: '#1a1a2e',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/data\.sec\.gov\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sec-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/www\.sec\.gov\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sec-www-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/query1\.finance\.yahoo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'yahoo-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'coingecko-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.frankfurter\.app\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'fx-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.marketstack\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'marketstack-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/.*\.exchangeratesapi\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'exchangerates-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        },
      },
      '/api/sec-data': {
        target: 'https://data.sec.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sec-data/, ''),
        headers: { 'User-Agent': SEC_USER_AGENT },
      },
      '/api/sec-www': {
        target: 'https://www.sec.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sec-www/, ''),
        headers: { 'User-Agent': SEC_USER_AGENT },
      },
    },
  },
});
