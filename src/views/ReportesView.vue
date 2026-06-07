<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, registrarImpresion, deleteImpresion, updateImpresionName, showToast, fetchImpresiones } = mainStore
import { Printer, History, Trash2, Edit3, Eye, FileText, Filter, ChevronRight, Search, Download } from 'lucide-vue-next'

const activeTab = ref('generador')
const editId = ref(null)
const editNombre = ref('')

// Modal de confirmación personalizado
const showConfirmModal = ref(false)
const confirmTitle = ref('Confirmar Eliminación')
const confirmMessage = ref('¿Estás seguro de eliminar este registro?')
let onConfirmCallback = null

const mostrarConfirmacion = (titulo, mensaje, callback) => {
    confirmTitle.value = titulo
    confirmMessage.value = mensaje
    onConfirmCallback = callback
    showConfirmModal.value = true
}

const ejecutarConfirmacion = async () => {
    showConfirmModal.value = false
    if (onConfirmCallback) {
        await onConfirmCallback()
    }
}

// Filtros para el generador
const filtroBarrio = ref('')
const filtroTecnico = ref('')
const filtroSetar = ref('')
const filtroPlataforma = ref('')
const filtroEstado = ref('En espera') 
const filtroUrgencia = ref('')
const filtroAccion = ref('')
const filtroEspecie = ref('')
const nombreHojaRuta = ref('')

onMounted(() => {
    // Los datos ya vienen cargados desde el App.vue
})

const solicitudesFiltradas = computed(() => {
    return store.solicitudes.filter(sol => {
        let match = true
        if (filtroBarrio.value && sol.id_barrio != filtroBarrio.value) match = false
        if (filtroTecnico.value && sol.id_tecnico_ejecucion != filtroTecnico.value) match = false
        if (filtroUrgencia.value && sol.nivel_urgencia != filtroUrgencia.value) match = false
        if (filtroAccion.value && sol.id_accion != filtroAccion.value) match = false
        if (filtroEspecie.value && sol.id_especie != filtroEspecie.value) match = false
        
        if (filtroSetar.value !== '') {
            const reqSetar = sol.requiere_setar ? '1' : '0'
            if (reqSetar !== filtroSetar.value) match = false
        }
        if (filtroPlataforma.value !== '') {
            const reqPlat = sol.requiere_plataforma ? '1' : '0'
            if (reqPlat !== filtroPlataforma.value) match = false
        }
        if (filtroEstado.value && sol.estado_tramite !== filtroEstado.value) match = false
        return match
    })
})

const getBarrio = (id) => {
    if (!id) return 'Todos'
    const b = store.barrios.find(x => x.id == id)
    return b ? b.nombre : 'N/A'
}

const getAccion = (id) => {
    if (!id) return 'Todas'
    const a = store.acciones.find(x => x.id == id)
    return a ? a.nombre : 'N/A'
}

const getEspecie = (id) => {
    if (!id) return 'Todas'
    const e = store.especies.find(x => x.id == id)
    return e ? e.nombre : 'N/A'
}

const imprimirHojaRuta = async () => {
    if (solicitudesFiltradas.value.length === 0) {
        showToast('No hay solicitudes que coincidan con los filtros.', 'error')
        return
    }
    
    // Preparar metadatos del reporte
    const filtrosTxt = [
        filtroBarrio.value ? `Barrio: ${getBarrio(filtroBarrio.value)}` : null,
        filtroAccion.value ? `Acción: ${getAccion(filtroAccion.value)}` : null,
        filtroEstado.value ? `Estado: ${filtroEstado.value}` : null
    ].filter(Boolean).join(' | ')

    const nombreFinal = nombreHojaRuta.value || `Hoja de Ruta - ${getBarrio(filtroBarrio.value)} (${new Date().toLocaleDateString()})`

    // Registrar en el historial ANTES de imprimir
    const ok = await registrarImpresion({
        nombre_reporte: nombreFinal,
        tipo_reporte: 'Hoja de Ruta',
        filtros_aplicados: filtrosTxt,
        detalles: `Consolidado de ${solicitudesFiltradas.value.length} trámites.`
    })

    if (ok) {
        setTimeout(() => {
            window.print()
            nombreHojaRuta.value = ''
        }, 500)
    }
}

