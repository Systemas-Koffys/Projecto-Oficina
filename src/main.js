import { createApp } from 'vue'
import { pinia } from './store/pinia.js'
import './style.css'
import App from './App.vue'
import router from './router'
import { initGlobalImageFallback } from './utils/imageFallback.js'

// Initialize global handler for broken image fallbacks (Cloudinary 404s, etc.)
initGlobalImageFallback()

const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
