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
        Nuevo Evento
      </button>
    </div>

    <!-- Calendar View -->
    <div class="flex-1 p-6 md:p-8 overflow-y-auto">
      <div class="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        <FullCalendar :key="calendarKey" :options="calendarOptions" />
      </div>
    </div>

    <!-- Modal Formulario -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-[#022c22] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 class="text-2xl font-black mb-6">
          {{ currentEvent.id ? (isFeriado ? 'Editar Feriado / Festivo' : 'Editar Aniversario') : (isFeriado ? 'Nuevo Feriado / Festivo' : 'Nuevo Aniversario') }}
        </h2>
        
        <!-- Selector de Tipo de Evento (Solo al Crear) -->
        <div v-if="!currentEvent.id" class="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-xl mb-6">
          <button type="button" @click="isFeriado = false" :class="[!isFeriado ? 'bg-accent text-white' : 'text-white/50 hover:text-white', 'py-2.5 rounded-lg font-bold text-sm transition-all']">
            Aniversario Barrio
          </button>
          <button type="button" @click="isFeriado = true" :class="[isFeriado ? 'bg-accent text-white' : 'text-white/50 hover:text-white', 'py-2.5 rounded-lg font-bold text-sm transition-all']">
            Feriado / Festivo
          </button>
        </div>

        <form @submit.prevent="saveEvent" class="space-y-4">
          <!-- Campo Barrio (Solo Aniversario) -->
          <div v-if="!isFeriado">
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Barrio</label>
            <select v-model="currentEvent.nombre_barrio" required class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors appearance-none font-bold">
              <option value="" disabled>Seleccione un barrio</option>
              <option v-for="barrio in store.barrios" :key="barrio.id" :value="barrio.nombre">{{ barrio.nombre }}</option>
            </select>
          </div>

          <!-- Campo Nombre del Feriado (Solo Feriado) -->
          <div v-if="isFeriado">
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Nombre del Feriado</label>
            <input type="text" v-model="nombreFeriado" required placeholder="Ej. Corpus Christi" class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors font-bold">
          </div>

          <!-- Campo Fecha (Común) -->
          <div>
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Fecha</label>
            <input type="date" v-model="currentEvent.fecha_aniversario" required class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors [color-scheme:dark] font-bold">
          </div>

          <!-- Campos Presidente y Teléfono (Solo Aniversario) -->
          <div v-if="!isFeriado">
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Presidente del Barrio</label>
            <input type="text" v-model="currentEvent.presidente_barrio" class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors font-bold">
          </div>
          <div v-if="!isFeriado">
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Teléfono</label>
            <input type="text" v-model="currentEvent.telefono_presidente" class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors font-bold">
          </div>

          <!-- Solicitudes de Poda Asociadas (Solo Aniversario) -->
          <div v-if="!isFeriado && currentEvent.nombre_barrio" class="mt-6 pt-4 border-t border-white/10">
            <h3 class="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Solicitudes de Poda ({{ solicitudesDelBarrio.length }})</h3>
            <div v-if="solicitudesDelBarrio.length > 0" class="space-y-2 max-h-40 overflow-y-auto pr-1">
              <div v-for="sol in solicitudesDelBarrio" :key="sol.id_solicitud" class="bg-black/20 border border-white/5 rounded-xl p-3 flex justify-between items-center text-sm">
                <div>
                  <p class="font-black text-white">{{ sol.codigo_anual }}</p>
                  <p class="text-xs text-white/50">C.I: {{ sol.comunicacion_interna || 'No registrado' }}</p>
                </div>
                <span :class="[
                  sol.estado_tramite === 'Terminado' ? 'bg-emerald-500/20 text-emerald-400' :
                  sol.estado_tramite === 'En proceso' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-blue-500/20 text-blue-400',
                  'px-2.5 py-1 rounded-full text-xs font-bold'
                ]">
                  {{ sol.estado_tramite }}
                </span>
              </div>
            </div>
            <p v-else class="text-xs text-white/30 italic">No hay solicitudes de poda registradas para este barrio.</p>
          </div>
          
          <div class="flex gap-3 mt-8 pt-4 border-t border-white/10">
            <button v-if="currentEvent.id" type="button" @click="handleDelete" class="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center gap-1 shadow-lg hover:shadow-red-600/20">
              <Trash2 class="w-4 h-4" />
              Eliminar
            </button>
            <button type="button" @click="closeModal" class="flex-1 py-3 text-white/50 hover:text-white font-bold transition-colors">Cancelar</button>
            <button type="submit" class="flex-1 bg-accent hover:bg-emerald-600 text-white rounded-xl py-3 font-bold transition-all shadow-lg hover:shadow-accent/20">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tooltip Custom (Para eventos) -->
    <div v-if="tooltip.visible" class="fixed z-[200] bg-[#022c22] border border-accent/30 rounded-xl p-4 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 w-64" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: tooltip.data.color_etiqueta }"></div>
        <h3 class="font-black text-sm truncate flex-1">{{ tooltip.data.nombre_barrio }}</h3>
      </div>
      
      <!-- Si es Feriado -->
      <div v-if="tooltip.data.nombre_barrio && tooltip.data.nombre_barrio.startsWith('Feriado:')" class="mt-1">
        <span class="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Feriado Oficial</span>
      </div>
      
      <!-- Si es Aniversario -->
      <div v-else>
        <p class="text-xs text-white/70 mb-1">Pres: {{ tooltip.data.presidente_barrio || 'N/A' }}</p>
        <div class="mt-2 space-y-1">
          <p class="text-[10px] font-bold text-accent uppercase tracking-wider">Solicitudes de Poda ({{ getSolicitudesDelBarrio(tooltip.data.nombre_barrio).length }})</p>
          <div v-if="getSolicitudesDelBarrio(tooltip.data.nombre_barrio).length > 0" class="max-h-24 overflow-y-auto space-y-1 pr-0.5">
            <div v-for="sol in getSolicitudesDelBarrio(tooltip.data.nombre_barrio)" :key="sol.id_solicitud" class="text-[11px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex justify-between items-center gap-2">
              <span class="font-bold text-white/90 truncate">{{ sol.codigo_anual }}</span>
              <span class="text-white/50 text-[9px] uppercase font-semibold flex-shrink-0">{{ sol.estado_tramite }}</span>
            </div>
          </div>
          <p v-else class="text-[10px] text-white/30 italic">Sin solicitudes asociadas</p>
        </div>
      </div>
      
      <!-- Flecha del tooltip -->
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#022c22] border-b border-r border-accent/30 transform rotate-45"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, fetchCalendario, addCalendarioEvento, updateCalendarioEvento, deleteCalendarioEvento, showToast } = mainStore
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-vue-next'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

