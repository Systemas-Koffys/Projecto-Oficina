<template>
  <Transition name="fade">
    <div v-if="uiState.isLoading" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#011a12] text-white overflow-hidden">

      <!-- Fondo Aurora Suave (mismo estilo que Login) -->
      <div class="aurora-bg absolute inset-0"></div>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12)_0%,transparent_70%)]"></div>

      <div class="relative z-10 flex flex-col items-center gap-10">

        <!-- Árbol SVG con Anillo de Crecimiento (Opción B) -->
        <div class="tree-ring-container relative flex items-center justify-center" style="width:200px;height:200px;">
          
          <!-- Aura pulsante externa -->
          <div class="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse blur-xl"></div>

          <!-- Anillo de Progreso SVG -->
          <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
            <!-- Pista base del anillo -->
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(16,185,129,0.12)" stroke-width="6"/>
            <!-- Anillo animado de crecimiento -->
            <circle
              cx="100" cy="100" r="88"
              fill="none"
              stroke="#10b981"
              stroke-width="6"
              stroke-linecap="round"
              stroke-dasharray="553"
              class="ring-grow"
              style="filter: drop-shadow(0 0 8px #10b981);"
            />
          </svg>

          <!-- Puntos de brillo orbitando el anillo -->
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <circle class="orbit-dot" cx="100" cy="12" r="4" fill="#6ee7b7" style="filter: drop-shadow(0 0 6px #6ee7b7);"/>
          </svg>

          <!-- Círculo de fondo central / Contenedor del Logo -->
          <div :class="['relative z-10 w-32 h-32 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-300', 
            uiState.logo_app 
              ? 'rounded-[2rem] bg-white border-2 border-emerald-500/30 p-4' 
              : 'rounded-full bg-gradient-to-br from-emerald-900/80 to-emerald-950/90 backdrop-blur-sm border border-emerald-500/20'
          ]">

            <!-- Logo de la aplicación (si existe) -->
            <img
              v-if="uiState.logo_app"
              :src="uiState.logo_app"
              class="w-full h-full object-contain tree-sway"
              alt="Logo"
            />

            <!-- Fallback: Árbol SVG estilizado -->
            <svg v-else viewBox="0 0 64 80" class="w-16 h-16 tree-sway" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="28" y="54" width="8" height="20" rx="4" fill="#6b4226" opacity="0.9"/>
              <ellipse cx="32" cy="52" rx="20" ry="14" fill="#059669" opacity="0.9"/>
              <ellipse cx="32" cy="38" rx="15" ry="12" fill="#10b981" opacity="0.95"/>
              <ellipse cx="32" cy="26" rx="10" ry="10" fill="#34d399" />
              <ellipse cx="29" cy="22" rx="3" ry="2" fill="#a7f3d0" opacity="0.5"/>
            </svg>
          </div>
        </div>

        <!-- Textos -->
        <div class="text-center space-y-3">
          <h2 class="text-3xl font-black tracking-tighter">
            Iniciando <span class="text-emerald-400">Arboricultura</span>
          </h2>

          <!-- Mensaje dinámico con icono ping -->
          <p class="text-white/50 font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3">
            <span class="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
            {{ loadingMessage }}
          </p>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { uiState } = mainStore

const loadingMessage = ref('Cargando datos...')
const messages = [
  'Conectando con el servidor...',
  'Cargando catálogo de distritos...',
  'Verificando sesión activa...',
  'Optimizando interfaz gráfica...',
  'Inicializando base de datos...'
]
let messageIndex = 0
let messageInterval = null
let wakeupTimer = null

watch(() => uiState.isLoading, (isLoading) => {
  if (isLoading) {
    loadingMessage.value = messages[0]
    messageIndex = 1
    messageInterval = setInterval(() => {
      loadingMessage.value = messages[messageIndex % messages.length]
      messageIndex++
    }, 1500)
    wakeupTimer = setTimeout(() => {
      if (messageInterval) clearInterval(messageInterval)
      loadingMessage.value = 'El servidor se está despertando (esto puede tardar 30s)...'
    }, 5000)
  } else {
    if (messageInterval) { clearInterval(messageInterval); messageInterval = null }
    if (wakeupTimer) { clearTimeout(wakeupTimer); wakeupTimer = null }
  }
}, { immediate: true })

onUnmounted(() => {
  if (messageInterval) clearInterval(messageInterval)
  if (wakeupTimer) clearTimeout(wakeupTimer)
})
</script>

<style scoped>
/* ==============================
   FONDO AURORA (igual que Login)
   ============================== */
.aurora-bg {
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(6, 78, 59, 0.55) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 80% 70%, rgba(5, 150, 105, 0.35) 0%, transparent 55%),
    radial-gradient(ellipse 60% 40% at 50% 90%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
    #011a12;
  animation: aurora-shift 10s ease-in-out infinite alternate;
}
@keyframes aurora-shift {
  0%   { filter: hue-rotate(0deg) brightness(1); }
  50%  { filter: hue-rotate(8deg) brightness(1.08); }
  100% { filter: hue-rotate(-5deg) brightness(0.95); }
}

/* ==============================
   ANILLO DE CRECIMIENTO
   ============================== */
.ring-grow {
  animation: ring-grow-anim 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  transform-origin: center;
}
@keyframes ring-grow-anim {
  0%   { stroke-dashoffset: 553; opacity: 0.4; }
  60%  { stroke-dashoffset: 0;   opacity: 1;   }
  100% { stroke-dashoffset: -553; opacity: 0.2; }
}

/* ==============================
   PUNTO ORBITANDO
   ============================== */
.orbit-dot {
  transform-origin: 100px 100px;
  animation: orbit 2.4s linear infinite;
}
@keyframes orbit {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ==============================
   ÁRBOL MECIÉNDOSE
   ============================== */
.tree-sway {
  animation: tree-sway 3.5s ease-in-out infinite;
  transform-origin: bottom center;
}
@keyframes tree-sway {
  0%, 100% { transform: rotate(-2deg); }
  50%       { transform: rotate(2deg);  }
}

/* ==============================
   TRANSICIÓN DE ENTRADA/SALIDA
   ============================== */
.fade-enter-active, .fade-leave-active { transition: opacity 0.35s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
