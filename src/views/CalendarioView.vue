<template>
  <div class="h-screen flex flex-col bg-[#022c22] text-white">
    <!-- Header -->
    <div class="p-6 md:p-8 bg-black/20 border-b border-white/5 flex justify-between items-center z-10">
      <div>
        <h1 class="text-3xl font-black tracking-tight flex items-center gap-3">
          <CalendarIcon class="w-8 h-8 text-accent" />
          Calendario Festivo
        </h1>
        <p class="text-white/50 text-sm mt-1">Aniversarios de barrios y carga de trabajo asociada.</p>
      </div>
      <button v-if="uiState.user?.role !== 'USER'" @click="openModal()" class="bg-accent hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-accent/20">
        <Plus class="w-5 h-5" />
        Nuevo Aniversario
      </button>
    </div>

    <!-- Calendar View -->
    <div class="flex-1 p-6 md:p-8 overflow-y-auto">
      <div class="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        <FullCalendar :options="calendarOptions" />
      </div>
    </div>

    <!-- Modal Formulario -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-[#022c22] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 class="text-2xl font-black mb-6">{{ currentEvent.id ? 'Editar Aniversario' : 'Nuevo Aniversario' }}</h2>
        
        <form @submit.prevent="saveEvent" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Barrio</label>
            <select v-model="currentEvent.nombre_barrio" required class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors appearance-none">
              <option value="" disabled>Seleccione un barrio</option>
              <option v-for="barrio in store.barrios" :key="barrio.id" :value="barrio.nombre">{{ barrio.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Fecha del Aniversario</label>
            <input type="date" v-model="currentEvent.fecha_aniversario" required class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors [color-scheme:dark]">
          </div>
          <div>
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Presidente del Barrio</label>
            <input type="text" v-model="currentEvent.presidente_barrio" class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors">
          </div>
          <div>
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Teléfono</label>
            <input type="text" v-model="currentEvent.telefono_presidente" class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors">
          </div>
          <div>
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Color Etiqueta</label>
            <input type="color" v-model="currentEvent.color_etiqueta" class="w-full h-12 bg-black/20 border border-white/10 rounded-xl cursor-pointer">
          </div>
          
          <div class="flex gap-4 mt-8 pt-4 border-t border-white/10">
            <button type="button" @click="closeModal" class="flex-1 py-3 text-white/50 hover:text-white font-bold transition-colors">Cancelar</button>
            <button type="submit" class="flex-1 bg-accent hover:bg-emerald-600 text-white rounded-xl py-3 font-bold transition-all shadow-lg hover:shadow-accent/20">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tooltip Custom (Para eventos) -->
    <div v-if="tooltip.visible" class="fixed z-[200] bg-[#022c22] border border-accent/30 rounded-xl p-4 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 w-64" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: tooltip.data.color_etiqueta }"></div>
        <h3 class="font-black text-sm truncate">{{ tooltip.data.nombre_barrio }}</h3>
      </div>
      <p class="text-xs text-white/70 mb-1">Pres: {{ tooltip.data.presidente_barrio || 'N/A' }}</p>
      <div class="bg-accent/10 border border-accent/20 rounded-lg p-2 mt-2">
        <p class="text-[10px] font-bold text-accent uppercase tracking-wider">Total Solicitudes de Poda</p>
        <p class="text-xl font-black text-white">{{ tooltip.data.solicitudes_count }}</p>
      </div>
      <!-- Flecha del tooltip -->
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#022c22] border-b border-r border-accent/30 transform rotate-45"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, fetchCalendario, addCalendarioEvento, updateCalendarioEvento, deleteCalendarioEvento, showToast } = mainStore
import { Calendar as CalendarIcon, Plus } from 'lucide-vue-next'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

const showModal = ref(false)
const eventosBase = ref([])

const currentEvent = reactive({
  id: null,
  nombre_barrio: '',
  fecha_aniversario: '',
  presidente_barrio: '',
  telefono_presidente: '',
  color_etiqueta: '#10b981'
})

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  data: null
})