const showModal = ref(false)
const eventosBase = ref([])
const calendarKey = ref(0)
const isFeriado = ref(false)
const nombreFeriado = ref('')

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

// Mapeo de colores estáticos por distrito para aniversario
const getDistritoColor = (idDistrito) => {
  const colors = {
    1: '#f59e0b',  // Amber
    2: '#3b82f6',  // Blue
    3: '#10b981',  // Emerald
    4: '#8b5cf6',  // Violet
    5: '#ec4899',  // Pink
    6: '#f97316',  // Orange
    7: '#06b6d4',  // Cyan
    8: '#84cc16',  // Lime
    9: '#a855f7',  // Purple
    10: '#64748b', // Slate
    11: '#6366f1', // Indigo
    12: '#f43f5e', // Rose
    13: '#14b8a6'  // Teal
  }
  return colors[idDistrito] || '#10b981'
}

// Obtener solicitudes de poda asociadas a un barrio
const getSolicitudesDelBarrio = (nombreBarrio) => {
  if (!nombreBarrio || nombreBarrio.startsWith('Feriado:')) return []
  const barrioObj = store.barrios.find(b => b.nombre === nombreBarrio)
  if (!barrioObj) return []
  return store.solicitudes.filter(s => s.id_barrio === barrioObj.id)
}

const solicitudesDelBarrio = computed(() => {
  return getSolicitudesDelBarrio(currentEvent.nombre_barrio)
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
  dayCellDidMount: (arg) => {
    const dateStr = arg.date.toLocaleDateString('sv-SE'); // Formato YYYY-MM-DD local seguro
    const tieneFeriado = eventosBase.value.some(ev => {
      if (!ev.fecha_aniversario) return false;
      const evDate = new Date(ev.fecha_aniversario).toLocaleDateString('sv-SE');
      const esFeriado = ev.nombre_barrio && ev.nombre_barrio.startsWith('Feriado:');
      return evDate === dateStr && esFeriado;
    });
    if (tieneFeriado) {
      arg.el.classList.add('fc-day-feriado');
    }
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
    
    // Determinar si es feriado
    if (ev.nombre_barrio && ev.nombre_barrio.startsWith('Feriado:')) {
      isFeriado.value = true
      nombreFeriado.value = ev.nombre_barrio.replace(/^Feriado:\s*/, '')
    } else {
      isFeriado.value = false
      nombreFeriado.value = ''
    }
    
    showModal.value = true
  }
})

