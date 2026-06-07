<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, deleteSolicitud, showToast, registrarImpresion } = mainStore

import { 
    Trash2, Plus, Eye, Printer, Pencil, X, 
    Zap, Leaf, MailOpen, Wrench, AlertTriangle, 
    CheckCircle2, ClipboardList 
} from 'lucide-vue-next'

const solicitudSeleccionada = ref(null)

const abrirDetalle = (sol) => {
    solicitudSeleccionada.value = sol;
}

// Abrir modal en modo edición
const abrirEdicion = (sol) => {
    uiState.editData = { ...sol };   // copia del objeto
    uiState.showModal = true;
}

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

// Confirmar y eliminar
const confirmarEliminar = (sol) => {
    const nombre = sol.solicitante_nombre || `#${sol.id_solicitud}`;
    const cod    = sol.comunicacion_interna || `#${sol.id_solicitud}`;
    
    mostrarConfirmacion(
        'Confirmar Eliminación',
        `¿Eliminar definitivamente el historial de la solicitud "${cod}"?\nEsta acción borrará el registro permanente.`,
        async () => {
            const ok = await deleteSolicitud(sol.id_solicitud);
            if (ok) {
                showToast(`Historial ${cod} eliminado correctamente.`, 'success');
                if (solicitudSeleccionada.value?.id_solicitud == sol.id_solicitud)
                    solicitudSeleccionada.value = null;
            } else {
                showToast('No se pudo eliminar. Revisa la conexión.', 'error');
            }
        }
    );
}

const imprimirReporte = async () => {
    if (solicitudSeleccionada.value) {
        try {
            await registrarImpresion({
                nombre_reporte: `Historial - ${solicitudSeleccionada.value.comunicacion_interna || solicitudSeleccionada.value.id_solicitud}`,
                id_solicitud: solicitudSeleccionada.value.id_solicitud,
                tipo_reporte: 'Individual'
            })
        } catch (e) {
            console.error("Error al registrar impresión:", e)
        }
    }
    window.print();
}

const imprimirDirecto = (sol) => {
    solicitudSeleccionada.value = sol;
    setTimeout(() => {
        imprimirReporte();
    }, 150);
}

const filtroBusqueda = ref('')
const filtroBarrio = ref('')
const filtroAccion = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')

const limpiarFiltros = () => {
    filtroBusqueda.value = ''
    filtroBarrio.value = ''
    filtroAccion.value = ''
    filtroFechaDesde.value = ''
    filtroFechaHasta.value = ''
}

const solicitudesFiltradas = computed(() => {
    return store.solicitudes.filter(sol => {
        // Solo mostrar solicitudes TERMINADAS
        if (sol.estado_tramite !== 'Terminado') return false;

        // 1. Búsqueda de texto global
        let coincideBusqueda = true;
        if (filtroBusqueda.value) {
            const term = filtroBusqueda.value.toLowerCase();
            coincideBusqueda =
                (sol.solicitante_nombre && sol.solicitante_nombre.toLowerCase().includes(term)) ||
                (sol.comunicacion_interna && sol.comunicacion_interna.toLowerCase().includes(term)) ||
                (sol.calle && sol.calle.toLowerCase().includes(term)) ||
                (sol.referencia && sol.referencia.toLowerCase().includes(term));
        }

        // 2. Filtro por Barrio
        let coincideBarrio = true;
        if (filtroBarrio.value) {
            coincideBarrio = sol.id_barrio == filtroBarrio.value;
        }

        // 3. Filtro por Acción
        let coincideAccion = true;
        if (filtroAccion.value) {
            coincideAccion =
                sol.id_accion_solicitada == filtroAccion.value ||
                sol.id_accion == filtroAccion.value;
        }

        // 4. Rango de fechas
        let coincideFecha = true;
        const fechaSol = sol.fecha_ingreso ? new Date(sol.fecha_ingreso) : null;
        if (filtroFechaDesde.value && fechaSol) {
            coincideFecha = coincideFecha && fechaSol >= new Date(filtroFechaDesde.value);
        }
        if (filtroFechaHasta.value && fechaSol) {
            const hasta = new Date(filtroFechaHasta.value);
            hasta.setDate(hasta.getDate() + 1);
            coincideFecha = coincideFecha && fechaSol < hasta;
        }

        return coincideBusqueda && coincideBarrio && coincideAccion && coincideFecha;
    }).sort((a, b) => new Date(b.fecha_ejecucion) - new Date(a.fecha_ejecucion))
})

// --- Lógica de Paginación ---
const paginaActual = ref(1)
const itemsPorPagina = 20

const totalPaginas = computed(() => Math.ceil(solicitudesFiltradas.value.length / itemsPorPagina) || 1)

const solicitudesPaginadas = computed(() => {
    const inicio = (paginaActual.value - 1) * itemsPorPagina
    return solicitudesFiltradas.value.slice(inicio, inicio + itemsPorPagina)
})

const paginasVisibles = computed(() => {
    const total = totalPaginas.value
    const actual = paginaActual.value
    const delta = 2
    let range = []
    for (let i = Math.max(2, actual - delta); i <= Math.min(total - 1, actual + delta); i++) {
        range.push(i)
    }
    range.unshift(1)
    if (total > 1) range.push(total)
    return [...new Set(range)].sort((a,b) => a-b)
})

const getBarrio = (id) => {
    if (!id) return 'N/A';
    const b = store.barrios.find(x => x.id == id)
    return b ? b.nombre : 'N/A'
}

