<template>
  <div class="flex flex-col items-center justify-center p-8 text-center select-none animate-fade-in no-print">
    <!-- SVG Animado Premium de un Árbol con Hojas Flotantes -->
    <div class="relative w-32 h-32 mb-4">
      <svg viewBox="0 0 100 100" class="w-full h-full text-accent">
        <!-- Suelo -->
        <path d="M20,80 Q50,75 80,80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-30" />
        
        <!-- Tronco con animación de balanceo -->
        <g class="tree-trunk">
          <path d="M48,80 L48,50 Q48,45 52,40 L52,80 Z" fill="currentColor" class="opacity-40" />
          <path d="M50,80 L50,45" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
          
          <!-- Copa del árbol (Hojas principales) -->
          <circle cx="50" cy="35" r="18" fill="currentColor" class="opacity-20 tree-crown" />
          <circle cx="42" cy="30" r="12" fill="currentColor" class="opacity-30 tree-crown" />
          <circle cx="58" cy="32" r="14" fill="currentColor" class="opacity-25 tree-crown" />
          
          <!-- Ramas -->
          <path d="M50,60 Q42,52 38,55" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          <path d="M50,53 Q58,47 62,50" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </g>
        
        <!-- Hojas cayendo con animaciones independientes -->
        <path d="M48,32 Q44,28 40,30" class="falling-leaf leaf-1" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        <path d="M54,28 Q58,24 62,26" class="falling-leaf leaf-2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        <path d="M50,22 Q46,18 48,15" class="falling-leaf leaf-3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
    </div>
    
    <h3 class="text-base font-black text-main tracking-tight">{{ message }}</h3>
    <p class="text-xs text-muted mt-1 max-w-xs font-semibold">{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'No se encontraron registros'
  },
  description: {
    type: String,
    default: 'Intente ajustar los filtros de búsqueda'
  }
})
</script>

<style scoped>
@keyframes sway {
  0%, 100% { transform: rotate(0deg); transform-origin: 50px 80px; }
  50% { transform: rotate(2.5deg); transform-origin: 50px 80px; }
}

@keyframes sway-crown {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(1.5px, -0.5px); }
}

.tree-trunk {
  animation: sway 6s ease-in-out infinite;
}

.tree-crown {
  animation: sway-crown 4s ease-in-out infinite;
}

@keyframes fall-1 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { transform: translate(-15px, 45px) rotate(180deg); opacity: 0; }
}

@keyframes fall-2 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  15% { opacity: 0.8; }
  85% { opacity: 0.8; }
  100% { transform: translate(12px, 48px) rotate(-120deg); opacity: 0; }
}

@keyframes fall-3 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  20% { opacity: 0.8; }
  80% { opacity: 0.8; }
  100% { transform: translate(-5px, 50px) rotate(90deg); opacity: 0; }
}

.leaf-1 {
  animation: fall-1 5s linear infinite;
  transform-origin: 48px 32px;
}

.leaf-2 {
  animation: fall-2 6s linear infinite;
  animation-delay: 2s;
  transform-origin: 54px 28px;
}

.leaf-3 {
  animation: fall-3 7s linear infinite;
  animation-delay: 4s;
  transform-origin: 50px 22px;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
