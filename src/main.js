import { createApp } from 'vue'
import { pinia } from './store/pinia.js'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
