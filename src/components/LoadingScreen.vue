<template>
  <Transition name="fade">
    <div v-if="uiState.isLoading" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#022c22] text-white">
      <!-- Fondo de Iluminación Radial -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)]"></div>

      <!-- Hojas Cayendo de Fondo (Animación Premium) -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <svg v-for="n in 6" :key="n" :class="['absolute text-accent/15 fill-current leaf-fall', `leaf-fall-${n}`]" viewBox="0 0 24 24" :style="getLeafStyle(n)">
          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.34,9.34 15.34,7C14,5.08 11.26,3.67 8,3V1C12,1 15.67,3 17,5C18.33,3 22,1 22,1V3C18.74,3.67 16,5.08 14.66,7C23.66,9.34 25.74,15.49 27.82,20.66L26.18,21.34C24.1,16.17 22,10 13,8V11H11V8H17Z" />
        </svg>
      </div>

      <div class="relative z-10 flex flex-col items-center">
        <!-- Logo con Iluminación -->
        <div class="relative w-40 h-40 mb-12 group logo-spring-in">
          <div class="absolute inset-0 bg-accent/30 rounded-full blur-3xl animate-pulse"></div>
          <div class="relative w-full h-full bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/20 flex items-center justify-center shadow-2xl overflow-hidden" :class="uiState.logo_app ? 'p-2' : 'p-6'">
            <img v-if="uiState.logo_app" :src="uiState.logo_app" class="w-full h-full object-contain">
            <span v-else class="text-7xl font-black text-accent drop-shadow-lg">A</span>
          </div>
        </div>

        <h2 class="text-4xl font-black mb-4 tracking-tighter text-center">
          Iniciando <span class="text-accent">Gestión de Arboricultura</span>
        </h2>
        
        <!-- Barra de Carga -->
        <div class="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mb-6 border border-white/5">
          <div class="h-full bg-accent shadow-[0_0_15px_#10b981] animate-[loading-bar_2s_infinite_ease-in-out]"></div>
        </div>

        <p class="text-white/50 font-bold text-xs uppercase tracking-[0.3em] flex items-center gap-3">
          <span class="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-ping"></span>
          {{ loadingMessage }}
        </p>
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
let timer = null

// Observamos isLoading para arrancar o limpiar el timer
watch(() => uiState.isLoading, (isLoading) => {
  if (isLoading) {
    loadingMessage.value = 'Cargando datos...'
    timer = setTimeout(() => {
      loadingMessage.value = 'El servidor se está despertando (esto puede tardar 30s)...'
    }, 4000)
  } else {
    if (timer) clearTimeout(timer)
  }
}, { immediate: true })

const getLeafStyle = (n) => {
  const lefts = [12, 28, 45, 62, 78, 92]
  const delays = [0, 3.5, 1.5, 5, 2.5, 6.2]
  const durations = [14, 18, 15, 20, 16, 22]
  const sizes = [28, 38, 24, 32, 20, 35]
  return {
    left: `${lefts[n - 1]}%`,
    width: `${sizes[n - 1]}px`,
    height: `${sizes[n - 1]}px`,
    animationDelay: `${delays[n - 1]}s`,
    animationDuration: `${durations[n - 1]}s`,
    top: '-40px'
  }
}

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
@keyframes loading-bar {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.logo-spring-in {
  animation: logoSpring 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes logoSpring {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* --- HOJAS CAYENDO --- */
.leaf-fall {
  position: absolute;
  opacity: 0;
  animation-name: fallAnimation;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@keyframes fallAnimation {
  0% {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.25;
  }
  90% {
    opacity: 0.25;
  }
  100% {
    transform: translateY(115vh) translateX(60px) rotate(360deg);
    opacity: 0;
  }
}
</style>
