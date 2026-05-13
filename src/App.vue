<template>
  <div v-if="uiState.user" :class="['flex h-screen overflow-hidden app-container', `theme-${uiState.theme}`]">
    <Sidebar class="print:hidden" />
    
    <div class="flex-1 flex flex-col min-w-0 bg-main overflow-hidden">
      <!-- Header Dinámico -->
      <header class="header-bar print:hidden">
        <div class="breadcrumb">
          Admin Portal > <span class="text-accent">{{ routeName }}</span>
        </div>
        <div class="flex justify-between items-end mt-1">
          <div>
            <h1 class="page-title">{{ routeTitle }}</h1>
            <p class="page-subtitle">{{ routeSubtitle }}</p>
          </div>
          
          <!-- Selector de Temas Premium v2.0 -->
          <div class="relative flex bg-card p-1.5 rounded-2xl border border-border/60 shadow-inner overflow-hidden group">
            <!-- Fondo deslizante dinámico -->
            <div 
              class="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-accent shadow-lg shadow-accent/20 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              :style="{
                width: '40px',
                transform: `translateX(${uiState.theme === 'white' ? 0 : uiState.theme === 'black' ? 44 : 88}px)`
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
              class="relative z-10 w-10 h-10 flex items-center justify-center transition-all duration-300"
              :title="`Modo ${t.id}`"
            >
              <component 
                :is="t.icon" 
                size="18" 
                :class="[
                  'transition-all duration-300',
                  uiState.theme === t.id ? 'text-white scale-110' : 'text-muted group-hover:text-accent opacity-60'
                ]"
              />
            </button>
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
    
    <!-- Notificaciones Premium v4.0 (FORZADO) -->
    <Transition name="toast">
      <div v-if="toast.visible" 
        class="toast-wrapper" 
        :style="{
          position: 'fixed', top: '30px', right: '30px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '20px',
          minWidth: '450px', maxWidth: '600px', padding: '24px 30px', borderRadius: '28px',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.4)', overflow: 'hidden',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          background: toast.type === 'success' 
            ? 'linear-gradient(135deg, #064e3b, #022c22)' 
            : 'linear-gradient(135deg, #7f1d1d, #450a0a)',
          color: 'white'
        }"
      >
        <div class="toast-icon" :style="{
          width: '56px', height: '56px', borderRadius: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          background: toast.type === 'success' ? '#10b981' : '#ef4444'
        }">
          <component :is="toast.type === 'success' ? CheckCircle : AlertCircle" size="24" color="white" />
        </div>
        <div>
          <p class="toast-title" :style="{ fontSize: '14px', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.9 }">
            {{ toast.type === 'success' ? 'Éxito' : 'Atención' }}
          </p>
          <p class="toast-msg" :style="{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500', lineHeight: '1.4', marginTop: '4px', whiteSpace: 'pre-line' }">
            {{ toast.message }}
          </p>
        </div>
        <div class="toast-bar" :style="{ position: 'absolute', bottom: 0, left: 0, height: '5px', width: '100%', background: '#10b981', opacity: 1, boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)' }"></div>
      </div>
    </Transition>
  </div>
  <LoginView v-else />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { CheckCircle, AlertCircle, Sun, Moon, Palette } from 'lucide-vue-next'
import Sidebar from './components/Sidebar.vue'
import LoginView from './views/LoginView.vue'
import SolicitudModal from './components/SolicitudModal.vue'
import { uiState, toast, fetchCatalogos, fetchSolicitudes } from './store/data.js'

const route = useRoute()

onMounted(async () => {
    const savedTheme = localStorage.getItem('theme') || 'white'
    uiState.theme = savedTheme
    
    // Carga inicial en paralelo para máxima velocidad
    Promise.allSettled([
        fetchCatalogos(),
        fetchSolicitudes()
    ]).then(() => {
        console.log("Carga inicial completa");
    })
})

const setTheme = (t) => {
    uiState.theme = t
    localStorage.setItem('theme', t)
}

const routeName = computed(() => {
    const map = {
        dashboard: "Dashboard",
        solicitudes: "Gestión",
        personal: "Personal",
        usuarios: "Usuarios",
        configuraciones: "Configuración",
        acerca: "Información"
    }
    return map[route.name] || 'Inicio'
})

const routeTitle = computed(() => {
    const map = {
        dashboard: "Panel de Control",
        solicitudes: "Gestión de Solicitudes",
        personal: "Directorio de Personal",
        usuarios: "Administración de Usuarios",
        configuraciones: "Ajustes del Sistema",
        acerca: "Información Institucional"
    }
    return map[route.name] || 'Bienvenido'
})

const routeSubtitle = computed(() => {
    const map = {
        dashboard: "Resumen operativo del sistema y solicitudes en tiempo real",
        solicitudes: "Listado completo y administración de órdenes de trabajo",
        personal: "Gestión de fichas técnicas, cargos y contratos",
        usuarios: "Control de acceso y perfiles de usuario",
        configuraciones: "Parámetros globales y personalización",
        acerca: "Detalles del sistema y políticas de privacidad"
    }
    return map[route.name] || ''
})
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.toast-wrapper {
  position: fixed; top: 30px; right: 30px; z-index: 9999;
  display: flex; align-items: center; gap: 20px;
  min-width: 450px; max-width: 600px; padding: 24px 30px; border-radius: 28px;
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.4); overflow: hidden;
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.toast-success { 
  background: linear-gradient(135deg, #064e3b, #022c22) !important;
  border-color: rgba(16, 185, 129, 0.5) !important;
  color: white !important;
}

.toast-error { 
  background: linear-gradient(135deg, #7f1d1d, #450a0a) !important;
  border-color: rgba(239, 68, 68, 0.5) !important;
  color: white !important;
}

.toast-icon {
  width: 56px; height: 56px; border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.toast-success .toast-icon { background: #10b981; color: white; }
.toast-error .toast-icon { background: #ef4444; color: white; }

.toast-title { font-size: 14px; font-weight: 900; color: white; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.9; }
.toast-msg { font-size: 15px; color: rgba(255, 255, 255, 0.9); font-weight: 500; line-height: 1.4; margin-top: 4px; }
.toast-bar { position: absolute; bottom: 0; left: 0; height: 5px; width: 100%; background: white; opacity: 0.3; animation: shrink 3.5s linear forwards; }

@keyframes shrink { from { width: 100%; } to { width: 0%; } }
.toast-enter-active { animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { animation: slideOut 0.3s ease-in forwards; }
@keyframes slideIn { from { transform: translateX(120%) scale(0.9); opacity: 0; } to { transform: translateX(0) scale(1); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0) scale(1); opacity: 1; } to { transform: translateX(120%) scale(0.9); opacity: 0; } }
</style>
