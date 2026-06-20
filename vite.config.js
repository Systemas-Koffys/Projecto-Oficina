import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/unpkg\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unpkg-libs',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Sistema de Gestión de Arboricultura Tarija',
        short_name: 'Arboricultura Tarija',
        description: 'Gestión y control de espacios verdes y arbolado urbano del G.A.M.T.',
        theme_color: '#064e3b',
        background_color: '#fdfdfb',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'logo-dopm.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  resolve: {
    dedupe: ['vue', 'pinia']
  },
  server: {
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**', '**/respaldo_db.sql', '**/respaldo_sistema.zip'],
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:3001',
        changeOrigin: true,
      }
    },
    fs: {
      strict: false,
    }
  }
})