const loadData = async () => {
  eventosBase.value = await fetchCalendario()
  calendarOptions.events = eventosBase.value.map(ev => {
    let finalColor = ev.color_etiqueta || '#10b981'
    if (ev.nombre_barrio && ev.nombre_barrio.startsWith('Feriado:')) {
      finalColor = '#ef4444' // Rojo para feriados
    } else {
      const barrioObj = store.barrios.find(b => b.nombre === ev.nombre_barrio)
      if (barrioObj) {
        finalColor = getDistritoColor(barrioObj.id_distrito)
      }
    }
    return {
      id: ev.id,
      title: ev.nombre_barrio,
      date: new Date(ev.fecha_aniversario).toLocaleDateString('sv-SE'), // Ajuste zona horaria local seguro
      backgroundColor: finalColor,
      borderColor: 'transparent',
      extendedProps: { raw: { ...ev, color_etiqueta: finalColor } }
    }
  })
  calendarKey.value++
}

onMounted(() => {
  loadData()
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
  nombreFeriado.value = ''
  isFeriado.value = false
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveEvent = async () => {
  // Configurar campos del evento según el tipo
  if (isFeriado.value) {
    if (!nombreFeriado.value || nombreFeriado.value.trim() === '') {
      showToast('🛑 Ingrese el nombre del feriado.', 'error')
      return
    }
    currentEvent.nombre_barrio = `Feriado: ${nombreFeriado.value.trim()}`
    currentEvent.color_etiqueta = '#ef4444' // Rojo para feriado
    currentEvent.presidente_barrio = ''
    currentEvent.telefono_presidente = ''
  } else {
    if (!currentEvent.nombre_barrio) {
      showToast('🛑 Seleccione un barrio.', 'error')
      return
    }
    const barrioObj = store.barrios.find(b => b.nombre === currentEvent.nombre_barrio)
    if (barrioObj) {
      currentEvent.color_etiqueta = getDistritoColor(barrioObj.id_distrito)
    } else {
      currentEvent.color_etiqueta = '#10b981'
    }
  }

  // Validar duplicado en local
  if (!isFeriado.value && currentEvent.nombre_barrio) {
    const dup = eventosBase.value.find(ev => 
      ev.nombre_barrio && 
      ev.nombre_barrio.toLowerCase() === currentEvent.nombre_barrio.toLowerCase() && 
      ev.id != currentEvent.id
    );
    if (dup) {
      showToast(`🛑 El barrio "${currentEvent.nombre_barrio}" ya tiene un aniversario registrado.`, 'error', 5000);
      return;
    }
  }

  let res;
  if (currentEvent.id) {
    res = await updateCalendarioEvento(currentEvent.id, currentEvent)
    if (res.success) {
      showToast('Aniversario guardado con éxito')
      closeModal()
      loadData()
    } else {
      showToast(`🛑 Error al actualizar: ${res.error}`, 'error', 5000)
    }
  } else {
    res = await addCalendarioEvento(currentEvent)
    if (res.success) {
      showToast('Aniversario guardado con éxito')
      closeModal()
      loadData()
    } else {
      showToast(`🛑 Error al guardar: ${res.error}`, 'error', 5000)
    }
  }
}

const handleDelete = async () => {
  if (confirm('¿Está seguro que desea eliminar este evento?')) {
    const ok = await deleteCalendarioEvento(currentEvent.id)
    if (ok) {
      showToast('Evento eliminado correctamente')
      closeModal()
      loadData()
    } else {
      showToast('Error al eliminar el evento', 'error')
    }
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
.fc-day-feriado { background-color: #065f46 !important; } /* Verde claro distinguible para feriados */
.fc-day-sat, .fc-day-sun { background-color: #043e2f !important; } /* Verde intermedio distinguible para fines de semana */
</style>