const handleReimprimir = (imp) => {
    showToast('Re-generando vista de impresión para: ' + imp.nombre_reporte, 'success')
    // Nota: Aquí se podría reaplicar la lógica de filtros si se guardaran como JSON, 
    // pero por ahora imprimimos el historial o mostramos que es inmutable.
    window.print()
}

const confirmarEliminar = (imp) => {
    mostrarConfirmacion(
        'Confirmar Eliminación',
        `¿Estás seguro de eliminar el registro del reporte "${imp.nombre_reporte}"?\nEsta acción es irreversible.`,
        async () => {
            const ok = await deleteImpresion(imp.id)
            if (ok) showToast('Registro de reporte eliminado correctamente', 'success')
            else showToast('Error al eliminar el registro', 'error')
        }
    )
}

const iniciarEdicion = (imp) => {
    editId.value = imp.id
    editNombre.value = imp.nombre_reporte
}

const guardarNuevoNombre = async () => {
    if (!editNombre.value.trim()) return
    const ok = await updateImpresionName(editId.value, editNombre.value)
    if (ok) {
        showToast('Nombre actualizado', 'success')
        editId.value = null
    }
}

const formatFecha = (str) => {
    if (!str) return '—'
    const f = new Date(str)
    return f.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
    <div class="reportes-view p-6 max-w-[1400px] mx-auto">
        
        <!-- Header del Centro de Reportes -->
        <div class="mb-8 flex justify-between items-center no-print">
            <div>
                <h2 class="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                    <FileText class="text-emerald-600 w-8 h-8" />
                    Centro de Reportes e Inteligencia
                </h2>
                <p class="text-gray-500 font-medium mt-1">Generación de hojas de ruta, auditoría de impresiones y consolidación de datos.</p>
            </div>
            
            <div class="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                <button @click="activeTab = 'generador'" 
                    :class="activeTab === 'generador' ? 'bg-white text-emerald-700 shadow-md scale-105' : 'text-gray-500 hover:bg-white/50'"
                    class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                    <Printer size="18" /> Generador
                </button>
                <button @click="activeTab = 'historial'" 
                    :class="activeTab === 'historial' ? 'bg-white text-emerald-700 shadow-md scale-105' : 'text-gray-500 hover:bg-white/50'"
                    class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                    <History size="18" /> Historial
                </button>
            </div>
        </div>

        <!-- VISTA GENERADOR: HOJAS DE RUTA -->
        <div v-if="activeTab === 'generador'" class="no-print animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                <!-- Panel de Filtros (Lateral) -->
                <div class="lg:col-span-1 space-y-6">
                    <div class="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 overflow-hidden relative">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        
                        <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Filter size="14" /> Parámetros de Compilación
                        </h3>

                        <div class="space-y-4">
                            <div>
                                <label class="label-mini">Nombre del Reporte (Opcional)</label>
                                <input type="text" v-model="nombreHojaRuta" placeholder="Ej: Ruta Norte Lunes..." class="input-modern" />
                            </div>
                            <div>
                                <label class="label-mini">Barrio Objetivo</label>
                                <select v-model="filtroBarrio" class="input-modern">
                                    <option value="">Todos los sectores</option>
                                    <option v-for="b in store.barrios" :key="b.id" :value="b.id">{{ b.nombre }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="label-mini">Estado del Trámite</label>
                                <select v-model="filtroEstado" class="input-modern">
                                    <option value="En espera">Solo Pendientes</option>
                                    <option value="Terminado">Solo Terminados</option>
                                    <option value="">Cualquier estado</option>
                                </select>
                            </div>
                            <div>
                                <label class="label-mini">Acción Técnica</label>
                                <select v-model="filtroAccion" class="input-modern">
                                    <option value="">Todas las acciones</option>
                                    <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                                </select>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="label-mini">Setar</label>
                                    <select v-model="filtroSetar" class="input-modern">
                                        <option value="">Ambos</option>
                                        <option value="1">Sí</option>
                                        <option value="0">No</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="label-mini">Grúa</label>
                                    <select v-model="filtroPlataforma" class="input-modern">
                                        <option value="">Ambos</option>
                                        <option value="1">Sí</option>
                                        <option value="0">No</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button @click="imprimirHojaRuta" 
                            class="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-3">
                            <Printer size="18" /> Generar y Registrar
                        </button>
                    </div>

                    <div class="bg-emerald-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div class="relative z-10">
                            <p class="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-2">Resumen de Carga</p>
                            <h4 class="text-4xl font-black">{{ solicitudesFiltradas.length }}</h4>
                            <p class="text-emerald-100 text-sm font-medium">Trámites compilados</p>
                        </div>
                        <FileText class="absolute bottom-0 right-0 -mb-4 -mr-4 w-24 h-24 text-white/10" />
                    </div>
                </div>

                <!-- Tabla de Previsualización (Principal) -->
                <div class="lg:col-span-3">
                    <div class="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[600px]">
                        <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h4 class="font-black text-gray-700 text-sm uppercase tracking-widest">Previsualización de Hoja de Ruta</h4>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                Documento Consolidado
                            </span>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                                        <th class="px-8 py-4 w-12 text-center">#</th>
                                        <th class="px-8 py-4">Código / Solicitante</th>
                                        <th class="px-6 py-4">Ubicación Exacta</th>
                                        <th class="px-6 py-4">Acción Técnica</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="solicitudesFiltradas.length === 0" class="text-center py-20">
                                        <td colspan="4" class="py-32">
                                            <div class="flex flex-col items-center opacity-20">
                                                <Search size="64" />
                                                <p class="font-black text-xl mt-4">Sin resultados con estos filtros</p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr v-for="(sol, idx) in solicitudesFiltradas" :key="sol.id_solicitud" class="group border-b border-gray-50 hover:bg-emerald-50/30 transition-all">
                                        <td class="px-8 py-5 text-center font-bold text-gray-400">{{ idx + 1 }}</td>
                                        <td class="px-8 py-5">
                                            <p class="font-black text-emerald-800 text-sm mb-0.5">{{ sol.comunicacion_interna || `#${sol.id_solicitud}` }}</p>
                                            <p class="text-xs text-gray-500 font-bold uppercase tracking-tighter">{{ sol.solicitante_nombre }}</p>
                                        </td>
                                        <td class="px-6 py-5">
                                            <p class="text-sm font-bold text-gray-800">{{ sol.calle }} {{ sol.numero_casa }}</p>
                                            <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest">{{ getBarrio(sol.id_barrio) }}</p>
                                        </td>
                                        <td class="px-6 py-5">
                                            <span class="text-xs font-bold text-gray-600">{{ getAccion(sol.id_accion) }}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- VISTA HISTORIAL: AUDITORÍA DE REPORTES -->
        <div v-if="activeTab === 'historial'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-gray-50/80 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                                <th class="px-8 py-6">ID / Referencia del Reporte</th>
                                <th class="px-6 py-6">Fecha y Hora</th>
                                <th class="px-6 py-6">Generado por</th>
                                <th class="px-6 py-6">Tipo</th>
                                <th class="px-8 py-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="store.impresiones.length === 0">
                                <td colspan="5" class="py-40 text-center opacity-30">
                                    <History size="64" class="mx-auto mb-4" />
                                    <p class="font-black text-xl uppercase tracking-widest">No hay historial registrado</p>
                                </td>
                            </tr>
                            <tr v-for="imp in store.impresiones" :key="imp.id" class="border-b border-gray-50 hover:bg-gray-50/50 transition-all group">
                                <td class="px-8 py-6">
                                    <div v-if="editId === imp.id" class="flex gap-2 items-center">
                                        <input v-model="editNombre" class="input-modern !py-1 !text-sm" @keyup.enter="guardarNuevoNombre" />
                                        <button @click="guardarNuevoNombre" class="bg-emerald-600 text-white p-1.5 rounded-lg hover:scale-105 transition-all">✅</button>
                                        <button @click="editId = null" class="bg-gray-200 text-gray-600 p-1.5 rounded-lg hover:scale-105 transition-all">❌</button>
                                    </div>
                                    <div v-else>
                                        <p class="font-black text-gray-800 text-sm mb-1 flex items-center gap-2">
                                            {{ imp.nombre_reporte }}
                                            <Edit3 size="12" class="text-gray-300 group-hover:text-emerald-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all" @click="iniciarEdicion(imp)" />
                                        </p>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{{ imp.filtros_aplicados || 'Sin filtros específicos' }}</p>
                                    </div>
                                </td>
                                <td class="px-6 py-6 text-sm font-bold text-gray-600">{{ formatFecha(imp.fecha_impresion) }}</td>
                                <td class="px-6 py-6">
                                    <span class="text-xs font-black text-gray-500 uppercase tracking-widest">{{ imp.usuario }}</span>
                                </td>
                                <td class="px-6 py-6">
                                    <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                                        :class="imp.tipo_reporte === 'Individual' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'">
                                        {{ imp.tipo_reporte }}
                                    </span>
                                </td>
                                <td class="px-8 py-6 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button @click="handleReimprimir(imp)" class="btn-action-report btn-view" title="Ver / Descargar">
                                            <Eye size="16" />
                                        </button>
                                        <button @click="confirmarEliminar(imp)" class="btn-action-report btn-delete-report" title="Eliminar del historial">
                                            <Trash2 size="16" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ÁREA DE IMPRESIÓN GRUPAL (HOJA DE RUTA FORMAL) -->
        <div class="hidden print:block bulk-print-layout">
            <!-- Header Institucional con Logo (Igual que solicitudes pendientes/historial) -->
            <div class="print-header-layout">
                <div class="print-logo-container">
                    <img v-if="uiState.logo_institucional" :src="uiState.logo_institucional" />
                    <div v-else class="text-[8px] font-black text-center text-gray-400 p-1 uppercase">
                        Logo <br> Municipal
                    </div>
                </div>
                <div class="flex-1 text-center">
                    <p class="font-black text-lg print-gov">Gobierno Autónomo Municipal de Tarija</p>
                    <p class="font-bold text-sm print-sec">DIRECCION DE OBRAS PUBLICAS MUNICIPALES</p>
                    <p class="text-sm font-medium print-unit">Unidad de Arboricultura y Espacios Verdes</p>
                </div>
            </div>

            <div class="text-center mb-6">
                <h1 class="text-2xl font-black mt-2 print-title">HOJA DE RUTA CONSOLIDADA</h1>
                <div class="flex justify-center gap-4 mt-1 text-[10px] font-bold italic text-gray-600 print-meta">
                    <span>Emisión: {{ new Date().toLocaleString() }}</span>
                    <span>|</span>
                    <span>Generado por: {{ uiState.user?.nombre }}</span>
                </div>
            </div>

            <div class="mb-6 bg-gray-50 border border-gray-300 p-4 rounded flex justify-between items-center text-[11px] font-black">
                <div class="flex gap-6 uppercase">
                    <span>SECTOR: <span class="text-blue-800">{{ getBarrio(filtroBarrio) }}</span></span>
                    <span>ACCIÓN: <span class="text-blue-800">{{ getAccion(filtroAccion) }}</span></span>
                    <span>ESTADO: <span class="text-blue-800">{{ filtroEstado || 'CUALQUIERA' }}</span></span>
                </div>
                <div class="text-lg">TOTAL: {{ solicitudesFiltradas.length }} TRÁMITES</div>
            </div>

            <table class="w-full border-collapse border-2 border-black">
                <thead>
                    <tr class="bg-gray-100 text-[9px] uppercase font-black text-center">
                        <th class="border-2 border-black p-2 w-10 text-center">#</th>
                        <th class="border-2 border-black p-2 w-16">Código</th>
                        <th class="border-2 border-black p-2 w-48 text-left">Solicitante y Ubicación</th>
                        <th class="border-2 border-black p-2 text-left">Detalle de Acción Técnica</th>
                        <th class="border-2 border-black p-2 w-24">Firma Conformidad</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(sol, idx) in solicitudesFiltradas" :key="sol.id_solicitud" class="text-[10px]">
                        <td class="border-2 border-black p-2 text-center font-bold">{{ idx + 1 }}</td>
                        <td class="border-2 border-black p-2 text-center font-black">{{ sol.comunicacion_interna || `#${sol.id_solicitud}` }}</td>
                        <td class="border-2 border-black p-2">
                            <p class="font-black uppercase text-emerald-900 mb-1">{{ sol.solicitante_nombre }}</p>
                            <p class="font-bold">{{ sol.calle }} {{ sol.numero_casa }}</p>
                            <p class="text-[9px] italic">{{ getBarrio(sol.id_barrio) }}</p>
                        </td>
                        <td class="border-2 border-black p-2">
                            <p class="font-bold uppercase text-gray-800">{{ getAccion(sol.id_accion) }}</p>
                            <p class="text-[9px] text-gray-500 mt-1">Ref: {{ sol.referencia }}</p>
                        </td>
                        <td class="border-2 border-black p-2"></td>
                    </tr>
                </tbody>
            </table>

            <!-- Bloque de Firmas -->
            <div class="mt-20 grid grid-cols-3 gap-10 text-center">
                <div class="border-t border-black pt-2">
                    <p class="text-[10px] font-black uppercase">Responsable de Campo</p>
                    <p class="text-[8px] text-gray-400">Firma y Sello</p>
                </div>
                <div class="border-t border-black pt-2">
                    <p class="text-[10px] font-black uppercase">Ing. Cimar Farfan</p>
                    <p class="text-[8px] text-gray-400">Encargado de Arboricultura</p>
                </div>
                <div class="border-t border-black pt-2">
                    <p class="text-[10px] font-black uppercase">Ing. Raul Arteaga</p>
                    <p class="text-[8px] text-gray-400">Jefe de Unidad</p>
                </div>
            </div>

            <div class="mt-12 text-[8px] text-gray-400 italic text-center border-t border-gray-100 pt-4">
                "Este reporte es un documento oficial emitido por el Sistema de Arboricultura del G.A.M.T. Cualquier alteración invalida el registro."
            </div>
        </div>

        <!-- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN CUSTOM PREMIUM -->
        <Teleport to="body">
            <div v-if="showConfirmModal" class="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[99999]">
                <div class="bg-card rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden flex flex-col border border-border animate-prime-in">
                    <!-- Icono de Advertencia -->
                    <div class="p-8 flex flex-col items-center text-center gap-4">
                        <div class="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-2xl select-none">
                            ⚠️
                        </div>
                        <div>
                            <h4 class="text-lg font-black text-main leading-tight">{{ confirmTitle }}</h4>
                            <p class="text-xs text-muted font-semibold mt-2 px-2 leading-relaxed">{{ confirmMessage }}</p>
                        </div>
                    </div>
                    <!-- Botones de Acción -->
                    <div class="p-6 bg-app border-t border-border flex gap-3">
                        <button @click="showConfirmModal = false" 
                            class="flex-1 px-4 py-3 bg-card border border-border rounded-xl font-black text-[10px] uppercase tracking-widest text-muted hover:bg-main/10 transition-all active:scale-95 shadow-sm cursor-pointer">
                            Cancelar
                        </button>
                        <button @click="ejecutarConfirmacion" 
                            class="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.label-mini { @apply block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5; }
.input-modern { @apply w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm font-bold text-gray-700 transition-all; }

.btn-action-report { @apply w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm; }
.btn-view { @apply bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100; }
.btn-delete-report { @apply bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100; }

@media print {
    @page { size: A4 portrait; margin: 1cm; }
    body * { visibility: hidden; }
    .bulk-print-layout, .bulk-print-layout * { visibility: visible; }
    .bulk-print-layout { position: absolute; left: 0; top: 0; width: 100%; }
    .no-print { display: none !important; }

    /* Estilo de Cabecera Formal con Logo */
    .print-header-layout {
        display: flex !important;
        align-items: center !important;
        gap: 24px !important;
        border-bottom: 2pt solid #000 !important;
        padding-bottom: 12px !important;
        margin-bottom: 16px !important;
        width: 100% !important;
    }
    .print-logo-container {
        width: 70pt !important;
        height: 70pt !important;
        flex-shrink: 0 !important;
        border: 1px solid #ccc !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background-color: #fafafa !important;
    }
    .print-logo-container img {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
    }
    .print-gov {
        font-size: 14pt !important;
        font-weight: 900 !important;
        margin: 0 !important;
        line-height: 1.2 !important;
    }
    .print-sec {
        font-size: 10pt !important;
        font-weight: 700 !important;
        margin: 2px 0 0 0 !important;
    }
    .print-unit {
        font-size: 9pt !important;
        font-weight: 500 !important;
        margin: 2px 0 0 0 !important;
    }
    .print-title {
        font-size: 16pt !important;
        font-weight: 900 !important;
        margin-top: 8px !important;
    }
    .print-meta {
        font-size: 8.5pt !important;
        color: #444 !important;
    }
}

.animate-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
