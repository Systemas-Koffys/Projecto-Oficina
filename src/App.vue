<template>
  <!-- Rutas Públicas (Sin Sidebar) -->
  <div v-if="$route.meta.public" :class="['min-h-screen app-container', `theme-${uiState.theme}`]">
    <router-view />
  </div>

  <!-- Sistema Privado (Con Sidebar) -->
  <div v-else-if="uiState.user" :class="['flex flex-col md:flex-row h-screen overflow-hidden app-container', `theme-${uiState.theme}`]">
    <Sidebar class="print:hidden" />
    
    <div class="flex-1 flex flex-col min-w-0 bg-app-main overflow-hidden">
      <!-- Header Dinámico -->
      <header class="header-bar print:hidden">
        <div class="breadcrumb">
          Admin Portal > <span class="text-accent">{{ routeName }}</span>
        </div>
        <div class="flex flex-col md:flex-row md:justify-between md:items-end mt-1 gap-4 md:gap-0">
          <div>
            <h1 class="page-title">{{ routeTitle }}</h1>
            <p class="page-subtitle">{{ routeSubtitle }}</p>
          </div>
          
          <div class="flex items-center gap-3 self-end md:self-auto">
            <!-- Reloj y Calendario Digital Premium -->
            <div class="flex items-center h-[52px] bg-card px-4 rounded-2xl border border-border/80 shadow-sm hover:border-accent/40 hover:shadow-md transition-all duration-300 select-none group/clock">
              <!-- Fecha -->
              <div class="flex items-center gap-2 pr-3 border-r border-border/80">
                <Calendar size="16" class="text-accent transition-all duration-300 group-hover/clock:scale-110 group-hover/clock:rotate-6" />
                <span class="text-xs font-semibold text-main whitespace-nowrap tracking-wide uppercase">{{ fechaActual }}</span>
              </div>
              
              <!-- Hora -->
              <div class="flex items-center gap-2 pl-3">
                <Clock size="16" class="text-accent transition-all duration-300 group-hover/clock:rotate-12" />
                <span class="font-mono text-xs font-bold text-main whitespace-nowrap tracking-widest">{{ horaActual }}</span>
              </div>
            </div>

            <!-- Selector de Temas Premium v2.0 -->
            <div class="relative flex bg-card p-1.5 rounded-2xl border border-border/60 shadow-inner overflow-hidden group">
              <!-- Fondo deslizante dinámico -->
              <div 
                class="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-accent shadow-lg shadow-accent/20 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                :style="{
                  width: '40px',
                  transform: `translateX(${uiState.theme === 'white' ? 0 : uiState.theme === 'black' ? 40 : 80}px)`
                }"
              ></div>

              <button 
                v-for="t in [
                  { id: 'white', icon: Sun }, 
                  { id: 'black', icon: Moon }, 
                  { id: 'colors', icon: Palette }
                ]" 
                :key="t.id"
                @click="setTheme(t.id)"
                class="relative z-10 w-10 h-10 flex items-center justify-center transition-all duration-300 cursor-pointer"
                :title="`Modo ${t.id}`"
              >
                <component 
                  :is="t.icon" 
                  size="18" 
                  :class="[
                    'transition-all duration-300',
                    uiState.theme === t.id ? 'text-[color:var(--text-on-accent)] scale-110 font-bold' : 'text-muted group-hover:text-accent opacity-60'
                  ]"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Área de Contenido Principal -->
      <main class="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div class="max-w-[1600px] mx-auto h-full">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- Modales y Notificaciones -->
    <SolicitudModal v-if="uiState.showModal" @close="uiState.showModal = false" />
    
    <LoadingScreen />
  </div>
  <LoginView v-else />

  <!-- Notificaciones Globales (Permite mostrar popups en la pantalla de Login) -->
  <ToastNotification />
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Sun, Moon, Palette, Calendar, Clock } from 'lucide-vue-next'
import Sidebar from './components/Sidebar.vue'
import LoginView from './views/LoginView.vue'
import SolicitudModal from './components/SolicitudModal.vue'
import ToastNotification from './components/ToastNotification.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import { useMainStore } from './store/mainStore.js'
const mainStore = useMainStore()
const { uiState, fetchCatalogos } = mainStore

const route = useRoute()

const fechaActual = ref('')
const horaActual = ref('')
let intervalId = null

const actualizarReloj = () => {
    const ahora = new Date()
    
    // Fecha formato: "Viernes, 5 de junio"
    const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' }
    const rawFecha = ahora.toLocaleDateString('es-ES', opcionesFecha)
    fechaActual.value = rawFecha.charAt(0).toUpperCase() + rawFecha.slice(1)
    
    horaActual.value = ahora.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    })
}

onMounted(async () => {
    const savedTheme = localStorage.getItem('theme') || 'white'
    uiState.theme = savedTheme
    
    actualizarReloj()
    intervalId = setInterval(actualizarReloj, 1000)
    
    await fetchCatalogos()
})

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
})

const setTheme = (t) => {
    uiState.theme = t
    localStorage.setItem('theme', t)
}

const routeName = computed(() => {
    const map = {
        dashboard: "Dashboard",
        solicitudes: "Gestión",
        mapa: "Georeferenciación",
        personal: "Personal",
        usuarios: "Usuarios",
        configuraciones: "Configuración",
        inventario: "Inventario",
        acerca: "Información"
    }
    return map[route.name] || 'Inicio'
})

const routeTitle = computed(() => {
    const map = {
        dashboard: "Panel de Control",
        solicitudes: "Gestión de Solicitudes",
        mapa: "Mapa de Solicitudes",
        personal: "Directorio de Personal",
        usuarios: "Administración de Usuarios",
        configuraciones: "Ajustes del Sistema",
        inventario: "Control de Herramientas e Inventario",
        acerca: "Información Institucional"
    }
    return map[route.name] || 'Bienvenido'
})

const routeSubtitle = computed(() => {
    const map = {
        dashboard: "Resumen operativo del sistema y solicitudes en tiempo real",
        solicitudes: "Listado completo y administración de órdenes de trabajo",
        mapa: "Ubicación geográfica de las solicitudes de poda y tala",
        personal: "Gestión de fichas técnicas, cargos y contratos",
        usuarios: "Control de acceso y perfiles de usuario",
        configuraciones: "Parámetros globales y personalización",
        inventario: "Control y seguimiento de activos codificados, consumibles y devolución de repuestos",
        acerca: "Detalles del sistema y políticas de privacidad"
    }
    return map[route.name] || ''
})
</script>

<style>
/* Los estilos de Toast y LoadingScreen han sido extraidos a sus componentes respectivos */
</style>
