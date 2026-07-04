<template>
    <div class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
        <div class="bg-card-main border border-main rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden flex flex-col border border-white/20 animate-prime-in">
            
            <!-- Header Institucional -->
            <div class="px-8 py-6 modal-header-gradient flex justify-between items-center shadow-lg border-b border-black/10 shrink-0">
                <div>
                    <h3 class="font-black text-xl tracking-tight leading-none">{{ uiState.editData ? 'Editar Expediente Técnico' : 'Nueva Solicitud de Servicio' }}</h3>
                    <!-- Lógica de Sincronización v2.1 Activa -->
                    <p class="text-[10px] opacity-80 font-bold uppercase tracking-[0.3em] mt-2">Gestión de Arboricultura Municipal</p>
                </div>
                <button type="button" @click="cerrar" class="hover:bg-white/10 p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer text-[inherit]">
                    <X class="w-6 h-6" />
                </button>
            </div>

            <!-- Cuerpo del Formulario -->
            <form @submit.prevent="handleGuardar" id="solicitudForm" class="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar bg-card-main text-main">
                
                <!-- SECCIÓN 01: IDENTIFICACIÓN -->
                <div class="p-6 bg-blue-50 border border-blue-100 border-l-[6px] border-l-blue-500 rounded-xl shadow-sm">
                    <h4 class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Info class="w-4 h-4 text-blue-500" /> 01. Información de Ingreso
                    </h4>
                    <div class="grid grid-cols-3 gap-6">
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Fecha de Ingreso <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.fecha_ingreso" type="date" class="form-input-prime">
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Cód. Comunicación <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.comunicacion_interna" @input="formatComunicacionInterna" type="text" class="form-input-prime text-center" placeholder="00/26">
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Teléfono <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.solicitante_telefono" type="text" class="form-input-prime" placeholder="Ej: 77000000">
                        </div>
                        <div class="col-span-3 flex flex-col">
                            <label class="label-prime">Nombre del Solicitante <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.solicitante_nombre" @input="cap($event, 'solicitante_nombre')" type="text" class="form-input-prime" placeholder="Ej: Juan Pérez Ramos">
                        </div>
                        
                        <!-- Lógica de Instituciones -->
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Tipo de Institución</label>
                            <select v-model="form.id_tipo_institucion" class="form-input-prime">
                                <option :value="null">-- Particular --</option>
                                <option v-for="t in store.tipos_institucion" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                            </select>
                        </div>
                        <div class="col-span-2 flex flex-col">
                            <label class="label-prime">Nombre Institución</label>
                            <select v-model="form.id_nombre_institucional" class="form-input-prime">
                                <option :value="null">-- Seleccione --</option>
                                <option v-for="i in institucionesFiltradas" :key="i.id" :value="i.id">{{ i.nombre }}</option>
                            </select>
                        </div>

                        <div class="col-span-3 flex flex-col">
                            <label class="label-prime">Notas de Solicitud / Descripción Extra</label>
                            <textarea v-model="form.solicitante_descripcion" @input="capFirst($event, form, 'solicitante_descripcion')" rows="2" class="form-input-prime resize-none" placeholder="Ej: Atender solo por la mañana o esta dañando mi pared..."></textarea>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 02: LOCALIZACIÓN -->
                <div class="p-6 bg-emerald-50 border border-emerald-100 border-l-[6px] border-l-emerald-500 rounded-xl shadow-sm">
                    <h4 class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <MapPin class="w-4 h-4 text-emerald-500" /> 02. Localización y Referencia
                    </h4>
                    <div class="grid grid-cols-4 gap-6">
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Distrito <span class="text-red-500 font-black">*</span></label>
                            <select v-model="distritoSeleccionado" class="form-input-prime font-bold">
                                <option :value="null">-- Dist --</option>
                                <option v-for="d in store.distritos" :key="d.id" :value="d.id">{{ d.nombre }}</option>
                            </select>
                        </div>
                        <div class="col-span-3 flex flex-col">
                            <label class="label-prime">Barrio / Zona <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.id_barrio" class="form-input-prime font-bold">
                                <option :value="null">-- Seleccione Barrio --</option>
                                <option v-for="b in barriosFiltrados" :key="b.id" :value="b.id">{{ b.nombre }}</option>
                            </select>
                        </div>
                        <div class="col-span-3 flex flex-col">
                            <label class="label-prime">Calle / Avenida <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.calle" @input="cap($event, 'calle')" type="text" class="form-input-prime" placeholder="Ej: Av. Las Américas o Calle Colón">
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Nº Casa</label>
                            <input v-model="form.numero_casa" type="text" class="form-input-prime text-center" placeholder="Ej: 148 o S/N">
                        </div>
                        <div class="col-span-4 flex flex-col">
                            <label class="label-prime">Punto de Referencia Exacto</label>
                            <input v-model="form.referencia" @input="cap($event, 'referencia')" type="text" class="form-input-prime" placeholder="Ej: Al frente de la iglesia, portón blanco">
                        </div>

                        <!-- Geolocalización y Mapa Mezclado -->
                        <div class="col-span-4 border-t border-sec pt-4 flex flex-col gap-4">
                            <label class="label-prime text-emerald-800 dark:text-emerald-400 font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                                <MapPin class="w-4 h-4" /> Ubicación Geográfica del Árbol (GPS)
                            </label>
                            
                            <!-- Contenedor del Mapa Leaflet -->
                            <div class="relative w-full h-56 rounded-2xl border-2 border-sec shadow-sm overflow-hidden z-10">
                                <div id="modal-map" class="absolute inset-0"></div>
                            </div>
                            
                            <!-- Campos de Coordenadas Manuales y Parser de Enlaces -->
                            <div class="grid grid-cols-3 gap-4">
                                <div class="col-span-1 flex flex-col">
                                    <label class="label-prime">Latitud</label>
                                    <input v-model="form.lat" @input="handleManualCoordsChange" type="number" step="any" class="form-input-prime" placeholder="-21.5355">
                                </div>
                                <div class="col-span-1 flex flex-col">
                                    <label class="label-prime">Longitud</label>
                                    <input v-model="form.lng" @input="handleManualCoordsChange" type="number" step="any" class="form-input-prime" placeholder="-64.7327">
                                </div>
                                <div class="col-span-1 flex flex-col">
                                    <label class="label-prime">Pegar Enlace Google Maps</label>
                                    <input v-model="gpsLink" @input="handleGpsLinkInput" type="text" class="form-input-prime" placeholder="Ej: https://maps.app.goo.gl/...">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 03: DIAGNÓSTICO TÉCNICO Y ÁRBOLES -->
                <div class="p-6 bg-amber-50 border border-amber-100 border-l-[6px] border-l-amber-500 rounded-xl shadow-sm space-y-6">
                    <h4 class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity class="w-4 h-4 text-amber-500" /> 03. Diagnóstico Técnico y Detalle de Árboles
                    </h4>
                    
                    <!-- Metadata de Verificación General -->
                    <div class="grid grid-cols-3 gap-6 bg-card-sec p-4 rounded-2xl border border-sec shadow-sm">
                        <div class="flex flex-col">
                            <label class="label-prime">Técnico Evaluador <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.id_tecnico_verificacion" class="form-input-prime">
                                <option :value="null">-- Seleccione --</option>
                                <option v-for="t in tecnicosFiltrados" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                            </select>
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime">Fecha Verificación <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.fecha_verificacion" type="date" class="form-input-prime">
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime">Nivel de Prioridad <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.nivel_urgencia" class="form-input-prime font-black uppercase text-amber-700 dark:text-amber-400">
                                <option value="Baja">🟢 Baja</option>
                                <option value="Intermedia">🟡 Intermedia</option>
                                <option value="Alta">🔴 Alta</option>
                            </select>
                        </div>
                        <!-- Campo Verificado (sincronizado con PodarApp) -->
                        <div class="col-span-3 flex items-center gap-4 pt-1">
                            <label class="relative flex items-center gap-3 cursor-pointer select-none group"
                                :class="form.verificado ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'">
                                <div class="w-10 h-6 rounded-full transition-all duration-300 flex items-center px-1"
                                    :class="form.verificado ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'"
                                    @click="form.verificado = !form.verificado">
                                    <div class="w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                                        :class="form.verificado ? 'translate-x-4' : 'translate-x-0'"></div>
                                </div>
                                <span class="text-[11px] font-black uppercase tracking-wider">
                                    {{ form.verificado ? '✅ Verificado en Campo' : '⏳ Pendiente de Verificación' }}
                                </span>
                            </label>
                        </div>
                    </div>

                    <!-- Listado Dinámico de Árboles -->
                    <div class="space-y-4">
                        <h5 class="text-[9px] font-black text-muted uppercase tracking-wider ml-1">Árboles Registrados</h5>
                        
                        <div v-for="(arb, index) in form.arboles" :key="index" 
                            class="p-5 bg-card-sec border border-sec rounded-2xl shadow-sm space-y-4 hover:border-amber-200 transition-all relative">
                            
                            <!-- Cabecera de la Tarjeta del Árbol -->
                            <div class="flex justify-between items-center border-b border-sec pb-2">
                                <span class="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                                    🌲 Árbol #{{ index + 1 }} {{ index === 0 ? '(Principal)' : '' }}
                                </span>
                                <button v-if="index > 0" type="button" @click="removeArbol(index)" 
                                    class="px-2.5 py-1 text-[9px] font-bold text-red-500 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                                    <Trash2 class="w-3 h-3" /> Eliminar
                                </button>
                            </div>

                            <!-- Campos del Árbol -->
                            <div class="grid grid-cols-3 gap-4">
                                <div class="flex flex-col">
                                    <label class="label-prime">Especie <span class="text-red-500 font-black">*</span></label>
                                    <select v-model="arb.id_especie" class="form-input-prime">
                                        <option :value="null">-- Seleccione --</option>
                                        <option v-for="e in store.especies" :key="e.id" :value="e.id">{{ e.nombre }}</option>
                                    </select>
                                </div>
                                <div class="flex flex-col">
                                    <label class="label-prime">Acción Solicitada <span class="text-red-500 font-black">*</span></label>
                                    <select v-model="arb.id_accion_solicitada" class="form-input-prime">
                                        <option :value="null">-- Seleccione --</option>
                                        <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                                    </select>
                                </div>
                                <div class="flex flex-col">
                                    <label class="label-prime">Acción Determinada (Técnica) <span class="text-red-500 font-black">*</span></label>
                                    <select v-model="arb.id_accion_realizar" class="form-input-prime">
                                        <option :value="null">-- Seleccione --</option>
                                        <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                                    </select>
                                </div>
                                <div class="col-span-3 flex flex-col">
                                    <label class="label-prime">Observaciones Específicas del Árbol</label>
                                    <input v-model="arb.observaciones_arbol" @input="capFirst($event, arb, 'observaciones_arbol')" type="text" class="form-input-prime" 
                                        placeholder="Ej: Ramas secas colgando, dañado por hongos, etc.">
                                </div>
                                <!-- Campo Realizado por árbol (sincronizado con PodarApp) -->
                                <div class="col-span-3 flex items-center gap-3 pt-1">
                                    <label class="relative flex items-center gap-3 cursor-pointer select-none"
                                        :class="arb.realizado ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'">
                                        <div class="w-8 h-5 rounded-full transition-all duration-300 flex items-center px-0.5"
                                            :class="arb.realizado ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'"
                                            @click="arb.realizado = !arb.realizado">
                                            <div class="w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                                                :class="arb.realizado ? 'translate-x-3' : 'translate-x-0'"></div>
                                        </div>
                                        <span class="text-[10px] font-black uppercase tracking-wider">
                                            {{ arb.realizado ? '✅ Árbol Ejecutado' : 'Pendiente' }}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Botón para añadir árbol -->
                        <button type="button" @click="addArbol" 
                            class="w-full py-3 bg-card-sec hover:bg-accent-soft border-2 border-dashed border-sec hover:border-accent text-main hover:text-accent font-black rounded-2xl text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <Plus class="w-4 h-4" />
                            <span>Añadir otro árbol</span>
                        </button>
                    </div>

                    <!-- Detalles de la Verificación Técnica General -->
                    <div class="flex flex-col bg-card-sec p-4 rounded-2xl border border-sec shadow-sm">
                        <label class="label-prime">Detalles de la Verificación Técnica General</label>
                        <textarea v-model="form.observacion_verificacion" @input="capFirst($event, form, 'observacion_verificacion')" rows="2" class="form-input-prime resize-none" 
                            placeholder="Ej: Requiere plataforma por altura, coordinar con SETAR..."></textarea>
                    </div>
                </div>

                <!-- SECCIÓN 04: LOGÍSTICA -->
                <div class="p-6 bg-card-sec border border-sec border-l-[6px] border-l-slate-400 rounded-xl shadow-sm">
                    <h4 class="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Wrench class="w-4 h-4 text-muted" /> 04. Apoyo Logístico
                    </h4>
                    <div class="grid grid-cols-4 gap-4">
                        <label v-for="l in [
                            { k: 'procede', lbl: 'Procede', color: 'emerald' },
                            { k: 'arbol_seco', lbl: 'Arbol Seco', color: 'amber' },
                            { k: 'requiere_plataforma', lbl: 'Plataforma', color: 'blue' },
                            { k: 'requiere_setar', lbl: 'SETAR', color: 'orange' },
                            { k: 'requiere_ficha_tecnica', lbl: 'Ficha Tec', color: 'indigo' },
                            { k: 'es_emergencia', lbl: 'Emergencia', color: 'red' },
                            { k: 'segunda_nota', lbl: '2da Nota', color: 'purple' },
                            { k: 'es_urgencia', lbl: 'Urgencia', color: 'rose' }
                        ]" :key="l.k" 
                            class="relative flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 select-none group"
                            :class="form[l.k] 
                                ? `border-${l.color}-500 bg-${l.color}-500 text-white scale-[1.08] shadow-lg z-10` 
                                : `border-sec bg-card-main text-muted hover:border-${l.color}-200 shadow-sm`">
                            
                            <span class="text-[10px] font-black uppercase mb-2">{{ l.lbl }}</span>
                            <div class="w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all"
                                :class="form[l.k] ? 'bg-white border-white' : 'bg-card-sec border-sec'">
                                <svg v-if="form[l.k]" class="w-4 h-4 font-black" :class="`text-${l.color}-600`" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
                                <input type="checkbox" v-model="form[l.k]" class="hidden">
                            </div>
                        </label>
                    </div>
                </div>

                <!-- SECCIÓN 05: CIERRE -->
                <div class="p-6 bg-purple-50 border border-purple-100 border-l-[6px] border-l-purple-500 rounded-xl shadow-sm">
                    <h4 class="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <CheckCircle2 class="w-4 h-4 text-purple-500" /> 05. Ejecución y Cierre
                    </h4>
                    <div class="grid grid-cols-3 gap-6">
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Estado de Solicitud <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.estado_tramite" class="form-input-prime font-black uppercase text-emerald-600 dark:text-emerald-400">
                                <option value="En espera">🟡 En espera</option>
                                <option value="Terminado">🟢 Terminado</option>
                            </select>
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Personal Responsable</label>
                            <select v-model="form.id_tecnico_ejecucion" class="form-input-prime">
                                <option :value="null">-- Seleccione --</option>
                                <option v-for="t in tecnicosFiltrados" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                            </select>
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Fecha de Cierre</label>
                            <input v-model="form.fecha_ejecucion" type="date" class="form-input-prime">
                        </div>
                        <div class="col-span-3 flex flex-col">
                            <label class="label-prime">Notas Finales de Ejecución</label>
                            <textarea v-model="form.observaciones_finales" @input="capFirst($event, form, 'observaciones_finales')" rows="2" class="form-input-prime resize-none" placeholder="Ej: Poda ejecutada con éxito, ramas secas removidas..."></textarea>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex gap-4 pt-4 pb-2">
                    <button type="button" @click="cerrar" class="flex-1 px-4 py-4 rounded-2xl border-2 border-main text-muted font-black uppercase text-[10px] tracking-widest hover:bg-card-sec transition-all cursor-pointer">Cancelar</button>
                    <button type="submit" class="flex-[2] px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-950/20 transition-all active:scale-95 cursor-pointer">
                        {{ uiState.editData ? 'Actualizar Expediente' : 'Registrar Solicitud' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, addSolicitud, updateSolicitud, showToast } = mainStore

import { X, Info, MapPin, Activity, Plus, Trash2, Wrench, CheckCircle2 } from 'lucide-vue-next'

const emit = defineEmits(['close'])

// --- ESTADO Y REFERENCIAS ---
const distritoSeleccionado = ref(null)
const isUpdating = ref(false) // Bloqueo para evitar bucles infinitos
let modalMap = null
let modalMarker = null
const gpsLink = ref('')

const form = ref({
    comunicacion_interna: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_verificacion: '',
    id_barrio: null,
    id_tipo_institucion: null,
    id_nombre_institucional: null,
    calle: '',
    numero_casa: '',
    referencia: '',
    lat: null,
    lng: null,
    solicitante_nombre: '',
    solicitante_telefono: '',
    solicitante_descripcion: '',
    lo_solicitado: '',
    id_accion_solicitada: null,
    id_accion: null,
    id_tecnico_verificacion: null,
    verificado: false,
    requiere_plataforma: false,
    requiere_setar: false,
    requiere_ficha_tecnica: false,
    procede: false,
    arbol_seco: false,
    es_emergencia: false,
    segunda_nota: false,
    es_urgencia: false,
    nivel_urgencia: 'Baja',
    id_especie: null,
    observacion_verificacion: '',
    id_tecnico_ejecucion: null,
    fecha_ejecucion: '',
    observaciones_finales: '',
    estado_tramite: 'En espera',
    arboles: [
        {
            id_especie: null,
            id_accion_solicitada: null,
            id_accion_realizar: null,
            observaciones_arbol: '',
            url_foto: null,
            realizado: false
        }
    ]
})

// --- LÓGICA DE FILTRADO (COMPUTED) ---
const barriosFiltrados = computed(() => {
    if (!distritoSeleccionado.value) return store.barrios;
    return store.barrios.filter(b => b.id_distrito == distritoSeleccionado.value);
})

const institucionesFiltradas = computed(() => {
    if (!form.value.id_tipo_institucion) return store.instituciones;
    return store.instituciones.filter(i => i.id_tipo == form.value.id_tipo_institucion);
})

const tecnicosFiltrados = computed(() => {
    return store.tecnicos.filter(t => {
        if (!t.cargo) return false;
        const cargoNormalizado = t.cargo.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // remove accents
        
        return (cargoNormalizado.includes('tecnico') || cargoNormalizado.includes('sistemas')) && 
               !cargoNormalizado.includes('responsable');
    });
})

// --- SINCRONIZACIÓN (WATCHERS) ---

// 1. DISTRITO -> BARRIOS (Si cambio distrito, limpio barrio si no pertenece o si se deselecciona)
watch(distritoSeleccionado, (newDist) => {
    if (isUpdating.value) return;
    if (newDist) {
        if (form.value.id_barrio) {
            const barrioActual = store.barrios.find(b => b.id == form.value.id_barrio);
            if (barrioActual && barrioActual.id_distrito != newDist) {
                form.value.id_barrio = null;
            }
        }
    } else {
        form.value.id_barrio = null;
    }
})

// 2. BARRIO -> DISTRITO (Si selecciono barrio, se pone el distrito solo)
watch(() => form.value.id_barrio, (newBarrio) => {
    if (isUpdating.value) return;
    if (newBarrio) {
        const b = store.barrios.find(x => x.id == newBarrio);
        if (b) {
            isUpdating.value = true;
            distritoSeleccionado.value = b.id_distrito;
            nextTick(() => isUpdating.value = false);
        }
    }
})

// 3. INSTITUCIÓN -> TIPO (Sincronización automática)
watch(() => form.value.id_nombre_institucional, (newInst) => {
    if (isUpdating.value) return;
    if (newInst) {
        const i = store.instituciones.find(x => x.id == newInst);
        if (i) {
            isUpdating.value = true;
            form.value.id_tipo_institucion = i.id_tipo;
            nextTick(() => isUpdating.value = false);
        }
    }
})

// 4. TIPO -> INSTITUCIÓN (Si cambio tipo, limpio nombre)
watch(() => form.value.id_tipo_institucion, (newTipo, oldTipo) => {
    if (isUpdating.value) return;
    if (oldTipo !== undefined && newTipo !== oldTipo) {
        form.value.id_nombre_institucional = null;
    }
})

// --- FUNCIONES AUXILIARES ---
const cap = (e, field) => {
    const v = e.target.value
    if (v && v[0] !== v[0].toUpperCase()) {
        form.value[field] = v[0].toUpperCase() + v.slice(1)
    } else {
        form.value[field] = v
    }
}

const capFirst = (e, obj, key) => {
    const v = e.target.value
    if (v && v[0] !== v[0].toUpperCase()) {
        obj[key] = v[0].toUpperCase() + v.slice(1)
    } else {
        obj[key] = v
    }
}

const addArbol = () => {
    form.value.arboles.push({
        id_especie: null,
        id_accion_solicitada: null,
        id_accion_realizar: null,
        observaciones_arbol: '',
        url_foto: null,
        realizado: false
    })
}

const removeArbol = (index) => {
    if (index > 0) {
        form.value.arboles.splice(index, 1)
    }
}

const formatComunicacionInterna = (e) => {
    let value = e.target.value;
    if (!value) {
        form.value.comunicacion_interna = '';
        return;
    }
    let clean = value.trim();
    if (clean === '') {
        form.value.comunicacion_interna = '';
        return;
    }
    
    if (/^COD\./i.test(clean)) {
        let rest = clean.slice(4).trim();
        if (rest === '') {
            form.value.comunicacion_interna = '';
        } else {
            form.value.comunicacion_interna = `COD. ${rest}`;
        }
    } else {
        form.value.comunicacion_interna = `COD. ${clean}`;
    }
}

// --- GEOLOCALIZACIÓN Y MAPA ---
const initModalMap = () => {
    if (typeof L === 'undefined') {
        setTimeout(initModalMap, 200);
        return;
    }

    const defaultLat = -21.5355;
    const defaultLng = -64.7327;
    const startLat = form.value.lat || defaultLat;
    const startLng = form.value.lng || defaultLng;

    modalMap = L.map('modal-map', {
        zoomControl: true,
        scrollWheelZoom: true
    }).setView([startLat, startLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(modalMap);

    modalMarker = L.marker([startLat, startLng], {
        draggable: true
    }).addTo(modalMap);

    // Escuchar cuando se arrastra el marcador
    modalMarker.on('dragend', () => {
        const position = modalMarker.getLatLng();
        form.value.lat = parseFloat(position.lat.toFixed(6));
        form.value.lng = parseFloat(position.lng.toFixed(6));
    });

    // Escuchar clics en el mapa para mover el apuntador
    modalMap.on('click', (e) => {
        const position = e.latlng;
        modalMarker.setLatLng(position);
        form.value.lat = parseFloat(position.lat.toFixed(6));
        form.value.lng = parseFloat(position.lng.toFixed(6));
    });

    // Forzar redibujado de Leaflet para evitar problemas de renderizado
    setTimeout(() => {
        if (modalMap) {
            modalMap.invalidateSize();
        }
    }, 300);
}

const handleManualCoordsChange = () => {
    const lat = parseFloat(form.value.lat);
    const lng = parseFloat(form.value.lng);
    if (!isNaN(lat) && !isNaN(lng) && modalMarker && modalMap) {
        modalMarker.setLatLng([lat, lng]);
        modalMap.setView([lat, lng]);
    }
}

const handleGpsLinkInput = (e) => {
    const val = e.target.value;
    if (!val) return;
    
    // 1. Intentar buscar formato: lat, lng
    const coordsRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    const matchCoords = val.match(coordsRegex);
    if (matchCoords) {
        const lat = parseFloat(matchCoords[1]);
        const lng = parseFloat(matchCoords[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
            form.value.lat = lat;
            form.value.lng = lng;
            handleManualCoordsChange();
            return;
        }
    }
    
    // 2. Intentar buscar en URL formato @lat,lng
    const urlRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const matchUrl = val.match(urlRegex);
    if (matchUrl) {
        const lat = parseFloat(matchUrl[1]);
        const lng = parseFloat(matchUrl[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
            form.value.lat = lat;
            form.value.lng = lng;
            handleManualCoordsChange();
            return;
        }
    }

    // 3. Intentar buscar en URL formato q=lat,lng
    const queryRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const matchQuery = val.match(queryRegex);
    if (matchQuery) {
        const lat = parseFloat(matchQuery[1]);
        const lng = parseFloat(matchQuery[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
            form.value.lat = lat;
            form.value.lng = lng;
            handleManualCoordsChange();
            return;
        }
    }
}

onUnmounted(() => {
    if (modalMap) {
        modalMap.remove();
        modalMap = null;
        modalMarker = null;
    }
})

onMounted(() => {
    if (uiState.editData) {
        isUpdating.value = true;
        Object.keys(form.value).forEach(key => {
            if (key === 'arboles') return; // Se maneja por separado
            if (uiState.editData[key] !== undefined) {
                if (key.startsWith('fecha_') && uiState.editData[key]) {
                    form.value[key] = new Date(uiState.editData[key]).toISOString().split('T')[0]
                } else {
                    form.value[key] = uiState.editData[key]
                }
            }
        })
        // Cargar distrito inicial en edición
        if (form.value.id_barrio) {
            const b = store.barrios.find(x => x.id == form.value.id_barrio);
            if (b) distritoSeleccionado.value = b.id_distrito;
        }
        
        // Cargar árboles con fallback para registros antiguos
        if (uiState.editData.arboles && uiState.editData.arboles.length > 0) {
            form.value.arboles = uiState.editData.arboles.map(a => ({
                id_especie: a.id_especie,
                id_accion_solicitada: a.id_accion_solicitada,
                id_accion_realizar: a.id_accion_realizar,
                observaciones_arbol: a.observaciones_arbol || '',
                url_foto: a.url_foto || null
            }));
        } else {
            form.value.arboles = [
                {
                    id_especie: uiState.editData.id_especie || null,
                    id_accion_solicitada: uiState.editData.id_accion_solicitada || null,
                    id_accion_realizar: uiState.editData.id_accion || null,
                    observaciones_arbol: '',
                    url_foto: uiState.editData.url_foto || null
                }
            ];
        }
        nextTick(() => isUpdating.value = false);
    }
    
    // Inicializar mapa de ubicación
    initModalMap();
})

const cerrar = () => { uiState.editData = null; emit('close') }

const handleGuardar = async () => {
    const faltantes = [];
    if (!form.value.fecha_ingreso) faltantes.push("Fecha de Ingreso");
    if (!form.value.comunicacion_interna) faltantes.push("Cód. Comunicación");
    if (!form.value.solicitante_telefono) faltantes.push("Teléfono");
    if (!form.value.solicitante_nombre) faltantes.push("Nombre del Solicitante");
    if (!distritoSeleccionado.value) faltantes.push("Distrito");
    if (!form.value.id_barrio) faltantes.push("Barrio");
    if (!form.value.calle) faltantes.push("Calle");
    if (!form.value.id_tecnico_verificacion) faltantes.push("Técnico Evaluador");
    if (!form.value.fecha_verificacion) faltantes.push("Fecha Verificación");
    if (!form.value.nivel_urgencia) faltantes.push("Nivel de Prioridad");
    if (!form.value.estado_tramite) faltantes.push("Estado");

    if (faltantes.length > 0) {
        showToast(`🛑 ATENCIÓN: Faltan campos obligatorios:\n• ${faltantes.join('\n• ')}`, 'error', 6000);
        return;
    }

    // Validación de árboles
    let invalidArbol = false;
    form.value.arboles.forEach((arb) => {
        if (!arb.id_especie || !arb.id_accion_solicitada || !arb.id_accion_realizar) {
            invalidArbol = true;
        }
    });
    if (invalidArbol) {
        showToast("🛑 ATENCIÓN: Todos los árboles deben tener Especie, Acción Solicitada y Acción Determinada obligatoriamente.", "error", 6000);
        return;
    }

    // Sincronizar primer árbol con campos planos para compatibilidad con el resto de la aplicación
    if (form.value.arboles.length > 0) {
        form.value.id_especie = form.value.arboles[0].id_especie;
        form.value.id_accion_solicitada = form.value.arboles[0].id_accion_solicitada;
        form.value.id_accion = form.value.arboles[0].id_accion_realizar;
    }

    // Validar duplicidad de comunicación interna en el frontend
    if (form.value.comunicacion_interna && form.value.comunicacion_interna.trim() !== '') {
        const dup = store.solicitudes.find(s => 
            s.comunicacion_interna && 
            s.comunicacion_interna.trim().toLowerCase() === form.value.comunicacion_interna.trim().toLowerCase() && 
            s.id_solicitud != (uiState.editData?.id_solicitud || 0)
        );
        if (dup) {
            showToast(`🛑 ATENCIÓN: El código de comunicación interna "${form.value.comunicacion_interna}" ya existe en la solicitud con código anual ${dup.codigo_anual}.`, 'error', 6000);
            return;
        }
    }

    try {
        let res;
        if (uiState.editData) {
            res = await updateSolicitud(uiState.editData.id_solicitud, { ...form.value })
            if (res.success) {
                showToast('Expediente actualizado correctamente', 'success')
                cerrar()
            } else {
                showToast(`❌ Error al actualizar: ${res.error}`, 'error', 5000)
            }
        } else {
            res = await addSolicitud({ ...form.value })
            if (res.success) {
                showToast('¡Solicitud registrada con éxito!', 'success')
                cerrar()
            } else {
                showToast(`❌ Error de Registro: ${res.error}`, 'error', 7000)
            }
        }
    } catch (e) {
        showToast('Fallo crítico en la comunicación con el servidor', 'error');
    }
}
</script>

<style scoped>
@reference "tailwindcss";
.label-prime {
    @apply text-sm font-semibold mb-1.5 ml-1 flex items-center gap-1;
    color: var(--text-main);
}
.form-input-prime {
    @apply w-full px-4 py-3 rounded-xl text-sm font-bold 
           outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-sm;
    background-color: var(--input-bg) !important;
    border: 2px solid var(--border) !important;
    color: var(--text-main) !important;
}
.animate-prime-in {
    animation: primePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes primePop {
    from { opacity: 0; transform: scale(0.98) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Colores Logística con Efecto Glow */
.border-emerald-500 { border-color: #10b981; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); } 
.bg-emerald-500 { background: linear-gradient(135deg, #10b981, #059669); } 
.text-emerald-600 { color: #059669; }

.border-amber-500 { border-color: #f59e0b; box-shadow: 0 0 20px rgba(245, 158, 11, 0.3); } 
.bg-amber-500 { background: linear-gradient(135deg, #f59e0b, #d97706); } 
.text-amber-600 { color: #d97706; }

.border-blue-500 { border-color: #3b82f6; box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); } 
.bg-blue-500 { background: linear-gradient(135deg, #3b82f6, #2563eb); } 
.text-blue-600 { color: #2563eb; }

.border-orange-500 { border-color: #f97316; box-shadow: 0 0 20px rgba(249, 115, 22, 0.3); } 
.bg-orange-500 { background: linear-gradient(135deg, #f97316, #ea580c); } 
.text-orange-600 { color: #ea580c; }

.border-indigo-500 { border-color: #6366f1; box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); } 
.bg-indigo-500 { background: linear-gradient(135deg, #6366f1, #4f46e5); } 
.text-indigo-600 { color: #4f46e5; }

.border-red-500 { border-color: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); } 
.bg-red-500 { background: linear-gradient(135deg, #ef4444, #dc2626); } 
.text-red-600 { color: #dc2626; }

.border-purple-500 { border-color: #a855f7; box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); } 
.bg-purple-500 { background: linear-gradient(135deg, #a855f7, #9333ea); } 
.text-purple-600 { color: #9333ea; }

.border-rose-500 { border-color: #f43f5e; box-shadow: 0 0 20px rgba(244, 63, 94, 0.3); } 
.bg-rose-500 { background: linear-gradient(135deg, #f43f5e, #e11d48); } 
.text-rose-600 { color: #e11d48; }

.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 rounded-full; }
</style>