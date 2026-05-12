import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      'projecto-oficina-production.up.railway.app'
    ],
    proxy: {
      '/api': {
        target: 'http://api:3000',
        changeOrigin: true,
      }
    }
  }
})
