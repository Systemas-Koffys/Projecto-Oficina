<template>
  <div class="h-full flex flex-col gap-6">
    <!-- Panel de Filtros Map -->
    <div class="card p-6 flex items-center justify-between no-print">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-accent/10 rounded-2xl">
          <MapPin class="text-accent" size="24" />
        </div>
        <div>
          <h3 class="font-black text-lg">Visor Geográfico</h3>
          <p class="text-xs text-muted font-bold uppercase tracking-widest">Monitoreo territorial de solicitudes</p>
        </div>
      </div>
      
      <div class="flex gap-3">
        <!-- Selector de Capas Premium -->
        <div class="flex bg-card p-1 rounded-xl border border-border shadow-sm mr-4">
          <button 
            v-for="layer in layers" 
            :key="layer.id"
            @click="setLayer(layer.id)"
            class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all"
            :class="currentLayer === layer.id ? 'bg-accent text-white' : 'text-muted hover:bg-accent/10'"
          >
            {{ layer.name }}
          </button>
        </div>

        <div class="bg-card px-4 py-2 rounded-xl border border-border flex items-center gap-3">
          <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span class="text-xs font-black">Pendientes ({{ stats.pendientes }})</span>
        </div>
        <div class="bg-card px-4 py-2 rounded-xl border border-border flex items-center gap-3">
          <span class="w-3 h-3 rounded-full bg-green-500"></span>
          <span class="text-xs font-black">Ejecutadas ({{ stats.ejecutadas }})</span>
        </div>
      </div>
    </div>

    <!-- Contenedor del Mapa -->
    <div class="flex-1 card overflow-hidden relative border-none shadow-2xl">
      <div id="map" class="absolute inset-0 z-0"></div>
      
      <!-- Overlay de información rápida -->
      <div class="absolute bottom-6 left-6 z-[1000] bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white shadow-2xl max-w-xs">
        <p class="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Consejo Técnico</p>
        <p class="text-xs leading-relaxed opacity-80">
          Haz clic en cualquier marcador para ver los detalles. Cambia la vista del mapa para ver el terreno real.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, computed, ref } from 'vue'
import { MapPin } from 'lucide-vue-next'
import { store } from '../store/data.js'

const stats = computed(() => {
  return {
    pendientes: store.solicitudes.filter(s => s.estado_tramite !== 'Ejecutado').length,
    ejecutadas: store.solicitudes.filter(s => s.estado_tramite === 'Ejecutado').length
  }
})

let map = null
const markers = []
const currentLayer = ref('streets')

const layers = [
  { id: 'streets', name: 'Calles', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { id: 'satellite', name: 'Satélite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: 'dark', name: 'Noche', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' }
]

let activeTileLayer = null

const setLayer = (id) => {
  currentLayer.value = id
  if (activeTileLayer) {
    map.removeLayer(activeTileLayer)
  }
  const layer = layers.find(l => l.id === id)
  activeTileLayer = L.tileLayer(layer.url, {
    attribution: '&copy; OpenStreetMap / Esri'
  }).addTo(map)
}

const initMap = () => {
  if (typeof L === 'undefined') {
    setTimeout(initMap, 500)
    return
  }

  map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: true
  }).setView([-21.5355, -64.7327], 14)

  // Iniciar con la capa predeterminada
  setLayer('streets')

  L.control.zoom({ position: 'topright' }).addTo(map)

  renderMarkers()
}

const renderMarkers = () => {
  // Limpiar marcadores previos
  markers.forEach(m => map.removeLayer(m))
  
  store.solicitudes.forEach(sol => {
    // Si no tiene coordenadas, simulamos unas cerca de Tarija para la demo
    // En producción usaría sol.lat y sol.lng
    const lat = sol.lat || (-21.52 + (Math.random() * -0.03))
    const lng = sol.lng || (-64.72 + (Math.random() * -0.03))
    
    const color = sol.estado_tramite === 'Ejecutado' ? '#10b981' : '#f59e0b'
    
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    })

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
    
    const popupContent = `
      <div style="font-family: 'Outfit', sans-serif; padding: 5px;">
        <p style="margin: 0; font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase;">Trámite: ${sol.comunicacion_interna || 'S/N'}</p>
        <p style="margin: 5px 0; font-size: 14px; font-weight: 900; color: #333;">${sol.lo_solicitado || 'Sin descripción'}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 8px 0;">
        <p style="margin: 0; font-size: 11px; color: #444;"><b>📍 Ubicación:</b> ${sol.calle || 'No especificada'}</p>
        <p style="margin: 3px 0; font-size: 11px; color: #444;"><b>📞 Solicitante:</b> ${sol.solicitante_nombre || 'Anónimo'}</p>
        <span style="display: inline-block; margin-top: 8px; padding: 4px 8px; border-radius: 6px; background: ${color}20; color: ${color}; font-size: 9px; font-weight: 900; text-transform: uppercase;">
          ${sol.estado_tramite}
        </span>
      </div>
    `
    
    marker.bindPopup(popupContent)
    markers.push(marker)
  })
}

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>

<style>
.leaflet-container {
  background: #fdfdfb !important;
}

.theme-black .leaflet-container {
  background: #121212 !important;
}

.custom-div-icon {
  background: transparent;
  border: none;
}

.leaflet-popup-content-wrapper {
  border-radius: 1.5rem !important;
  box-shadow: 0 15px 30px rgba(0,0,0,0.2) !important;
  padding: 8px !important;
}

.leaflet-popup-tip {
  display: none;
}
</style>