const getAccion = (id) => {
    if (!id) return 'Pendiente'
    const a = store.acciones.find(x => x.id == id)
    return a ? a.nombre : 'Pendiente'
}

const getTecnico = (id) => {
    if (!id) return 'No asignado'
    const t = store.tecnicos.find(x => x.id == id)
    return t ? t.nombre : 'No asignado'
}

const getEspecie = (id) => {
    if (!id) return 'No verificada'
    const e = store.especies.find(x => x.id == id)
    return e ? e.nombre : 'No verificada'
}

const getInstitucion = (id) => {
    if (!id) return 'No corresponde'
    const i = store.instituciones.find(x => x.id == id)
    return i ? i.nombre : 'Desconocida'
}

const formatFecha = (str) => {
    if (!str) return 'No registrada';
    const fecha = new Date(str);
    if (isNaN(fecha.getTime())) return str;
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const diaSemana = dias[fecha.getUTCDay()];
    const d = String(fecha.getUTCDate()).padStart(2, '0');
    const m = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const a = String(fecha.getUTCFullYear()).slice(-2);
    return `${diaSemana} ${d}/${m}/${a}`;
}

const getDistritoByBarrio = (idBarrio) => {
    if (!idBarrio) return '—'
    const b = store.barrios.find(x => x.id == idBarrio)
    if (!b) return '—'
    const d = store.distritos.find(x => x.id == b.id_distrito)
    return d ? d.nombre : '—'
}

const getTipoInstitucion = (idTipo) => {
    if (!idTipo) return 'Particular'
    const t = store.tipos_institucion.find(x => x.id == idTipo)
    return t ? t.nombre : 'Particular'
}

const formatLoSolicitado = (sol) => {
    if (!sol.arboles || sol.arboles.length === 0) {
        const esp = getEspecie(sol.id_especie)
        const acc = getAccion(sol.id_accion_solicitada)
        if (esp === 'No verificada') return acc
        return `${esp} (${acc})`
    }
    const total = sol.arboles.length
    if (total === 1) {
        const esp = getEspecie(sol.arboles[0].id_especie)
        const acc = getAccion(sol.arboles[0].id_accion_solicitada)
        return `${esp} (${acc})`
    }
    const especies = sol.arboles.map(a => getEspecie(a.id_especie)).filter(n => n !== 'No verificada')
    const uniqueEsp = [...new Set(especies)]
    const espStr = uniqueEsp.length > 0 ? uniqueEsp.join(', ') : 'Desconocido'
    return `${espStr} (${total} árboles)`
}

const formatLoDeterminado = (sol) => {
    if (!sol.arboles || sol.arboles.length === 0) {
        const acc = getAccion(sol.id_accion)
        return acc
    }
    const total = sol.arboles.length
    if (total === 1) {
        const acc = getAccion(sol.arboles[0].id_accion_realizar)
        return acc
    }
    const acciones = sol.arboles.map(a => getAccion(a.id_accion_realizar)).filter(n => n !== 'Pendiente')
    const uniqueAcc = [...new Set(acciones)]
    return uniqueAcc.length > 0 ? uniqueAcc.join(', ') : 'Pendiente'
}
</script>

