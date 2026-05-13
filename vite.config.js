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
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'https://projecto-oficina-production.up.railway.app',
        changeOrigin: true,
      }
    }
  }
})
