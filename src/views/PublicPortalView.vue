<template>
  <div class="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col items-center">
    <!-- Top Bar Institucional -->
    <div class="w-full bg-[#064e3b] py-2 px-6 flex justify-between items-center text-[10px] font-black text-white/70 uppercase tracking-[0.2em] shadow-lg z-20">
      <span>Gobierno Autónomo Municipal de Tarija</span>
      <div class="flex gap-4">
        <span>Transparencia</span>
        <span>Atención Ciudadana</span>
      </div>
    </div>

    <div class="w-full max-w-6xl p-6 md:p-12 flex flex-col items-center">
      <!-- Header con Logos Reales -->
      <header class="w-full flex flex-col md:flex-row items-center justify-between mb-16 gap-8 animate-fade-in">
        <div class="flex items-center gap-6">
          <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl border border-gray-100 p-2 overflow-hidden">
            <img v-if="uiState.logo_institucional" :src="uiState.logo_institucional" class="w-full h-full object-contain">
            <span v-else class="text-4xl">🏛️</span>
          </div>
          <div class="h-12 w-px bg-gray-200 hidden md:block"></div>
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden" :class="uiState.logo_app ? 'bg-transparent p-0' : 'bg-accent p-2'">
              <img v-if="uiState.logo_app" :src="uiState.logo_app" class="w-full h-full object-contain">
              <Leaf v-else class="text-white" size="28" />
            </div>
            <div>
              <h1 class="text-2xl font-black tracking-tighter leading-none mb-1 text-[#064e3b]">Arboricultura Urbana</h1>
              <p class="text-[9px] font-black text-accent uppercase tracking-[0.3em]">Gestión de Espacios Verdes</p>
            </div>
          </div>
        </div>
        
        <div class="flex gap-4">
          <router-link to="/login" class="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
            Acceso Personal
          </router-link>
        </div>
      </header>

      <!-- Grid Principal -->
      <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <!-- Columna de Información (Tarija) -->
        <div class="lg:col-span-5 space-y-10">
          <div class="space-y-6">
            <div class="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-widest">
              Tarija para Siempre
            </div>
            <h2 class="text-6xl font-black leading-[1] tracking-tighter text-[#064e3b]">
              Cuidamos el pulmón de <span class="text-accent underline decoration-4 underline-offset-8">nuestra ciudad.</span>
            </h2>
            <p class="text-lg text-gray-500 font-medium leading-relaxed max-w-md">
              A través de este portal, los vecinos de Tarija pueden reportar necesidades de poda, tala o árboles en riesgo directamente a la Dirección de Obras Públicas.
            </p>
          </div>

          <!-- Tarjetas Informativas Locales -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex gap-5 items-start transition-transform hover:scale-[1.02]">
              <div class="w-12 h-12 shrink-0 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Clock size="24" />
              </div>
              <div>
                <h4 class="font-black text-sm text-gray-800">Atención 24/7</h4>
                <p class="text-xs text-gray-500 font-medium mt-1">Recibimos tus solicitudes en cualquier momento del día.</p>
              </div>
            </div>

            <div class="bg-[#064e3b] p-6 rounded-[2rem] text-white shadow-2xl flex gap-5 items-start relative overflow-hidden group">
              <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck size="120" />
              </div>
              <div class="w-12 h-12 shrink-0 bg-white/10 text-accent rounded-2xl flex items-center justify-center">
                <MapPin size="24" />
              </div>
              <div class="relative z-10">
                <h4 class="font-black text-sm">Cobertura Total</h4>
                <p class="text-xs text-white/70 font-medium mt-1">Llegamos a todos los distritos y barrios de la ciudad de Tarija.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna del Formulario -->
        <div class="lg:col-span-7">
          <div v-if="!submitted" class="bg-white rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden animate-slide-up">
            <div class="p-8 md:p-12 space-y-10">
              
              <div class="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div class="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                  <ClipboardList size="24" />
                </div>
                <div>
                  <h3 class="text-xl font-black text-gray-800">Nueva Solicitud</h3>
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completa los campos para iniciar el trámite</p>
                </div>
              </div>

              <!-- Formulario Mejorado -->
              <div class="space-y-8">
                <!-- Contacto -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nombre del Solicitante</label>
                    <input v-model="form.solicitante_nombre" type="text" placeholder="Ej: Juan Pérez" class="portal-input">
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Celular de Contacto</label>
                    <input v-model="form.solicitante_telefono" type="tel" placeholder="Ej: 71234567" class="portal-input">
                  </div>
                </div>

                <!-- Ubicación -->
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Ubicación (Calle/Barrio)</label>
                  <input v-model="form.calle" type="text" placeholder="Ej: Calle Bolívar esq. Sucre" class="portal-input mb-4">
                  <div class="relative rounded-[2rem] overflow-hidden border-4 border-gray-50 shadow-inner group">
                    <div id="mini-map" class="h-64 w-full z-0"></div>
                    <div class="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-accent border border-accent/20">
                      Modo Mapa Activo
                    </div>
                  </div>
                </div>

                <!-- Detalles -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Tipo de Acción</label>
                    <select v-model="form.id_accion_solicitada" class="portal-input">
                      <option value="" disabled>Seleccionar...</option>
                      <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Referencia / Observación</label>
                    <input v-model="form.solicitante_descripcion" type="text" placeholder="Ej: Frente a la farmacia" class="portal-input">
                  </div>
                </div>

                <button @click="submitPortal" :disabled="loading" class="w-full py-6 bg-accent hover:bg-[#064e3b] text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-green-900/20 transition-all transform active:scale-[0.98] disabled:opacity-50">
                  <span v-if="loading" class="flex items-center justify-center gap-3">
                    <div class="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Procesando...
                  </span>
                  <span v-else class="flex items-center justify-center gap-3">
                    <Send size="20" />
                    Enviar Solicitud Municipal
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Éxito Mejorado -->
          <div v-else class="bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 p-12 text-center space-y-10 animate-fade-in">
            <div class="relative inline-block">
              <div class="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse"></div>
              <div class="relative w-28 h-28 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl">
                <CheckCircle size="56" />
              </div>
            </div>
            
            <div class="space-y-4">
              <h3 class="text-4xl font-black tracking-tighter text-[#064e3b]">¡Solicitud Recibida!</h3>
              <p class="text-gray-500 font-medium px-8">Tu trámite ha sido ingresado al sistema de la Municipalidad de Tarija con éxito.</p>
            </div>
            
            <div class="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200">
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">Tu Código de Seguimiento</p>
              <p class="text-5xl font-black tracking-widest text-accent drop-shadow-sm">{{ ticketId }}</p>
            </div>

            <button @click="resetForm" class="w-full py-5 bg-[#064e3b] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all">
              Registrar Nueva Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="w-full mt-auto py-12 px-6 bg-white border-t border-gray-100 text-center space-y-4">
      <div class="flex justify-center gap-8 mb-4">
        <img v-if="uiState.logo_institucional" :src="uiState.logo_institucional" class="h-10 opacity-30 grayscale hover:grayscale-0 transition-all">
        <img v-if="uiState.logo_app" :src="uiState.logo_app" class="h-10 opacity-30 grayscale hover:grayscale-0 transition-all">
      </div>
      <p class="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
        © 2026 Gobierno Autónomo Municipal de Tarija • Dirección de Obras Públicas
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { Leaf, Info, User, Phone, MapPin, Send, CheckCircle, Clock, ShieldCheck, ClipboardList } from 'lucide-vue-next'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, addSolicitud, uiState } = mainStore