const calendarOptions = reactive({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'es',
  events: [],
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek'
  },
  eventMouseEnter: (info) => {
    tooltip.data = info.event.extendedProps.raw
    const rect = info.el.getBoundingClientRect()
    tooltip.x = rect.left + (rect.width / 2)
    tooltip.y = rect.top
    tooltip.visible = true
  },
  eventMouseLeave: () => {
    tooltip.visible = false
  },
  eventClick: (info) => {
    if (uiState.user?.role === 'USER') return
    const ev = info.event.extendedProps.raw
    currentEvent.id = ev.id
    currentEvent.nombre_barrio = ev.nombre_barrio
    currentEvent.fecha_aniversario = new Date(ev.fecha_aniversario).toISOString().split('T')[0]
    currentEvent.presidente_barrio = ev.presidente_barrio
    currentEvent.telefono_presidente = ev.telefono_presidente
    currentEvent.color_etiqueta = ev.color_etiqueta || '#10b981'
    showModal.value = true
  }
})

const loadData = async () => {
  eventosBase.value = await fetchCalendario()
  calendarOptions.events = eventosBase.value.map(ev => ({
    id: ev.id,
    title: ev.nombre_barrio,
    date: new Date(ev.fecha_aniversario).toISOString().split('T')[0], // Ajuste zona horaria simple
    backgroundColor: ev.color_etiqueta || '#10b981',
    borderColor: 'transparent',
    extendedProps: { raw: ev }
  }))
}

onMounted(() => {
  loadData()
  // Asegurarnos que los barrios están cargados para el select (usualmente ya están por el layout, pero porsiaca)
  if (!store.barrios.length && typeof window.fetchCatalogos === 'function') {
      window.fetchCatalogos()
  }
})

const openModal = () => {
  currentEvent.id = null
  currentEvent.nombre_barrio = ''
  currentEvent.fecha_aniversario = ''
  currentEvent.presidente_barrio = ''
  currentEvent.telefono_presidente = ''
  currentEvent.color_etiqueta = '#10b981'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveEvent = async () => {
  let ok = false
  if (currentEvent.id) {
    ok = await updateCalendarioEvento(currentEvent.id, currentEvent)
    if (ok) showToast('Aniversario actualizado')
  } else {
    ok = await addCalendarioEvento(currentEvent)
    if (ok) showToast('Aniversario guardado')
  }
  
  if (ok) {
    closeModal()
    loadData()
  } else {
    showToast('Error al guardar', 'error')
  }
}
</script>

<style>
/* Personalización de FullCalendar para que encaje con el tema Dark/Forest */
.fc-theme-standard .fc-scrollgrid { border-color: rgba(255,255,255,0.1); border-radius: 1rem; overflow: hidden; }
.fc-theme-standard td, .fc-theme-standard th { border-color: rgba(255,255,255,0.1); }
.fc .fc-toolbar-title { font-weight: 900; color: white; font-size: 1.5rem; }
.fc .fc-button-primary { background-color: rgba(255,255,255,0.1); border: none; font-weight: bold; border-radius: 0.5rem; text-transform: capitalize; }
.fc .fc-button-primary:hover { background-color: var(--accent); }
.fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: var(--accent); border-color: transparent; }
.fc-daygrid-day-number { color: rgba(255,255,255,0.8); font-weight: bold; padding: 8px !important; }
.fc-col-header-cell-cushion { color: rgba(255,255,255,0.5); font-weight: 800; text-transform: uppercase; padding: 12px 0 !important; font-size: 0.75rem; }
.fc-day-today { background-color: rgba(16, 185, 129, 0.05) !important; }
.fc-event { cursor: pointer; border-radius: 4px; padding: 2px 4px; font-weight: bold; font-size: 0.75rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
</style>