<template>
    <div class="historial-view p-6 space-y-6 text-main animate-fade-in">
        <div id="solicitudes" class="print:hidden">
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-black text-main mb-2">
                        Historial de Solicitudes (Terminadas)
                    </h2>
                    <p class="text-muted">
                        Consulta el registro histórico de todos los trámites finalizados satisfactoriamente
                    </p>
                </div>
            </div>

            <!-- Barra de Filtros Avanzados -->
            <div class="mb-6 bg-card-main rounded-[2rem] border border-main p-6 shadow-sm">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="lg:col-span-2">
                        <label class="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">Búsqueda general</label>
                        <input type="text" v-model="filtroBusqueda" class="search-input w-full" placeholder="Cod interno, solicitante, referencia..." />
                    </div>
                    <div>
                        <label class="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">Barrio</label>
                        <select v-model="filtroBarrio" class="search-input w-full">
                            <option value="">Todos los barrios</option>
                            <option v-for="b in store.barrios" :key="b.id" :value="b.id">{{ b.nombre }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">Tipo de Acción</label>
                        <select v-model="filtroAccion" class="search-input w-full">
                            <option value="">Todas las acciones</option>
                            <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                        </select>
                    </div>
                    <div class="lg:col-span-2">
                        <label class="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">Rango de Fechas de Ingreso</label>
                        <div class="flex items-center gap-2">
                            <input type="date" v-model="filtroFechaDesde" class="search-input flex-1" title="Desde" />
                            <span class="text-muted font-medium text-sm">hasta</span>
                            <input type="date" v-model="filtroFechaHasta" class="search-input flex-1" title="Hasta" />
                        </div>
                    </div>
                    <div class="flex items-end">
                        <button @click="limpiarFiltros" class="w-full px-4 py-3 text-sm text-main border border-main rounded-xl hover:bg-accent-soft transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer">
                            <Trash2 class="w-4 h-4 text-muted" />
                            <span>Limpiar filtros</span>
                        </button>
                    </div>
                </div>
                <div class="mt-3 pt-3 border-t border-main text-xs text-muted">
                    Mostrando <span class="font-bold text-accent">{{ solicitudesFiltradas.length }}</span> trámites finalizados
                </div>
            </div>

            <!-- Table -->
            <div class="card mb-6">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Cód. Interno</th>
                                <th>Ingreso</th>
                                <th>Solicitante</th>
                                <th>Barrio</th>
                                <th>Lo Solicitado</th>
                                <th>Lo Determinado</th>
                                <th>Estado</th>
                                <th>Urgencia</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="solicitudesPaginadas.length === 0">
                                <td colspan="9" class="empty-state text-center p-8">
                                    No hay trámites terminados que coincidan.
                                </td>
                            </tr>
                            <tr v-for="sol in solicitudesPaginadas" :key="sol.id_solicitud">
                                <td class="font-bold text-accent">{{ sol.comunicacion_interna || `#${sol.id_solicitud}` }}</td>
                                <td>{{ formatFecha(sol.fecha_ingreso) }}</td>
                                <td>{{ sol.solicitante_nombre }}</td>
                                <td>{{ getBarrio(sol.id_barrio) }}</td>
                                <td class="truncate max-w-xs" :title="formatLoSolicitado(sol)">{{ formatLoSolicitado(sol) }}</td>
                                <td class="truncate max-w-xs" :title="formatLoDeterminado(sol)">{{ formatLoDeterminado(sol) }}</td>
                                <td>
                                    <span class="badge badge-completed">
                                        {{ sol.estado_tramite }}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge" :class="{
                                        'badge-urgent': sol.nivel_urgencia === 'Alta' || sol.es_emergencia,
                                        'badge-normal': sol.nivel_urgencia === 'Baja' || sol.nivel_urgencia === 'Intermedia'
                                    }">
                                        {{ sol.es_emergencia ? 'EMERGENCIA' : (sol.nivel_urgencia || 'Normal') }}
                                    </span>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-icon btn-ver" @click="abrirDetalle(sol)" title="Ver detalles">
                                            <Eye class="w-4 h-4" />
                                        </button>
                                        <button class="btn-icon btn-print" @click="imprimirDirecto(sol)" title="Imprimir reporte">
                                            <Printer class="w-4 h-4" />
                                        </button>
                                        <button v-if="uiState.user?.role !== 'USER'" class="btn-icon btn-edit" @click="abrirEdicion(sol)" title="Editar registro">
                                            <Pencil class="w-4 h-4" />
                                        </button>
                                        <button v-if="uiState.user?.role === 'ROOT'" class="btn-icon btn-delete" @click="confirmarEliminar(sol)" title="Eliminar definitivamente">
                                            <Trash2 class="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pagination -->
            <div class="flex justify-between items-center bg-card-main p-4 rounded-2xl border border-main no-print">
                <div class="text-xs font-black text-muted uppercase tracking-widest">
                    Página {{ paginaActual }} de {{ totalPaginas }}
                </div>
                <div class="flex gap-2">
                    <button @click="paginaActual--" :disabled="paginaActual === 1" 
                        class="px-4 py-2 bg-card-sec border border-main text-main rounded-xl font-black text-xs uppercase disabled:opacity-50 hover:bg-accent-soft transition-all cursor-pointer">
                        Anterior
                    </button>
                    <button v-for="p in paginasVisibles" :key="p" @click="paginaActual = p"
                        :class="['w-10 h-10 rounded-xl font-black text-xs transition-all cursor-pointer', 
                                 paginaActual === p ? 'bg-accent text-on-accent shadow-lg' : 'bg-card-sec border border-main text-main hover:bg-accent-soft']">
                        {{ p }}
                    </button>
                    <button @click="paginaActual++" :disabled="paginaActual === totalPaginas" 
                        class="px-4 py-2 bg-card-sec border border-main text-main rounded-xl font-black text-xs uppercase disabled:opacity-50 hover:bg-accent-soft transition-all cursor-pointer">
                        Siguiente
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal de Detalles (Reporte) -->
        <div v-if="solicitudSeleccionada" class="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 print:absolute print:inset-auto print:block print:bg-white print:p-0 print:m-0 print:overflow-visible animate-prime-in">
            <div class="bg-card-main border border-main rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative print-area print:max-h-none print:overflow-visible print:shadow-none print:rounded-none">

                <!-- ===== CABECERA FORMAL PARA IMPRESIÓN (A4) ===== -->
                <div class="hidden print:block print-header">
                    <div class="print-institution flex items-center gap-6 border-b-2 border-black pb-4 mb-4">
                        <div class="w-24 h-24 flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                            <img v-if="uiState.logo_institucional" :src="uiState.logo_institucional" class="w-full h-full object-contain">
                            <div v-else class="text-[8px] font-black text-center text-gray-400 p-1 uppercase">
                                Logo <br> Municipal
                            </div>
                        </div>
                        <div class="print-institution-text flex-1 text-center">
                            <p class="print-gov font-black text-lg">Gobierno Autónomo Municipal de Tarija</p>
                            <p class="print-sec font-bold text-sm">DIRECCION DE OBRAS PUBLICAS MUNICIPALES</p>
                            <p class="print-unit text-sm font-medium">Unidad de Arboricultura y Espacios Verdes</p>
                        </div>
                    </div>
                    <div class="print-doc-title text-center">
                        <h1 class="mb-2">REPORTE TÉCNICO DE SOLICITUD</h1>
                        <div class="print-doc-meta flex justify-center items-center gap-3 text-[10px] font-medium text-gray-700">
                            <span>Cod: <strong>{{ solicitudSeleccionada.comunicacion_interna || `#${solicitudSeleccionada.id_solicitud}` }}</strong></span>
                            <span class="text-gray-300">|</span>
                            <span>Estado: <strong>{{ solicitudSeleccionada.estado_tramite || 'En espera' }}</strong></span>
                            <span class="text-gray-300">|</span>
                            <span>Urgencia: <strong>{{ solicitudSeleccionada.es_emergencia ? 'EMERGENCIA' : (solicitudSeleccionada.nivel_urgencia || 'Normal') }}</strong></span>
                            <span class="text-gray-300">|</span>
                            <span>Emisión: <strong>{{ new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }) }} ({{ new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }})</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Header de la tarjeta -->
                <div class="no-print rounded-t-2xl px-6 py-5 flex justify-between items-center" style="background: linear-gradient(135deg, #1a4731, #2d6a4f);">
                    <div>
                        <p class="text-green-200 text-xs font-semibold uppercase tracking-widest mb-1">Trámite de Arboricultura</p>
                        <h2 class="text-white text-xl font-bold">{{ solicitudSeleccionada.comunicacion_interna || `#${solicitudSeleccionada.id_solicitud}` }}</h2>
                        <div class="flex items-center gap-3 mt-2">
                            <span class="text-xs px-2 py-0.5 rounded-full font-semibold text-white bg-emerald-600">
                                {{ solicitudSeleccionada.estado_tramite || 'En espera' }}
                            </span>
                        </div>
                        <!-- Fila de insignias de requerimientos (CENTRALIZADA) -->
                        <div class="flex flex-wrap gap-2 mt-4">
                            <!-- 1. BADGE DE PRIORIDAD CONSOLIDADO -->
                            <span v-if="solicitudSeleccionada.es_emergencia || solicitudSeleccionada.nivel_urgencia === 'Alta' || solicitudSeleccionada.es_urgencia"
                                class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black bg-red-600 text-white shadow-lg shadow-red-900/20 border border-white/20 animate-pulse">
                                <AlertTriangle class="w-3.5 h-3.5 text-white animate-pulse" /> PRIORIDAD CRÍTICA / EMERGENCIA
                            </span>
                            <span v-else-if="solicitudSeleccionada.nivel_urgencia === 'Intermedia'"
                                class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black bg-amber-500 text-white shadow-lg shadow-amber-900/20 border border-white/20">
                                <AlertTriangle class="w-3.5 h-3.5 text-white" /> PRIORIDAD MEDIA
                            </span>
                            <span v-else
                                class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 border border-white/20">
                                <CheckCircle2 class="w-3.5 h-3.5 text-white" /> PRIORIDAD NORMAL
                            </span>

                            <!-- 2. OTROS REQUERIMIENTOS LOGÍSTICOS -->
                            <span v-if="solicitudSeleccionada.procede"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <Leaf class="w-3 h-3 text-emerald-700" /> PROCEDE TRABAJO
                            </span>
                            <span v-if="solicitudSeleccionada.requiere_plataforma"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                                <Wrench class="w-3 h-3 text-blue-700" /> GRÚA/PLATAFORMA
                            </span>
                            <span v-if="solicitudSeleccionada.requiere_setar"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-orange-100 text-orange-700 border border-orange-200">
                                <Zap class="w-3 h-3 text-orange-700" /> CORTE SETAR
                            </span>
                            <span v-if="solicitudSeleccionada.requiere_ficha_tecnica"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200">
                                <ClipboardList class="w-3 h-3 text-indigo-700" /> FICHA TÉCNICA
                            </span>
                            <span v-if="solicitudSeleccionada.arbol_seco"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200">
                                <Leaf class="w-3 h-3 text-amber-700" /> ÁRBOL SECO
                            </span>
                            <span v-if="solicitudSeleccionada.segunda_nota"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                                <MailOpen class="w-3 h-3 text-purple-700" /> SEGUNDA NOTA
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button @click="imprimirReporte" class="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-white/10 cursor-pointer">
                            <Printer class="w-4 h-4" />
                            Imprimir
                        </button>
                        <button @click="solicitudSeleccionada = null" class="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-white/10 cursor-pointer">
                            <X class="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <!-- Cuerpo de la tarjeta (5 SECCIONES FORMALES) -->
                <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-card-main text-main overflow-y-auto max-h-[70vh] custom-scrollbar">

                    <!-- SECCIÓN 01: Información de Ingreso (AZUL) -->
                    <div class="md:col-span-2 bg-blue-50/60 border border-blue-100 rounded-2xl p-6 shadow-sm">
                        <h4 class="flex items-center gap-2 text-[11px] font-black text-blue-800 uppercase tracking-[0.2em] mb-4 border-b border-blue-200 pb-2">
                            <span class="w-2 h-2 bg-blue-500 rounded-full"></span> 01. Información de Ingreso
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-10 text-sm">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Fecha de Ingreso</span>
                                <span class="font-bold text-main">{{ formatFecha(solicitudSeleccionada.fecha_ingreso) }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Comunicación Interna</span>
                                <span class="font-black text-blue-900 bg-card-sec px-2 py-0.5 rounded border border-main w-fit">{{ solicitudSeleccionada.comunicacion_interna || 'S/N' }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Acción Solicitada</span>
                                <span class="font-bold text-main">{{ getAccion(solicitudSeleccionada.id_accion_solicitada) }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Nombre del Solicitante</span>
                                <span class="font-bold text-main">{{ solicitudSeleccionada.solicitante_nombre }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Teléfono</span>
                                <span class="font-bold text-main">{{ solicitudSeleccionada.solicitante_telefono || '—' }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Tipo de Institución</span>
                                <span class="font-bold text-main">{{ getTipoInstitucion(solicitudSeleccionada.id_tipo_institucion) }}</span>
                            </div>
                            <div class="md:col-span-3 flex flex-col border-t border-main pt-2">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Nombre de Institución</span>
                                <span class="font-bold text-main uppercase text-xs">{{ getInstitucion(solicitudSeleccionada.id_nombre_institucional) }}</span>
                            </div>
                            <div class="md:col-span-3 bg-card-sec p-4 rounded-xl border border-main text-main">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 block">Nota de Solicitud / Descripción</span>
                                <p class="text-main italic leading-relaxed font-medium">"{{ solicitudSeleccionada.solicitante_descripcion || 'Sin descripción adicional.' }}"</p>
                            </div>
                        </div>
                    </div>

                             <div class="md:col-span-2 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-6 shadow-sm">
                        <h4 class="flex items-center gap-2 text-[11px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-4 border-b border-emerald-200 pb-2">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> 02. Localización y Referencia
                        </h4>
                        <div class="space-y-4 text-sm">
                            <div class="flex justify-between items-center pb-2 border-b border-main">
                                <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Distrito Municipal</span>
                                <span class="font-bold text-main">{{ getDistritoByBarrio(solicitudSeleccionada.id_barrio) }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-main">
                                <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Barrio / Zona</span>
                                <span class="font-bold text-main text-right">{{ getBarrio(solicitudSeleccionada.id_barrio) }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-main">
                                <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Calle / Avenida</span>
                                <span class="font-bold text-main text-right">{{ solicitudSeleccionada.calle }} {{ solicitudSeleccionada.numero_casa ? 'Nº '+solicitudSeleccionada.numero_casa : '' }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-main">
                                <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Coordenadas GPS</span>
                                <span class="font-bold text-main text-right">
                                    <a v-if="solicitudSeleccionada.lat && solicitudSeleccionada.lng" 
                                       :href="`https://www.google.com/maps?q=${solicitudSeleccionada.lat},${solicitudSeleccionada.lng}`" 
                                       target="_blank" 
                                       class="text-blue-600 underline hover:text-blue-800 transition-colors">
                                        {{ solicitudSeleccionada.lat }}, {{ solicitudSeleccionada.lng }}
                                    </a>
                                    <span v-else class="text-muted italic">No registrado</span>
                                </span>
                            </div>
                            <div class="flex flex-col pt-1">
                                <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Punto de Referencia Exacto</span>
                                <span class="font-bold text-main bg-card-sec p-3 rounded-lg border border-main">{{ solicitudSeleccionada.referencia || '—' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 03: Diagnóstico y Lista de Árboles (GRIS) -->
                    <div class="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h4 class="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2">
                            <span class="w-2 h-2 bg-slate-600 rounded-full"></span> 03. Diagnóstico Técnico y Detalle de Árboles
                        </h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-4">
                            <div class="flex justify-between items-center pb-2 border-b border-main">
                                <span class="text-[9px] font-black text-muted uppercase tracking-widest">Técnico Evaluador</span>
                                <span class="font-bold text-main">{{ getTecnico(solicitudSeleccionada.id_tecnico_verificacion) }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-main">
                                <span class="text-[9px] font-black text-muted uppercase tracking-widest">Fecha Verificación</span>
                                <span class="font-bold text-main">{{ formatFecha(solicitudSeleccionada.fecha_verificacion) }}</span>
                            </div>
                        </div>

                        <!-- Tabla de Árboles Relacionados -->
                        <div class="overflow-x-auto bg-card-sec rounded-xl border border-main shadow-sm p-4 mb-4">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="border-b border-main bg-card-main text-[10px] uppercase tracking-wider text-muted">
                                        <th class="py-2 px-3">#</th>
                                        <th class="py-2 px-3 text-main">Especie</th>
                                        <th class="py-2 px-3 text-main">Acción Solicitada</th>
                                        <th class="py-2 px-3 text-main">Acción a Realizar (Inspección)</th>
                                        <th class="py-2 px-3 text-main">Observaciones del Árbol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(arb, idx) in solicitudSeleccionada.arboles" :key="idx" class="border-b border-main last:border-0 hover:bg-accent-soft">
                                        <td class="py-2.5 px-3 font-bold text-muted">{{ idx + 1 }}</td>
                                        <td class="py-2.5 px-3 font-black text-accent">{{ getEspecie(arb.id_especie) }}</td>
                                        <td class="py-2.5 px-3 text-main">{{ getAccion(arb.id_accion_solicitada) }}</td>
                                        <td class="py-2.5 px-3 font-bold text-main">{{ getAccion(arb.id_accion_realizar) }}</td>
                                        <td class="py-2.5 px-3 text-muted italic">{{ arb.observaciones_arbol || 'Sin observaciones.' }}</td>
                                    </tr>
                                    <tr v-if="!solicitudSeleccionada.arboles || solicitudSeleccionada.arboles.length === 0">
                                        <td colspan="5" class="py-3 text-center text-muted font-medium bg-card-main">Ningún árbol registrado.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="flex flex-col pt-1">
                            <span class="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Informe de Verificación General</span>
                            <span class="font-medium text-main italic bg-card-sec p-3 rounded-lg border border-main">"{{ solicitudSeleccionada.observacion_verificacion || 'Sin observaciones técnicas generales registradas.' }}"</span>
                        </div>
                    </div>

                    <!-- SECCIÓN 04: Logística y Requerimientos (ÁMBAR) -->
                    <div class="md:col-span-2 bg-amber-50/60 border border-amber-200 rounded-2xl p-6 shadow-sm">
                        <h4 class="flex items-center gap-2 text-[11px] font-black text-amber-800 uppercase tracking-[0.2em] mb-4 border-b border-amber-200 pb-2">
                            <span class="w-2 h-2 bg-amber-500 rounded-full"></span> 04. Apoyo Logístico y Alertas
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                            <div class="flex justify-between items-center py-1 border-b border-main">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">🏗️ ¿Requiere Grúa / Plataforma?</span>
                                <span class="font-black" :class="solicitudSeleccionada.requiere_plataforma ? 'text-blue-600' : 'text-muted'">{{ solicitudSeleccionada.requiere_plataforma ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-main">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">⚡ ¿Requiere Corte SETAR?</span>
                                <span class="font-black" :class="solicitudSeleccionada.requiere_setar ? 'text-orange-600' : 'text-muted'">{{ solicitudSeleccionada.requiere_setar ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-main">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">📄 ¿Requiere Ficha Técnica?</span>
                                <span class="font-black" :class="solicitudSeleccionada.requiere_ficha_tecnica ? 'text-indigo-600' : 'text-muted'">{{ solicitudSeleccionada.requiere_ficha_tecnica ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-main">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">🌵 ¿Es Árbol Seco?</span>
                                <span class="font-black" :class="solicitudSeleccionada.arbol_seco ? 'text-amber-700' : 'text-muted'">{{ solicitudSeleccionada.arbol_seco ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-main">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">🚨 ¿Es Emergencia / Urgencia?</span>
                                <span class="font-black" :class="solicitudSeleccionada.es_emergencia || solicitudSeleccionada.es_urgencia ? 'text-red-600' : 'text-muted'">{{ (solicitudSeleccionada.es_emergencia || solicitudSeleccionada.es_urgencia) ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-main">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">✅ ¿Procede Trabajo?</span>
                                <span class="font-black" :class="solicitudSeleccionada.procede ? 'text-emerald-600' : 'text-muted'">{{ solicitudSeleccionada.procede ? 'SÍ' : 'NO' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 05: Cierre de Trámite (PÚRPURA) -->
                    <div id="print-seccion-5" class="md:col-span-2 bg-purple-50/60 border border-purple-200 rounded-2xl p-6 shadow-sm">
                        <h4 class="flex items-center gap-2 text-[11px] font-black text-purple-900 uppercase tracking-[0.2em] mb-4 border-b border-purple-200 pb-2">
                            <span class="w-2 h-2 bg-purple-500 rounded-full"></span> 05. Ejecución y Cierre Final
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Estado Administrativo</span>
                                <span class="font-black uppercase text-xl" :class="solicitudSeleccionada.estado_tramite === 'Terminado' ? 'text-emerald-600' : 'text-purple-600'">
                                    {{ solicitudSeleccionada.estado_tramite }}
                                </span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Encargado de Ejecución</span>
                                <span class="font-bold text-main uppercase text-xs">{{ getTecnico(solicitudSeleccionada.id_tecnico_ejecucion) }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Fecha de Finalización</span>
                                <span class="font-bold text-main">{{ formatFecha(solicitudSeleccionada.fecha_ejecucion) }}</span>
                            </div>
                            <div class="md:col-span-3 bg-card-sec p-4 rounded-xl border border-main text-main">
                                <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2 block">Reporte Final de Obra</span>
                                <p class="text-gray-700 font-semibold leading-relaxed">"{{ solicitudSeleccionada.observaciones_finales || 'Expediente sin reporte de cierre final.' }}"</p>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Firmas para Impresión -->
                <div class="hidden print:block print-firmas">
                    <!-- Nota de Descargo Formal -->
                    <div class="border-t border-b border-main py-3 mb-6">
                        <p class="text-[9px] text-muted italic text-center leading-tight">
                            "<strong>IMPORTANTE:</strong> Este documento es un reporte técnico formal con respaldo íntegro en la base de datos municipal del Sistema de Arboricultura. 
                            Se ruega verificar la exactitud de todos los datos y referencias técnicas antes de proceder con la firma de conformidad correspondiente."
                        </p>
                    </div>

                    <!-- Linea de firmas -->
                    <div class="print-firmas-row">
                        <div class="print-firma">
                            <div class="print-firma-linea"></div>
                            <p class="print-firma-nombre">{{ getTecnico(solicitudSeleccionada.id_tecnico_ejecucion) || 'Técnico Asignado' }}</p>
                            <p class="print-firma-cargo">Responsable de Trabajo</p>
                        </div>
                        <div class="print-firma">
                            <div class="print-firma-linea"></div>
                            <p class="print-firma-nombre">Ing. Cimar Farfan</p>
                            <p class="print-firma-cargo">Encargado de Arboricultura</p>
                        </div>
                        <div class="print-firma">
                            <div class="print-firma-linea"></div>
                            <p class="print-firma-nombre">Ing. Raul Arteaga</p>
                            <p class="print-firma-cargo">Jefe de Unidad</p>
                        </div>
                    </div>

                    <!-- Pie de Página (Contador de Hojas) -->
                    <div class="no-print mt-8 pt-4 border-t border-main flex justify-between items-center text-[8px] text-muted font-bold uppercase tracking-widest">
                        <span>Sistema de Gestión de Arboricultura y Espacios Verdes - G.A.M.T.</span>
                        <div class="print-counter">Página <span class="pageNumber"></span></div>
                    </div>
                </div>

                <div class="no-print px-6 py-4 border-t border-main flex justify-end bg-card-main rounded-b-2xl">
                    <button @click="solicitudSeleccionada = null" class="px-5 py-2.5 bg-accent text-on-accent hover:opacity-90 rounded-xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer">Cerrar</button>
                </div>
            </div>
        </div>
        
        <!-- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN CUSTOM PREMIUM -->
        <Teleport to="body">
            <div v-if="showConfirmModal" class="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[99999]">
                <div class="bg-card-main border border-main rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden flex flex-col animate-prime-in">
                    <!-- Icono de Advertencia -->
                    <div class="p-8 flex flex-col items-center text-center gap-4 bg-card-main text-main">
                        <div class="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-2xl select-none">
                            ⚠️
                        </div>
                        <div>
                            <h4 class="text-lg font-black text-main leading-tight">{{ confirmTitle }}</h4>
                            <p class="text-xs text-muted font-semibold mt-2 px-2 leading-relaxed">{{ confirmMessage }}</p>
                        </div>
                    </div>
                    <!-- Botones de Acción -->
                    <div class="p-6 bg-card-main border-t border-main flex gap-3">
                        <button @click="showConfirmModal = false" 
                            class="flex-1 px-4 py-3 bg-card-sec border border-main rounded-xl font-black text-[10px] uppercase tracking-widest text-main hover:bg-accent-soft transition-all active:scale-95 shadow-sm cursor-pointer">
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

<style>
@media print {
    /* REGLA MAESTRA: Solo el contenido del reporte es visible */
    html, body { 
        height: auto !important; 
        overflow: visible !important; 
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
        font-size: 8.5pt !important; /* Fuente más pequeña global */
    }
    
    #app, .app-container, .flex-1, main, main > div, .historial-view, #solicitudes-parent { 
        display: block !important; 
        overflow: visible !important; 
        height: auto !important; 
        min-height: 0 !important;
        max-height: none !important;
        position: static !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
    }
    
    #solicitudes, .sidebar, .header-bar, .no-print, .bg-black\/50, button, .custom-scrollbar::-webkit-scrollbar {
        display: none !important;
    }

    @page {
        size: A4 portrait;
        margin: 0.6cm 0.8cm 1.2cm 0.8cm; /* Márgenes con espacio inferior para el pie */
    }
    
    @page {
        @bottom-left {
            content: "Sistema de Gestión de Arboricultura y Espacios Verdes - G.A.M.T.";
            font-size: 8px;
            font-family: inherit;
            color: #9ca3af;
            font-weight: bold;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        @bottom-right {
            content: "Página " counter(page);
            font-size: 8px;
            font-family: inherit;
            color: #9ca3af;
            font-weight: bold;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
    }

    /* RESET DEL MODAL PARA QUE FLUYA EN EL PDF */
    .fixed.inset-0 {
        position: static !important;
        display: block !important;
        background: white !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
    }

    .print-area {
        display: block !important;
        width: 100% !important;
        max-width: none !important;
        background: white !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        max-height: none !important;
    }

    /* FORZAR QUE EL CUERPO DEL REPORTE SE VEA COMPLETO */
    .print-area .p-8,
    .print-area .overflow-y-auto {
        display: block !important;
        overflow: visible !important;
        max-height: none !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    /* Permitir grid de 2 columnas en print para ahorrar espacio vertical */
    .print-area .grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 10pt !important;
        overflow: visible !important;
    }
    
    .md\:col-span-2 {
        grid-column: span 2 / span 2 !important;
    }

    /* CABECERA MÁS COMPACTA */
    .print-header {
        display: block !important;
        border-bottom: 2pt solid #1a4731;
        margin-bottom: 8pt;
        padding-bottom: 5pt;
    }
    .print-institution img { height: 60pt !important; width: 60pt !important; }
    .print-gov { font-size: 11pt !important; }
    .print-sec, .print-unit { font-size: 8pt !important; }

    /* ESTILO DE LAS 5 SECCIONES MÁS COMPACTO */
    .bg-blue-50\/60, .bg-emerald-50\/60, .bg-amber-50\/60, .bg-purple-50\/60, div.bg-slate-50 {
        display: block !important;
        width: 100% !important;
        margin-bottom: 8pt !important; /* Menos espacio entre secciones */
        padding: 8pt !important; /* Menos padding interno */
        border: 0.5pt solid #aaa !important;
        background-color: #fff !important;
        page-break-inside: avoid;
        break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    /* Forzar legibilidad */
    .text-gray-800, .text-gray-700, span, p { color: #000 !important; font-size: 8.5pt !important; }
    h4 { border-bottom: 0.5pt solid #1a4731 !important; color: #1a4731 !important; margin-bottom: 5pt !important; font-size: 9pt !important; padding-bottom: 2pt !important; }

    /* Requerimientos y Firmas */
    .print-firmas { display: block !important; margin-top: 15pt; }
    .print-firmas-row { display: flex; justify-content: space-around; margin-top: 15pt; }

    .print-firma { 
        text-align: center; 
        width: 150pt; 
    }
    .print-firma-linea {
        width: 100%;
        border-bottom: 0.8pt solid #000;
        margin: 0 auto 5pt;
        height: 45pt; /* Menos espacio para firmas */
    }
    .print-firma-nombre {
        font-size: 8pt;
        font-weight: 800;
        margin: 0;
    }
    .print-firma-cargo {
        font-size: 7.5pt;
        color: #333;
        margin: 1pt 0 0;
        text-transform: uppercase;
    }

    /* Estilos específicos para la tabla de árboles en impresión */
    .print-area table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-top: 8pt !important;
        margin-bottom: 8pt !important;
    }
    .print-area th, .print-area td {
        border: 0.5pt solid #ddd !important;
        padding: 5pt 6pt !important;
        font-size: 8pt !important;
        text-align: left !important;
    }
    .print-area th {
        background-color: #f3f4f6 !important;
        color: #000 !important;
        font-weight: bold !important;
    }

    /* Salto de página para Sección 5 */
    #print-seccion-5 {
        break-before: auto !important;
        margin-top: 8pt !important;
    }

    /* Contador de Páginas */
    .print-counter {
        display: block !important;
    }
    .pageNumber::after {
        content: counter(page);
    }
}
</style>

<style scoped>
@reference "tailwindcss";
.badge-completed { @apply bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase; }

/* ===== BOTONES ACCION TABLA ===== */
.btn-ver, .btn-print, .btn-edit, .btn-delete {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 7px;
    border: none; cursor: pointer; transition: all 0.18s ease; padding: 0;
}
.btn-ver svg, .btn-print svg, .btn-edit svg, .btn-delete svg { width: 15px; height: 15px; }
.btn-ver    { background: #d8f3dc; color: #1a4731; }
.btn-ver:hover    { background: #74c69d; color: #0f2e1e; transform: translateY(-1px); }
.btn-print   { background: #e0f2fe; color: #0369a1; }
.btn-print:hover   { background: #bae6fd; color: #075985; transform: translateY(-1px); }
.btn-edit   { background: #fef3c7; color: #92400e; }
.btn-edit:hover   { background: #fde68a; color: #78350f; transform: translateY(-1px); }
.btn-delete { background: #fee2e2; color: #991b1b; }
.btn-delete:hover { background: #fca5a5; color: #7f1d1d; transform: translateY(-1px); }

.search-input {
    background-color: var(--input-bg) !important;
    border: 2px solid var(--border) !important;
    color: var(--text-main) !important;
    border-radius: 1rem;
    padding: 0.6rem 1rem;
    font-weight: 600;
    outline: none;
    transition: all 0.2s ease;
}
.search-input:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 4px var(--accent-soft);
}

/* Theme Adaptive Overrides for colored blocks */
:global(.theme-black) .bg-blue-50\/60 { background-color: rgba(59, 130, 246, 0.1) !important; border-color: rgba(59, 130, 246, 0.2) !important; }
:global(.theme-black) .bg-emerald-50\/60 { background-color: rgba(16, 185, 129, 0.1) !important; border-color: rgba(16, 185, 129, 0.2) !important; }
:global(.theme-black) .bg-amber-50\/60 { background-color: rgba(245, 158, 11, 0.1) !important; border-color: rgba(245, 158, 11, 0.2) !important; }
:global(.theme-black) .bg-purple-50\/60 { background-color: rgba(139, 92, 246, 0.1) !important; border-color: rgba(139, 92, 246, 0.2) !important; }
:global(.theme-black) div.bg-slate-50 { background-color: var(--bg-card-sec) !important; border-color: var(--border-sec) !important; }

:global(.theme-colors) .bg-blue-50\/60 { background-color: rgba(30, 144, 255, 0.08) !important; border-color: rgba(30, 144, 255, 0.15) !important; }
:global(.theme-colors) .bg-emerald-50\/60 { background-color: rgba(46, 125, 50, 0.08) !important; border-color: rgba(46, 125, 50, 0.15) !important; }
:global(.theme-colors) .bg-amber-50\/60 { background-color: rgba(245, 158, 11, 0.08) !important; border-color: rgba(245, 158, 11, 0.15) !important; }
:global(.theme-colors) .bg-purple-50\/60 { background-color: rgba(139, 92, 246, 0.08) !important; border-color: rgba(139, 92, 246, 0.15) !important; }
:global(.theme-colors) div.bg-slate-50 { background-color: var(--bg-card-sec) !important; border-color: var(--border-sec) !important; }

:global(.theme-black) .btn-ver { background: rgba(16, 185, 129, 0.2) !important; color: #10b981 !important; }
:global(.theme-black) .btn-ver:hover { background: rgba(16, 185, 129, 0.4) !important; color: #fff !important; }
:global(.theme-black) .btn-print { background: rgba(59, 130, 246, 0.2) !important; color: #3b82f6 !important; }
:global(.theme-black) .btn-print:hover { background: rgba(59, 130, 246, 0.4) !important; color: #fff !important; }
:global(.theme-black) .btn-edit { background: rgba(245, 158, 11, 0.2) !important; color: #f59e0b !important; }
:global(.theme-black) .btn-edit:hover { background: rgba(245, 158, 11, 0.4) !important; color: #fff !important; }
:global(.theme-black) .btn-delete { background: rgba(239, 68, 68, 0.2) !important; color: #ef4444 !important; }
:global(.theme-black) .btn-delete:hover { background: rgba(239, 68, 68, 0.4) !important; color: #fff !important; }

:global(.theme-colors) .btn-ver { background: rgba(30, 144, 255, 0.1) !important; color: #1e90ff !important; }
:global(.theme-colors) .btn-ver:hover { background: rgba(30, 144, 255, 0.3) !important; color: #fff !important; }
:global(.theme-colors) .btn-print { background: rgba(30, 144, 255, 0.1) !important; color: #1e90ff !important; }
:global(.theme-colors) .btn-print:hover { background: rgba(30, 144, 255, 0.3) !important; color: #fff !important; }
:global(.theme-colors) .btn-edit { background: rgba(245, 158, 11, 0.1) !important; color: #f59e0b !important; }
:global(.theme-colors) .btn-edit:hover { background: rgba(245, 158, 11, 0.3) !important; color: #fff !important; }
:global(.theme-colors) .btn-delete { background: rgba(239, 68, 68, 0.1) !important; color: #ef4444 !important; }
:global(.theme-colors) .btn-delete:hover { background: rgba(239, 68, 68, 0.3) !important; color: #fff !important; }
</style>