// El resto de la lógica (script) se mantiene igual...
const submitted = ref(false)
const loading = ref(false)
const ticketId = ref('')

const form = reactive({
  solicitante_nombre: '',
  solicitante_telefono: '',
  calle: '',
  id_accion_solicitada: '',
  solicitante_descripcion: '',
  lat: -21.5355,
  lng: -64.7327,
  fecha_ingreso: new Date().toISOString().split('T')[0],
  estado_tramite: 'Pendiente'
})

let map = null
let marker = null

const initMap = () => {
  if (typeof L === 'undefined') {
    setTimeout(initMap, 500)
    return
  }

  map = L.map('mini-map', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([form.lat, form.lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map)

  const customIcon = L.divIcon({
    className: 'portal-marker',
    html: '<div style="background-color: #10b981; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 20px rgba(16,185,129,0.6);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  })

  marker = L.marker([form.lat, form.lng], { icon: customIcon }).addTo(map)

  map.on('move', () => {
    const center = map.getCenter()
    marker.setLatLng(center)
    form.lat = center.lat
    form.lng = center.lng
  })
}

const submitPortal = async () => {
  if (!form.solicitante_nombre || !form.solicitante_telefono || !form.id_accion_solicitada) {
    alert("Por favor completa los campos obligatorios")
    return
  }

  loading.value = true
  await new Promise(r => setTimeout(r, 1500))

  const res = await addSolicitud({ ...form })
  if (res.success) {
    ticketId.value = res.codigo_anual ? `SOL-${res.codigo_anual}` : `SOL-${Math.floor(1000 + Math.random() * 9000)}`
    submitted.value = true
  }
  loading.value = false
}

const resetForm = () => {
  Object.assign(form, {
    solicitante_nombre: '',
    solicitante_telefono: '',
    calle: '',
    id_accion_solicitada: '',
    solicitante_descripcion: ''
  })
  submitted.value = false
  setTimeout(initMap, 100)
}

onMounted(() => {
  initMap()
})
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.8s ease-out; }
.animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.portal-input {
  width: 100%;
  background-color: #f8fafc !important;
  border: 2px solid #f1f5f9 !important;
  border-radius: 1.5rem !important;
  padding: 1rem 1.5rem !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  color: #1e293b !important;
  transition: all 0.2s ease !important;
}

.portal-input:focus {
  border-color: #10b981 !important;
  background-color: #fff !important;
  box-shadow: 0 10px 25px -5px rgba(16,185,129,0.1) !important;
  outline: none;
}

/* Estilo para los Popups de Leaflet dentro del portal */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 1rem !important;
  font-family: 'Outfit', sans-serif !important;
}
</style>
