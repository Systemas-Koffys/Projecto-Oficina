<template>
  <Transition name="fade">
    <div v-if="uiState.isLoading" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#022c22] text-white">
      <!-- Fondo de Iluminación Radial -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)]"></div>

      <div class="relative z-10 flex flex-col items-center">
        <!-- Logo con Iluminación -->
        <div class="relative w-40 h-40 mb-12 group">
          <div class="absolute inset-0 bg-accent/30 rounded-full blur-3xl animate-pulse"></div>
          <div class="relative w-full h-full bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/20 flex items-center justify-center shadow-2xl overflow-hidden p-6">
            <img v-if="uiState.logo_app" :src="uiState.logo_app" class="w-full h-full object-contain">
            <span v-else class="text-7xl font-black text-accent drop-shadow-lg">A</span>
          </div>
        </div>

        <h2 class="text-4xl font-black mb-4 tracking-tighter text-center">
          Iniciando <span class="text-accent">Arboricultura</span>
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
import { uiState } from '../store/data.js'

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
</style>
