<template>
  <Transition name="toast">
    <div v-if="toast.visible" 
      class="fixed top-[30px] right-[30px] z-[9999] flex items-center gap-[20px] min-w-[450px] max-w-[600px] px-[30px] py-[24px] rounded-[28px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] overflow-hidden backdrop-blur-[25px] border border-white/30 text-white transition-all duration-300 ease-in-out" 
      :class="toast.type === 'success' ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 border-emerald-500/50' : 'bg-gradient-to-br from-red-900 to-red-950 border-red-500/50'"
    >
      <div 
        class="w-[56px] h-[56px] rounded-[18px] flex items-center justify-center shrink-0 shadow-[0_10px_20px_rgba(0,0,0,0.2)] text-white"
        :class="toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'"
      >
        <component :is="toast.type === 'success' ? CheckCircle : AlertCircle" size="24" color="white" />
      </div>
      <div>
        <p class="text-[14px] font-black text-white uppercase tracking-[0.2em] opacity-90">
          {{ toast.type === 'success' ? 'Éxito' : 'Atención' }}
        </p>
        <p class="text-[15px] text-white/90 font-medium leading-[1.4] mt-[4px] whitespace-pre-line">
          {{ toast.message }}
        </p>
      </div>
      <div 
        class="absolute bottom-0 left-0 h-[5px] w-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] opacity-100 animate-[shrink_3.5s_linear_forwards]"
        :class="toast.type === 'success' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'"
      ></div>
    </div>
  </Transition>
</template>

<script setup>
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { toast } = mainStore
</script>

<style scoped>
@keyframes shrink { from { width: 100%; } to { width: 0%; } }
.toast-enter-active { animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { animation: slideOut 0.3s ease-in forwards; }
@keyframes slideIn { from { transform: translateX(120%) scale(0.9); opacity: 0; } to { transform: translateX(0) scale(1); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0) scale(1); opacity: 1; } to { transform: translateX(120%) scale(0.9); opacity: 0; } }
</style>
