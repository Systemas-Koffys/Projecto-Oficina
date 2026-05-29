<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, deleteSolicitud, showToast, registrarImpresion } = mainStore

const solicitudSeleccionada = ref(null)

const abrirDetalle = (sol) => {
    solicitudSeleccionada.value = sol;
}

// Abrir modal en modo edición
const abrirEdicion = (sol) => {
    uiState.editData = { ...sol };   // copia del objeto
    uiState.showModal = true;
}

// Confirmar y eliminar
const confirmarEliminar = async (sol) => {
    const nombre = sol.solicitante_nombre || `#${sol.id_solicitud}`;
    const cod    = sol.comunicacion_interna || `#${sol.id_solicitud}`;
    if (!confirm(`¿Eliminar la solicitud "${cod}" de ${nombre}?\nEsta acción no se puede deshacer.`)) return;
    const ok = await deleteSolicitud(sol.id_solicitud);
    if (ok) {
        showToast(`Solicitud ${cod} eliminada correctamente.`, 'success');
        if (solicitudSeleccionada.value?.id_solicitud == sol.id_solicitud)
            solicitudSeleccionada.value = null;
    } else {
        showToast('No se pudo eliminar. Revisa la conexión.', 'error');
    }
}

const imprimirReporte = async () => {
    if (solicitudSeleccionada.value) {
        try {
            await registrarImpresion({
                nombre_reporte: `Reporte Individual - ${solicitudSeleccionada.value.comunicacion_interna || solicitudSeleccionada.value.id_solicitud}`,
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
    // Pequeño delay para asegurar que el modal se renderice antes de disparar el print
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
        // Solo mostrar solicitudes EN ESPERA
        if (sol.estado_tramite !== 'En espera') return false;

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
    }).sort((a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso))
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
    if (actual - delta > 2) range.unshift('...')
    if (actual + delta < total - 1) range.push('...')
    range.unshift(1)
    if (total > 1) range.push(total)
    return range.filter(p => p !== '...') // Simplificar para esta vista
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
</script>

<template>
    <div class="solicitudes-view">
        <div id="solicitudes" class="print:hidden">
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">
                        Gestión de Solicitudes (Pendientes)
                    </h2>
                    <p class="text-gray-600">
                        Administra los trámites que se encuentran actualmente en espera de atención
                    </p>
                </div>
                <!-- Botón Actualizado v2.2 - Color Verde Institucional -->
                <button 
                    id="btn-nueva-solicitud"
                    @click="() => { uiState.editData = null; uiState.showModal = true; }" 
                    class="group relative flex items-center gap-3 px-8 py-4 bg-[#1a4731] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-green-900/20 hover:shadow-green-900/40 hover:-translate-y-1 transition-all active:scale-95 border border-white/10"
                >
                    <div class="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </div>
                    Nueva Solicitud
                </button>
            </div>

            <!-- Barra de Filtros Avanzados -->
            <div class="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div class="lg:col-span-2">
                        <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Búsqueda general</label>
                        <input type="text" v-model="filtroBusqueda" class="search-input w-full" placeholder="Cod interno, solicitante, referencia..." />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Barrio</label>
                        <select v-model="filtroBarrio" class="search-input w-full">
                            <option value="">Todos los barrios</option>
                            <option v-for="b in store.barrios" :key="b.id" :value="b.id">{{ b.nombre }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Tipo de Acción</label>
                        <select v-model="filtroAccion" class="search-input w-full">
                            <option value="">Todas las acciones</option>
                            <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                        </select>
                    </div>
                    <div class="lg:col-span-2">
                        <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Rango de Fechas de Ingreso</label>
                        <div class="flex items-center gap-2">
                            <input type="date" v-model="filtroFechaDesde" class="search-input flex-1" title="Desde" />
                            <span class="text-gray-400 font-medium text-sm">hasta</span>
                            <input type="date" v-model="filtroFechaHasta" class="search-input flex-1" title="Hasta" />
                        </div>
                    </div>
                    <div class="flex items-end">
                        <button @click="limpiarFiltros" class="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            🗑️ Limpiar filtros
                        </button>
                    </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Mostrando <span class="font-bold text-accent">{{ solicitudesFiltradas.length }}</span> solicitudes en espera
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
                                    No hay solicitudes aún o no coinciden con la búsqueda.
                                </td>
                            </tr>
                            <tr v-for="sol in solicitudesPaginadas" :key="sol.id_solicitud">
                                <td class="font-bold text-accent">{{ sol.comunicacion_interna || `#${sol.id_solicitud}` }}</td>
                                <td>{{ formatFecha(sol.fecha_ingreso) }}</td>
                                <td>{{ sol.solicitante_nombre }}</td>
                                <td>{{ getBarrio(sol.id_barrio) }}</td>
                                <td class="truncate max-w-xs" :title="getAccion(sol.id_accion_solicitada)">{{ getAccion(sol.id_accion_solicitada) }}</td>
                                <td>{{ getAccion(sol.id_accion) }}</td>
                                <td>
                                    <span class="badge" :class="sol.estado_tramite === 'Terminado' ? 'badge-completed' : 'badge-pending'">
                                        {{ sol.estado_tramite }}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge" :class="{
                                        'badge-urgent': sol.nivel_urgencia === 'Alta' || sol.es_emergencia,
                                        'badge-normal': sol.nivel_urgencia === 'Baja' || sol.nivel_urgencia === 'Intermedia'
                                    }">
                                        {{ sol.es_emergencia ? 'EMERGENCIA' : sol.nivel_urgencia }}
                                    </span>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-icon btn-ver" @click="abrirDetalle(sol)" title="Ver detalles">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                        </button>
                                        <button class="btn-icon btn-print" @click="imprimirDirecto(sol)" title="Imprimir reporte">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                        </button>
                                        <button class="btn-icon btn-edit" @click="abrirEdicion(sol)" title="Editar solicitud">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                        <button v-if="uiState.user?.role === 'ROOT'" class="btn-icon btn-delete" @click="confirmarEliminar(sol)" title="Eliminar solicitud">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pagination UI -->
            <div class="flex justify-between items-center bg-card p-4 rounded-2xl border border-border no-print">
                <div class="text-xs font-black text-muted uppercase tracking-widest">
                    Página {{ paginaActual }} de {{ totalPaginas }}
                </div>
                <div class="flex gap-2">
                    <button @click="paginaActual--" :disabled="paginaActual === 1" 
                        class="px-4 py-2 bg-main border border-border rounded-xl font-black text-xs uppercase disabled:opacity-50 hover:bg-accent/10 transition-all">
                        Anterior
                    </button>
                    <button v-for="p in paginasVisibles" :key="p" @click="paginaActual = p"
                        :class="['w-10 h-10 rounded-xl font-black text-xs transition-all', 
                                 paginaActual === p ? 'bg-accent text-white shadow-lg' : 'bg-main border border-border text-muted hover:bg-accent/10']">
                        {{ p }}
                    </button>
                    <button @click="paginaActual++" :disabled="paginaActual === totalPaginas" 
                        class="px-4 py-2 bg-main border border-border rounded-xl font-black text-xs uppercase disabled:opacity-50 hover:bg-accent/10 transition-all">
                        Siguiente
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal de Detalles (Reporte) -->
        <div v-if="solicitudSeleccionada" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:absolute print:inset-auto print:block print:bg-white print:p-0 print:m-0 print:overflow-visible">
            <div class="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative print-area print:max-h-none print:overflow-visible print:shadow-none print:rounded-none">

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
                            <p class="print-sec font-bold text-sm">Secretaría Municipal de Infraestructura y Servicios</p>
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
                            <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
                                :class="solicitudSeleccionada.estado_tramite === 'Terminado' ? 'bg-emerald-400 text-emerald-900' : 'bg-yellow-300 text-yellow-900'">
                                {{ solicitudSeleccionada.estado_tramite || 'En espera' }}
                            </span>
                        </div>
                        <!-- Fila de insignias de requerimientos (CENTRALIZADA) -->
                        <div class="flex flex-wrap gap-2 mt-4">
                            <!-- 1. BADGE DE PRIORIDAD CONSOLIDADO -->
                            <span v-if="solicitudSeleccionada.es_emergencia || solicitudSeleccionada.nivel_urgencia === 'Alta' || solicitudSeleccionada.es_urgencia"
                                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black bg-red-600 text-white shadow-lg shadow-red-900/20 border border-white/20 animate-pulse">
                                🚨 PRIORIDAD CRÍTICA / EMERGENCIA
                            </span>
                            <span v-else-if="solicitudSeleccionada.nivel_urgencia === 'Intermedia'"
                                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black bg-amber-500 text-white shadow-lg shadow-amber-900/20 border border-white/20">
                                ⚠️ PRIORIDAD MEDIA
                            </span>
                            <span v-else
                                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 border border-white/20">
                                ✅ PRIORIDAD NORMAL
                            </span>

                            <!-- 2. OTROS REQUERIMIENTOS LOGÍSTICOS -->
                            <span v-if="solicitudSeleccionada.procede"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                                🌲 PROCEDE TRABAJO
                            </span>
                            <span v-if="solicitudSeleccionada.requiere_plataforma"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                                🏗️ GRÚA/PLATAFORMA
                            </span>
                            <span v-if="solicitudSeleccionada.requiere_setar"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-orange-100 text-orange-700 border border-orange-200">
                                ⚡ CORTE SETAR
                            </span>
                            <span v-if="solicitudSeleccionada.requiere_ficha_tecnica"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200">
                                📋 FICHA TÉCNICA
                            </span>
                            <span v-if="solicitudSeleccionada.arbol_seco"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200">
                                🌵 ÁRBOL SECO
                            </span>
                            <span v-if="solicitudSeleccionada.segunda_nota"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                                ✉️ SEGUNDA NOTA
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button @click="imprimirReporte" class="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-white/10">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Imprimir
                        </button>
                        <button @click="solicitudSeleccionada = null" class="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-xl flex items-center justify-center text-2xl leading-none transition-all border border-white/10">&times;</button>
                    </div>
                </div>

                <!-- Cuerpo de la tarjeta (5 SECCIONES FORMALES) -->
                <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white overflow-y-auto max-h-[70vh] custom-scrollbar">

                    <!-- SECCIÓN 01: Información de Ingreso (AZUL) -->
                    <div class="md:col-span-2 bg-blue-50/60 border border-blue-100 rounded-2xl p-6 shadow-sm">
                        <h4 class="flex items-center gap-2 text-[11px] font-black text-blue-800 uppercase tracking-[0.2em] mb-4 border-b border-blue-200 pb-2">
                            <span class="w-2 h-2 bg-blue-500 rounded-full"></span> 01. Información de Ingreso
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-10 text-sm">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Fecha de Ingreso</span>
                                <span class="font-bold text-gray-800">{{ formatFecha(solicitudSeleccionada.fecha_ingreso) }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Comunicación Interna</span>
                                <span class="font-black text-blue-900 bg-white/80 px-2 py-0.5 rounded border border-blue-100 w-fit">{{ solicitudSeleccionada.comunicacion_interna || 'S/N' }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Acción Solicitada</span>
                                <span class="font-bold text-gray-800">{{ getAccion(solicitudSeleccionada.id_accion_solicitada) }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Nombre del Solicitante</span>
                                <span class="font-bold text-gray-800">{{ solicitudSeleccionada.solicitante_nombre }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Teléfono</span>
                                <span class="font-bold text-gray-800">{{ solicitudSeleccionada.solicitante_telefono || '—' }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Tipo de Institución</span>
                                <span class="font-bold text-gray-800">{{ getTipoInstitucion(solicitudSeleccionada.id_tipo_institucion) }}</span>
                            </div>
                            <div class="md:col-span-3 flex flex-col border-t border-blue-100/50 pt-2">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Nombre de Institución</span>
                                <span class="font-bold text-gray-800 uppercase text-xs">{{ getInstitucion(solicitudSeleccionada.id_nombre_institucional) }}</span>
                            </div>
                            <div class="md:col-span-3 bg-white/80 p-4 rounded-xl border border-blue-100">
                                <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 block">Nota de Solicitud / Descripción</span>
                                <p class="text-gray-700 italic leading-relaxed font-medium">"{{ solicitudSeleccionada.solicitante_descripcion || 'Sin descripción adicional.' }}"</p>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 02: Localización (VERDE) -->
                    <div class="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-6 shadow-sm">
                        <h4 class="flex items-center gap-2 text-[11px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-4 border-b border-emerald-200 pb-2">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> 02. Localización y Referencia
                        </h4>
                        <div class="space-y-4 text-sm">
                            <div class="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                                <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Distrito Municipal</span>
                                <span class="font-bold text-gray-800">{{ getDistritoByBarrio(solicitudSeleccionada.id_barrio) }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                                <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Barrio / Zona</span>
                                <span class="font-bold text-gray-800 text-right">{{ getBarrio(solicitudSeleccionada.id_barrio) }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                                <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Calle / Avenida</span>
                                <span class="font-bold text-gray-800 text-right">{{ solicitudSeleccionada.calle }} {{ solicitudSeleccionada.numero_casa ? 'Nº '+solicitudSeleccionada.numero_casa : '' }}</span>
                            </div>
                            <div class="flex flex-col pt-1">
                                <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Punto de Referencia Exacto</span>
                                <span class="font-bold text-gray-700 bg-white/80 p-3 rounded-lg border border-emerald-100">{{ solicitudSeleccionada.referencia || '—' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 03: Diagnóstico (GRIS) -->
                    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h4 class="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2">
                            <span class="w-2 h-2 bg-slate-600 rounded-full"></span> 03. Diagnóstico Técnico
                        </h4>
                        <div class="space-y-4 text-sm">
                            <div class="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acción Determinada</span>
                                <span class="font-black text-emerald-700 uppercase">{{ getAccion(solicitudSeleccionada.id_accion) }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Técnico Evaluador</span>
                                <span class="font-bold text-gray-800">{{ getTecnico(solicitudSeleccionada.id_tecnico_verificacion) }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Verificación</span>
                                <span class="font-bold text-gray-800">{{ formatFecha(solicitudSeleccionada.fecha_verificacion) }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Especie Identificada</span>
                                <span class="font-bold text-gray-800">{{ getEspecie(solicitudSeleccionada.id_especie) }}</span>
                            </div>
                            <div class="flex flex-col pt-1">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Informe de Verificación</span>
                                <span class="font-medium text-gray-700 italic bg-white/80 p-3 rounded-lg border border-slate-200">"{{ solicitudSeleccionada.observacion_verificacion || 'Sin observaciones técnicas registradas.' }}"</span>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 04: Logística y Requerimientos (ÁMBAR) -->
                    <div class="md:col-span-2 bg-amber-50/60 border border-amber-200 rounded-2xl p-6 shadow-sm">
                        <h4 class="flex items-center gap-2 text-[11px] font-black text-amber-800 uppercase tracking-[0.2em] mb-4 border-b border-amber-200 pb-2">
                            <span class="w-2 h-2 bg-amber-500 rounded-full"></span> 04. Apoyo Logístico y Alertas
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                            <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">🏗️ ¿Requiere Grúa / Plataforma?</span>
                                <span class="font-black" :class="solicitudSeleccionada.requiere_plataforma ? 'text-blue-600' : 'text-gray-400'">{{ solicitudSeleccionada.requiere_plataforma ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">⚡ ¿Requiere Corte SETAR?</span>
                                <span class="font-black" :class="solicitudSeleccionada.requiere_setar ? 'text-orange-600' : 'text-gray-400'">{{ solicitudSeleccionada.requiere_setar ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">📄 ¿Requiere Ficha Técnica?</span>
                                <span class="font-black" :class="solicitudSeleccionada.requiere_ficha_tecnica ? 'text-indigo-600' : 'text-gray-400'">{{ solicitudSeleccionada.requiere_ficha_tecnica ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">🌵 ¿Es Árbol Seco?</span>
                                <span class="font-black" :class="solicitudSeleccionada.arbol_seco ? 'text-amber-700' : 'text-gray-400'">{{ solicitudSeleccionada.arbol_seco ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">🚨 ¿Es Emergencia / Urgencia?</span>
                                <span class="font-black" :class="solicitudSeleccionada.es_emergencia || solicitudSeleccionada.es_urgencia ? 'text-red-600' : 'text-gray-400'">{{ (solicitudSeleccionada.es_emergencia || solicitudSeleccionada.es_urgencia) ? 'SÍ' : 'NO' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                                <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">✅ ¿Procede Trabajo?</span>
                                <span class="font-black" :class="solicitudSeleccionada.procede ? 'text-emerald-600' : 'text-gray-400'">{{ solicitudSeleccionada.procede ? 'SÍ' : 'NO' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 05: Cierre de Trámite (PÚRPURA) -->
                    <div id="print-seccion-5" class="md:col-span-2 bg-purple-50/60 border border-purple-200 rounded-2xl p-6 shadow-sm print:break-before-page">
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
                                <span class="font-bold text-gray-800 uppercase text-xs">{{ getTecnico(solicitudSeleccionada.id_tecnico_ejecucion) }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Fecha de Finalización</span>
                                <span class="font-bold text-gray-800">{{ formatFecha(solicitudSeleccionada.fecha_ejecucion) }}</span>
                            </div>
                            <div class="md:col-span-3 bg-white/80 p-4 rounded-xl border border-purple-100">
                                <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2 block">Reporte Final de Obra</span>
                                <p class="text-gray-700 font-semibold leading-relaxed">"{{ solicitudSeleccionada.observaciones_finales || 'Expediente sin reporte de cierre final.' }}"</p>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Firmas para Impresión -->
                <div class="hidden print:block print-firmas">
                    <!-- Nota de Descargo Formal -->
                    <div class="border-t border-b border-gray-300 py-3 mb-6">
                        <p class="text-[9px] text-gray-600 italic text-center leading-tight">
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
                    <div class="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                        <span>Sistema de Gestión de Arboricultura y Espacios Verdes - G.A.M.T.</span>
                        <div class="print-counter">Página <span class="pageNumber"></span></div>
                    </div>
                </div>

                <div class="no-print px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button @click="solicitudSeleccionada = null" class="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all" style="background: #2d6a4f;">Cerrar</button>
                </div>
            </div>
        </div>
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
    
    #app, .app-container, .flex-1, main, main > div, .solicitudes-view, #solicitudes-parent { 
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
        margin: 0.6cm 0.8cm; /* Márgenes más estrechos */
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
    .bg-blue-50\/60, .bg-emerald-50\/60, .bg-amber-50\/60, .bg-purple-50\/60, .bg-slate-50 {
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

    /* Salto de página para Sección 5 */
    #print-seccion-5 {
        break-before: page !important;
        margin-top: 15pt !important;
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

#btn-nueva-solicitud {
    background-color: #1a4731 !important;
    color: white !important;
}

#btn-nueva-solicitud:hover {
    background-color: #2d6a4f !important;
}
</style>
