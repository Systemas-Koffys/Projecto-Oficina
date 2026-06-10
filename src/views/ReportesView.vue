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
    <div class="reportes-view p-6 max-w-[1400px] mx-auto text-main animate-in">
        
        <!-- Header del Centro de Reportes -->
        <div class="mb-8 flex justify-between items-center no-print">
            <div>
                <h2 class="text-3xl font-black text-main tracking-tight flex items-center gap-3">
                    <FileText class="text-accent w-8 h-8" />
                    Centro de Reportes e Inteligencia
                </h2>
                <p class="text-muted font-medium mt-1">Generación de hojas de ruta, auditoría de impresiones y consolidación de datos.</p>
            </div>
            
            <div class="flex bg-card-sec p-1 rounded-2xl border border-main">
                <button @click="activeTab = 'generador'" 
                    :class="activeTab === 'generador' ? 'bg-card-main text-accent shadow-md scale-105 border border-main' : 'text-muted hover:bg-card-main/50'"
                    class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer">
                    <Printer size="18" /> Generador
                </button>
                <button @click="activeTab = 'historial'" 
                    :class="activeTab === 'historial' ? 'bg-card-main text-accent shadow-md scale-105 border border-main' : 'text-muted hover:bg-card-main/50'"
                    class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer">
                    <History size="18" /> Historial
                </button>
            </div>
        </div>

        <!-- VISTA GENERADOR: HOJAS DE RUTA -->
        <div v-if="activeTab === 'generador'" class="no-print animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                <!-- Panel de Filtros (Lateral) -->
                <div class="lg:col-span-1 space-y-6">
                    <div class="bg-card-main border border-main rounded-3xl shadow-sm p-6 overflow-hidden relative text-main">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-accent-soft rounded-full -mr-16 -mt-16 opacity-30"></div>
                        
                        <h3 class="text-xs font-black text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
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
                            class="w-full mt-8 bg-accent text-on-accent py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer">
                            <Printer size="18" /> Generar y Registrar
                        </button>
                    </div>

                    <div class="bg-accent rounded-3xl p-6 text-on-accent shadow-xl relative overflow-hidden">
                        <div class="relative z-10">
                            <p class="opacity-80 text-[10px] font-black uppercase tracking-widest mb-2">Resumen de Carga</p>
                            <h4 class="text-4xl font-black text-on-accent">{{ solicitudesFiltradas.length }}</h4>
                            <p class="opacity-90 text-sm font-medium">Trámites compilados</p>
                        </div>
                        <FileText class="absolute bottom-0 right-0 -mb-4 -mr-4 w-24 h-24 opacity-10" />
                    </div>
                </div>

                <!-- Tabla de Previsualización (Principal) -->
                <div class="lg:col-span-3">
                    <div class="bg-card-main border border-main rounded-3xl shadow-sm overflow-hidden min-h-[600px]">
                        <div class="px-8 py-6 border-b border-main flex justify-between items-center bg-card-sec">
                            <h4 class="font-black text-main text-sm uppercase tracking-widest">Previsualización de Hoja de Ruta</h4>
                            <span class="text-xs font-bold text-accent bg-accent-soft px-3 py-1 rounded-full border border-main">
                                Documento Consolidado
                            </span>
                        </div>

                        <div class="overflow-x-auto text-main">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="text-[10px] font-black uppercase text-muted tracking-widest border-b border-main">
                                        <th class="px-8 py-4 w-12 text-center border-b border-main">#</th>
                                        <th class="px-8 py-4 border-b border-main">Código / Solicitante</th>
                                        <th class="px-6 py-4 border-b border-main">Ubicación Exacta</th>
                                        <th class="px-6 py-4 border-b border-main">Acción Técnica</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="solicitudesFiltradas.length === 0" class="text-center py-20 bg-card-main">
                                        <td colspan="4" class="py-32 bg-card-main border-none">
                                            <div class="flex flex-col items-center opacity-20 bg-card-main">
                                                <Search size="64" />
                                                <p class="font-black text-xl mt-4">Sin resultados con estos filtros</p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr v-for="(sol, idx) in solicitudesFiltradas" :key="sol.id_solicitud" class="group border-b border-main hover:bg-accent-soft transition-all">
                                        <td class="px-8 py-5 text-center font-bold text-muted border-b border-main bg-card-sec group-hover:bg-accent-soft">{{ idx + 1 }}</td>
                                        <td class="px-8 py-5 border-b border-main">
                                            <p class="font-black text-accent text-sm mb-0.5">{{ sol.comunicacion_interna || `#${sol.id_solicitud}` }}</p>
                                            <p class="text-xs text-muted font-bold uppercase tracking-tighter">{{ sol.solicitante_nombre }}</p>
                                        </td>
                                        <td class="px-6 py-5 border-b border-main">
                                            <p class="text-sm font-bold text-main">{{ sol.calle }} {{ sol.numero_casa }}</p>
                                            <p class="text-[10px] text-muted font-black uppercase tracking-widest">{{ getBarrio(sol.id_barrio) }}</p>
                                        </td>
                                        <td class="px-6 py-5 border-b border-main">
                                            <span class="text-xs font-bold text-main">{{ getAccion(sol.id_accion) }}</span>
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
            <div class="bg-card-main border border-main rounded-[2.5rem] shadow-sm overflow-hidden">
                <div class="overflow-x-auto text-main">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-card-sec text-[10px] font-black uppercase text-muted tracking-widest border-b border-main">
                                <th class="px-8 py-6 border-b border-main">ID / Referencia del Reporte</th>
                                <th class="px-6 py-6 border-b border-main">Fecha y Hora</th>
                                <th class="px-6 py-6 border-b border-main">Generado por</th>
                                <th class="px-6 py-6 border-b border-main">Tipo</th>
                                <th class="px-8 py-6 text-right border-b border-main">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="store.impresiones.length === 0">
                                <td colspan="5" class="py-40 text-center opacity-30 bg-card-main">
                                    <History size="64" class="mx-auto mb-4 text-muted" />
                                    <p class="font-black text-xl uppercase tracking-widest text-main">No hay historial registrado</p>
                                </td>
                            </tr>
                            <tr v-for="imp in store.impresiones" :key="imp.id" class="border-b border-main hover:bg-accent-soft transition-all group">
                                <td class="px-8 py-6 border-b border-main">
                                    <div v-if="editId === imp.id" class="flex gap-2 items-center">
                                        <input v-model="editNombre" class="input-modern !py-1 !text-sm" @keyup.enter="guardarNuevoNombre" />
                                        <button @click="guardarNuevoNombre" class="bg-emerald-600 text-white p-1.5 rounded-lg hover:scale-105 transition-all cursor-pointer">✅</button>
                                        <button @click="editId = null" class="bg-gray-200 text-gray-600 p-1.5 rounded-lg hover:scale-105 transition-all cursor-pointer">❌</button>
                                    </div>
                                    <div v-else>
                                        <p class="font-black text-main text-sm mb-1 flex items-center gap-2">
                                            {{ imp.nombre_reporte }}
                                            <Edit3 size="12" class="text-muted group-hover:text-emerald-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all" @click="iniciarEdicion(imp)" />
                                        </p>
                                        <p class="text-[10px] text-muted font-bold uppercase tracking-tighter">{{ imp.filtros_aplicados || 'Sin filtros específicos' }}</p>
                                    </div>
                                </td>
                                <td class="px-6 py-6 text-sm font-bold text-muted border-b border-main">{{ formatFecha(imp.fecha_impresion) }}</td>
                                <td class="px-6 py-6 border-b border-main">
                                    <span class="text-xs font-black text-muted uppercase tracking-widest">{{ imp.usuario }}</span>
                                </td>
                                <td class="px-6 py-6 border-b border-main">
                                    <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                                        :class="imp.tipo_reporte === 'Individual' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'">
                                        {{ imp.tipo_reporte }}
                                    </span>
                                </td>
                                <td class="px-8 py-6 text-right border-b border-main">
                                    <div class="flex justify-end gap-2">
                                        <button @click="handleReimprimir(imp)" class="btn-action-report btn-view cursor-pointer" title="Ver / Descargar">
                                            <Eye size="16" />
                                        </button>
                                        <button @click="confirmarEliminar(imp)" class="btn-action-report btn-delete-report cursor-pointer" title="Eliminar del historial">
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
        <Transition name="fade-confirm">
        <div v-if="showConfirmModal" class="fixed inset-0 bg-gray-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
            <div class="bg-card-main rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-main scale-in">
                <!-- Cabecera Roja de Peligro -->
                <div class="modal-header-danger p-8 flex flex-col items-center text-center text-white border-b border-red-900/20">
                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                        <AlertTriangle class="w-8 h-8 text-white" />
                    </div>
                    <h3 class="font-black text-lg tracking-tight text-white">{{ confirmTitle }}</h3>
                    <p class="text-red-100/80 text-[10px] font-bold uppercase tracking-widest mt-1">Acción Irreversible</p>
                </div>

                <!-- Cuerpo del modal -->
                <div class="p-6 text-center space-y-3 bg-card-main">
                    <p class="text-main text-sm font-bold leading-relaxed">
                        {{ confirmMessage }}
                    </p>
                </div>

                <!-- Botones de Acción -->
                <div class="px-6 pb-6 flex gap-3 bg-card-main">
                    <button @click="showConfirmModal = false"
                        class="flex-1 py-3 rounded-xl border-2 border-main font-black text-muted uppercase text-xs tracking-widest hover:bg-card-sec transition-all cursor-pointer">
                        Cancelar
                    </button>
                    <button @click="ejecutarConfirmacion"
                        class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all cursor-pointer">
                        Sí, Eliminar
                    </button>
                </div>
            </div>
        </div>
        </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.label-mini {
    @apply block text-[10px] font-black uppercase tracking-widest mb-1.5;
    color: var(--text-muted);
}
.input-modern {
    @apply w-full px-4 py-3 rounded-2xl border outline-none text-sm font-bold transition-all;
    background-color: var(--input-bg) !important;
    border: 2px solid var(--border) !important;
    color: var(--text-main) !important;
}
.input-modern:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 4px var(--accent-soft);
}

.btn-action-report { @apply w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm; }
.btn-view { @apply bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100; }
.btn-delete-report { @apply bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100; }

/* Theme Adaptive Overrides for colored blocks and buttons */
:global(.theme-black) .btn-view { background: rgba(59, 130, 246, 0.2) !important; color: #3b82f6 !important; }
:global(.theme-black) .btn-view:hover { background: rgba(59, 130, 246, 0.4) !important; color: #fff !important; }
:global(.theme-black) .btn-delete-report { background: rgba(239, 68, 68, 0.2) !important; color: #ef4444 !important; }
:global(.theme-black) .btn-delete-report:hover { background: rgba(239, 68, 68, 0.4) !important; color: #fff !important; }

:global(.theme-colors) .btn-view { background: rgba(30, 144, 255, 0.1) !important; color: #1e90ff !important; }
:global(.theme-colors) .btn-view:hover { background: rgba(30, 144, 255, 0.3) !important; color: #fff !important; }
:global(.theme-colors) .btn-delete-report { background: rgba(239, 68, 68, 0.1) !important; color: #ef4444 !important; }
:global(.theme-colors) .btn-delete-report:hover { background: rgba(239, 68, 68, 0.3) !important; color: #fff !important; }

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
