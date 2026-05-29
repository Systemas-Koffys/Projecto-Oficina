<template>
    <div class="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
        <div class="bg-white rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden flex flex-col border border-white/20 animate-prime-in">
            
            <!-- Header Institucional -->
            <div class="px-8 py-6 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex justify-between items-center shadow-lg">
                <div>
                    <h3 class="font-black text-xl tracking-tight leading-none">{{ uiState.editData ? 'Editar Expediente Técnico' : 'Nueva Solicitud de Servicio' }}</h3>
                    <!-- Lógica de Sincronización v2.1 Activa -->
                    <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em] mt-2">Gestión de Arboricultura Municipal</p>
                </div>
                <button type="button" @click="cerrar" class="hover:bg-white/20 p-2 rounded-xl transition-all">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <!-- Cuerpo del Formulario -->
            <form @submit.prevent="handleGuardar" id="solicitudForm" class="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar bg-slate-50/50">
                
                <!-- SECCIÓN 01: IDENTIFICACIÓN -->
                <div class="p-6 bg-blue-50 border border-blue-100 border-l-[6px] border-l-blue-500 rounded-xl shadow-sm">
                    <h4 class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span> 01. Información de Ingreso
                    </h4>
                    <div class="grid grid-cols-3 gap-6">
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Fecha de Ingreso <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.fecha_ingreso" type="date" class="form-input-prime">
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Cód. Comunicación <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.comunicacion_interna" type="text" class="form-input-prime text-center" placeholder="00/26">
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Acción Solicitada <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.id_accion_solicitada" class="form-input-prime">
                                <option :value="null">-- Seleccione --</option>
                                <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                            </select>
                        </div>
                        <div class="col-span-2 flex flex-col">
                            <label class="label-prime">Nombre del Solicitante <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.solicitante_nombre" @input="cap($event, 'solicitante_nombre')" type="text" class="form-input-prime" placeholder="Nombre y Apellidos">
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Teléfono</label>
                            <input v-model="form.solicitante_telefono" type="text" class="form-input-prime" placeholder="Ej: 77000000">
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
                            <textarea v-model="form.solicitante_descripcion" rows="2" class="form-input-prime text-xs resize-none" placeholder="Ej: Atender solo por la mañana o esta dañando mi pared..."></textarea>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 02: LOCALIZACIÓN -->
                <div class="p-6 bg-emerald-50 border border-emerald-100 border-l-[6px] border-l-emerald-500 rounded-xl shadow-sm">
                    <h4 class="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> 02. Localización y Referencia
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
                            <input v-model="form.calle" @input="cap($event, 'calle')" type="text" class="form-input-prime">
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Nº Casa</label>
                            <input v-model="form.numero_casa" type="text" class="form-input-prime text-center">
                        </div>
                        <div class="col-span-4 flex flex-col">
                            <label class="label-prime">Punto de Referencia Exacto</label>
                            <input v-model="form.referencia" @input="cap($event, 'referencia')" type="text" class="form-input-prime">
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 03: EVALUACIÓN TÉCNICA -->
                <div class="p-6 bg-amber-50 border border-amber-100 border-l-[6px] border-l-amber-500 rounded-xl shadow-sm">
                    <h4 class="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <span class="w-2 h-2 bg-amber-500 rounded-full"></span> 03. Diagnóstico Técnico
                    </h4>
                    <div class="grid grid-cols-3 gap-6">
                        <div class="flex flex-col">
                            <label class="label-prime">Acción Determinada</label>
                            <select v-model="form.id_accion" class="form-input-prime">
                                <option :value="null">-- Seleccione --</option>
                                <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                            </select>
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime">Técnico Evaluador</label>
                            <select v-model="form.id_tecnico_verificacion" class="form-input-prime">
                                <option :value="null">-- Seleccione --</option>
                                <option v-for="t in store.tecnicos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                            </select>
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime">Fecha Verificación</label>
                            <input v-model="form.fecha_verificacion" type="date" class="form-input-prime">
                        </div>
                        <div class="col-span-3 flex flex-col">
                            <label class="label-prime">Detalles de la Verificación Técnica</label>
                            <textarea v-model="form.observacion_verificacion" rows="2" class="form-input-prime text-xs resize-none"></textarea>
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime">Especie</label>
                            <select v-model="form.id_especie" class="form-input-prime">
                                <option :value="null">-- Seleccione --</option>
                                <option v-for="e in store.especies" :key="e.id" :value="e.id">{{ e.nombre }}</option>
                            </select>
                        </div>
                        <div class="col-span-2 flex flex-col">
                            <label class="label-prime">Nivel de Prioridad <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.nivel_urgencia" class="form-input-prime font-black uppercase text-amber-700">
                                <option value="Baja">🟢 Baja</option>
                                <option value="Intermedia">🟡 Intermedia</option>
                                <option value="Alta">🔴 Alta</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 04: LOGÍSTICA -->
                <div class="p-6 bg-slate-50 border border-slate-100 border-l-[6px] border-l-slate-400 rounded-xl shadow-sm">
                    <h4 class="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <span class="w-2 h-2 bg-slate-400 rounded-full"></span> 04. Apoyo Logístico
                    </h4>
                    <div class="grid grid-cols-4 gap-4">
                        <label v-for="l in [
                            { k: 'procede', lbl: 'Procede', color: 'emerald' },
                            { k: 'arbol_seco', lbl: 'Arbol Seco', color: 'amber' },
                            { k: 'requiere_plataforma', lbl: 'Grúa', color: 'blue' },
                            { k: 'requiere_setar', lbl: 'SETAR', color: 'orange' },
                            { k: 'requiere_ficha_tecnica', lbl: 'Ficha Tec', color: 'indigo' },
                            { k: 'es_emergencia', lbl: 'Emergencia', color: 'red' },
                            { k: 'segunda_nota', lbl: '2da Nota', color: 'purple' },
                            { k: 'es_urgencia', lbl: 'Urgencia', color: 'rose' }
                        ]" :key="l.k" 
                            class="relative flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 select-none group"
                            :class="form[l.k] 
                                ? `border-${l.color}-500 bg-${l.color}-500 text-white scale-[1.08] shadow-lg z-10` 
                                : `border-white bg-white text-slate-400 hover:border-${l.color}-200 shadow-sm`">
                            
                            <span class="text-[10px] font-black uppercase mb-2">{{ l.lbl }}</span>
                            <div class="w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all"
                                :class="form[l.k] ? 'bg-white border-white' : 'bg-slate-50 border-slate-100'">
                                <svg v-if="form[l.k]" class="w-4 h-4 font-black" :class="`text-${l.color}-600`" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
                                <input type="checkbox" v-model="form[l.k]" class="hidden">
                            </div>
                        </label>
                    </div>
                </div>

                <!-- SECCIÓN 05: CIERRE -->
                <div class="p-6 bg-purple-50 border border-purple-100 border-l-[6px] border-l-purple-500 rounded-xl shadow-sm">
                    <h4 class="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <span class="w-2 h-2 bg-purple-500 rounded-full"></span> 05. Ejecución y Cierre
                    </h4>
                    <div class="grid grid-cols-3 gap-6">
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Estado de Solicitud <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.estado_tramite" class="form-input-prime font-black uppercase text-emerald-600">
                                <option value="En espera">🟡 En espera</option>
                                <option value="Terminado">🟢 Terminado</option>
                            </select>
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Personal Responsable</label>
                            <select v-model="form.id_tecnico_ejecucion" class="form-input-prime">
                                <option :value="null">-- Seleccione --</option>
                                <option v-for="t in store.tecnicos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                            </select>
                        </div>
                        <div class="col-span-1 flex flex-col">
                            <label class="label-prime">Fecha de Cierre</label>
                            <input v-model="form.fecha_ejecucion" type="date" class="form-input-prime">
                        </div>
                        <div class="col-span-3 flex flex-col">
                            <label class="label-prime">Notas Finales de Ejecución</label>
                            <textarea v-model="form.observaciones_finales" rows="2" class="form-input-prime text-xs resize-none" placeholder="Reporte de cierre..."></textarea>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex gap-4 pt-4 pb-2">
                    <button type="button" @click="cerrar" class="flex-1 px-4 py-4 rounded-2xl border-2 border-gray-100 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Cancelar</button>
                    <button type="submit" class="flex-[2] px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-95">
                        {{ uiState.editData ? 'Actualizar Expediente' : 'Registrar Solicitud' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, addSolicitud, updateSolicitud, showToast } = mainStore

const emit = defineEmits(['close'])

// --- ESTADO Y REFERENCIAS ---
const distritoSeleccionado = ref(null)
const isUpdating = ref(false) // Bloqueo para evitar bucles infinitos

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
    solicitante_nombre: '',
    solicitante_telefono: '',
    solicitante_descripcion: '',
    lo_solicitado: '',
    id_accion_solicitada: null,
    id_accion: null,
    id_tecnico_verificacion: null,
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
    estado_tramite: 'En espera'
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

// --- SINCRONIZACIÓN (WATCHERS) ---

// 1. DISTRITO -> BARRIOS (Si cambio distrito, limpio barrio si no pertenece)
watch(distritoSeleccionado, (newDist) => {
    if (isUpdating.value) return;
    if (newDist && form.value.id_barrio) {
        const barrioActual = store.barrios.find(b => b.id == form.value.id_barrio);
        if (barrioActual && barrioActual.id_distrito != newDist) {
            form.value.id_barrio = null;
        }
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

onMounted(() => {
    if (uiState.editData) {
        isUpdating.value = true;
        Object.keys(form.value).forEach(key => {
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
        nextTick(() => isUpdating.value = false);
    }
})

const cerrar = () => { uiState.editData = null; emit('close') }

const handleGuardar = async () => {
    const faltantes = [];
    if (!form.value.fecha_ingreso) faltantes.push("Fecha de Ingreso");
    if (!form.value.comunicacion_interna) faltantes.push("Cód. Comunicación");
    if (!form.value.id_accion_solicitada) faltantes.push("Acción Solicitada");
    if (!form.value.solicitante_nombre) faltantes.push("Nombre del Solicitante");
    if (!distritoSeleccionado.value) faltantes.push("Distrito");
    if (!form.value.id_barrio) faltantes.push("Barrio");
    if (!form.value.calle) faltantes.push("Calle");
    if (!form.value.nivel_urgencia) faltantes.push("Nivel de Prioridad");
    if (!form.value.estado_tramite) faltantes.push("Estado");

    if (faltantes.length > 0) {
        showToast(`🛑 ATENCIÓN: Faltan campos obligatorios:\n• ${faltantes.join('\n• ')}`, 'error', 6000);
        return;
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
.label-prime { @apply text-sm font-semibold text-slate-700 mb-1.5 ml-1 flex items-center gap-1; }
.form-input-prime {
    @apply w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 
           outline-none transition-all focus:ring-4 focus:ring-opacity-10 shadow-sm;
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