<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMainStore } from '../store/mainStore.js'
import { ShieldAlert, Filter, Trash2, Eye, Calendar, Clock, ArrowUpDown, Search, X } from 'lucide-vue-next'

const mainStore = useMainStore()
const { store, uiState, fetchAuditoria, showToast } = mainStore

const auditoriaSeleccionada = ref(null)

// Filtros reactivos
const filtroUsuario = ref('')
const filtroAccion = ref('')
const filtroTabla = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')
const ordenAsc = ref(false) // false: Recientes primero, true: Antiguos primero

// Paginación
const paginaActual = ref(1)
const itemsPorPagina = 20

const limpiarFiltros = () => {
    filtroUsuario.value = ''
    filtroAccion.value = ''
    filtroTabla.value = ''
    filtroFechaDesde.value = ''
    filtroFechaHasta.value = ''
}

// Cargar auditorías al montar
onMounted(async () => {
    uiState.isLoading = true
    try {
        await fetchAuditoria()
    } catch (e) {
        showToast('Error al cargar logs de auditoría', 'error')
    } finally {
        uiState.isLoading = false
    }
})

// Lista filtrada
const logsFiltrados = computed(() => {
    if (!store.auditoria) return []
    
    return store.auditoria.filter(log => {
        // 1. Filtrar por Usuario (búsqueda de texto)
        if (filtroUsuario.value) {
            const userTerm = filtroUsuario.value.toLowerCase()
            const matchUser = log.usuario && log.usuario.toLowerCase().includes(userTerm)
            const matchDetails = log.detalles && log.detalles.toLowerCase().includes(userTerm)
            if (!matchUser && !matchDetails) return false
        }

        // 2. Filtrar por Acción (CREAR, MODIFICAR, ELIMINAR)
        if (filtroAccion.value && log.accion !== filtroAccion.value) return false

        // 3. Filtrar por Tabla Afectada
        if (filtroTabla.value && log.tabla_afectada !== filtroTabla.value) return false

        // 4. Filtrar por Rango de Fechas
        if (filtroFechaDesde.value && log.fecha_hora) {
            if (new Date(log.fecha_hora) < new Date(filtroFechaDesde.value)) return false
        }
        if (filtroFechaHasta.value && log.fecha_hora) {
            const hasta = new Date(filtroFechaHasta.value)
            hasta.setDate(hasta.getDate() + 1)
            if (new Date(log.fecha_hora) >= hasta) return false
        }

        return true
    }).sort((a, b) => {
        const dateA = new Date(a.fecha_hora || 0)
        const dateB = new Date(b.fecha_hora || 0)
        return ordenAsc.value ? dateA - dateB : dateB - dateA
    })
})

// Listado paginado
const totalPaginas = computed(() => Math.ceil(logsFiltrados.value.length / itemsPorPagina) || 1)

const logsPaginados = computed(() => {
    const inicio = (paginaActual.value - 1) * itemsPorPagina
    return logsFiltrados.value.slice(inicio, inicio + itemsPorPagina)
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
    return [...new Set(range)].sort((a, b) => a - b)
})

// Formateadores
const formatFechaHora = (str) => {
    if (!str) return '—'
    const f = new Date(str)
    return f.toLocaleString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    })
}

const parseDetalles = (detalles) => {
    if (!detalles) return {}
    try {
        return JSON.parse(detalles)
    } catch (e) {
        return { raw: detalles }
    }
}

const abrirDetalle = (log) => {
    auditoriaSeleccionada.value = log
}
</script>

<template>
    <div class="auditoria-view p-6 space-y-6 text-main animate-fade-in">
        
        <!-- Header -->
        <div class="mb-6 flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-black text-main mb-2 flex items-center gap-3">
                    <ShieldAlert class="text-red-500 w-8 h-8 animate-pulse" />
                    Caja Negra (Auditoría de Actividad)
                </h2>
                <p class="text-muted">
                    Historial inmutable de operaciones de creación, edición y eliminación de datos en el sistema
                </p>
            </div>
        </div>

        <!-- Barra de Filtros Avanzados -->
        <div class="mb-6 bg-card-main rounded-[2rem] border border-main p-6 shadow-sm">
            <div class="flex justify-between items-center mb-5">
                <h3 class="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2">
                    <Filter class="w-4 h-4" /> Filtros de Auditoría
                </h3>
                <div class="flex gap-2.5">
                    <!-- Botón de Ordenamiento -->
                    <button @click="ordenAsc = !ordenAsc" class="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent hover:text-accent-hover border border-accent/20 hover:border-accent/40 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 hover:-translate-y-0.5">
                        <ArrowUpDown class="w-3.5 h-3.5" />
                        <span>{{ ordenAsc ? 'Orden: Antiguos Primero' : 'Orden: Recientes Primero' }}</span>
                    </button>
                    <!-- Botón Limpiar Filtros -->
                    <button @click="limpiarFiltros" class="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 hover:-translate-y-0.5">
                        <Trash2 class="w-3.5 h-3.5" />
                        Limpiar Filtros
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="lg:col-span-2">
                    <label class="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">Usuario o Término</label>
                    <input type="text" v-model="filtroUsuario" class="search-input w-full" placeholder="Buscar por usuario o detalles..." />
                </div>
                <div>
                    <label class="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">Acción</label>
                    <select v-model="filtroAccion" class="search-input w-full">
                        <option value="">Todas las acciones</option>
                        <option value="CREAR">🟢 CREAR</option>
                        <option value="MODIFICAR">🟡 MODIFICAR</option>
                        <option value="ELIMINAR">🔴 ELIMINAR</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">Tabla Afectada</label>
                    <select v-model="filtroTabla" class="search-input w-full">
                        <option value="">Todas las tablas</option>
                        <option value="solicitudes_poda">solicitudes_poda</option>
                        <option value="personal">personal / usuarios</option>
                        <option value="acciones_catalogo">acciones_catalogo</option>
                        <option value="especies_arboles">especies_arboles</option>
                        <option value="barrios">barrios</option>
                        <option value="instituciones">instituciones</option>
                    </select>
                </div>
                <div class="lg:col-span-2">
                    <label class="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">Rango de Fechas</label>
                    <div class="flex items-center gap-2">
                        <input type="date" v-model="filtroFechaDesde" class="search-input flex-1" title="Desde" />
                        <span class="text-muted font-medium text-sm">hasta</span>
                        <input type="date" v-model="filtroFechaHasta" class="search-input flex-1" title="Hasta" />
                    </div>
                </div>
            </div>
            <div class="mt-3 pt-3 border-t border-main text-xs text-muted">
                Mostrando <span class="font-bold text-accent">{{ logsFiltrados.length }}</span> registros de actividad
            </div>
        </div>

        <!-- Tabla -->
        <div class="card mb-6">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th class="w-16 text-center">ID</th>
                            <th>Fecha y Hora</th>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Acción</th>
                            <th>Tabla</th>
                            <th>ID Reg.</th>
                            <th>Detalles Rápidos</th>
                            <th class="w-20 text-center">Ver</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="logsPaginados.length === 0">
                            <td colspan="9" class="p-8 text-center text-muted">
                                No se encontraron registros de auditoría que coincidan con los filtros aplicados.
                            </td>
                        </tr>
                        <tr v-for="log in logsPaginados" :key="log.id_auditoria">
                            <td class="text-center font-bold text-muted bg-card-sec/30">
                                #{{ log.id_auditoria }}
                            </td>
                            <td class="font-semibold text-xs whitespace-nowrap">
                                {{ formatFechaHora(log.fecha_hora) }}
                            </td>
                            <td class="font-bold text-sm text-main">
                                {{ log.usuario }}
                            </td>
                            <td>
                                <span class="badge border" 
                                    :class="{
                                        'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20': log.role === 'ROOT',
                                        'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20': log.role === 'ADMIN',
                                        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20': log.role === 'TECNICO',
                                        'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20': log.role !== 'ROOT' && log.role !== 'ADMIN' && log.role !== 'TECNICO'
                                    }">
                                    {{ log.role }}
                                </span>
                            </td>
                            <td>
                                <span class="badge" 
                                    :class="{
                                        'badge-completed !bg-emerald-600/10 !text-emerald-600 border border-emerald-500/20': log.accion === 'CREAR',
                                        'badge-pending !bg-amber-500/10 !text-amber-600 border border-amber-500/20': log.accion === 'MODIFICAR',
                                        'badge-urgent !bg-red-500/10 !text-red-600 border border-red-500/20': log.accion === 'ELIMINAR'
                                    }">
                                    {{ log.accion }}
                                </span>
                            </td>
                            <td class="font-mono text-xs text-muted">
                                {{ log.tabla_afectada }}
                            </td>
                            <td class="font-bold text-center">
                                {{ log.registro_id || '—' }}
                            </td>
                            <td class="truncate max-w-[200px]" :title="log.detalles">
                                <span class="text-xs text-muted">{{ log.detalles || '—' }}</span>
                            </td>
                            <td class="text-center">
                                <button class="btn-icon btn-ver" @click="abrirDetalle(log)" title="Ver detalles JSON">
                                    <Eye class="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Paginación -->
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

        <!-- Modal de Detalles del Log -->
        <div v-if="auditoriaSeleccionada" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-prime-in">
            <div class="bg-card-main border border-main rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative scale-in">
                <!-- Header del Modal -->
                <div class="modal-header-gradient px-6 py-5 flex justify-between items-center shadow-lg border-b border-black/10 shrink-0">
                    <div>
                        <p class="text-[color:var(--text-on-accent)] opacity-80 text-xs font-black uppercase tracking-widest mb-1">Detalles de la Operación</p>
                        <h3 class="text-[color:var(--text-on-accent)] text-lg font-black leading-none">Registro de Auditoría #{{ auditoriaSeleccionada.id_auditoria }}</h3>
                    </div>
                    <button @click="auditoriaSeleccionada = null" class="hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center">
                        <X class="w-6 h-6 text-[color:var(--text-on-accent)]" />
                    </button>
                </div>

                <!-- Cuerpo del modal -->
                <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar bg-card-main text-main">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-card-sec p-3 rounded-xl border border-main">
                            <span class="text-[9px] font-black text-muted uppercase tracking-wider block mb-1">Fecha y Hora</span>
                            <span class="text-xs font-bold">{{ formatFechaHora(auditoriaSeleccionada.fecha_hora) }}</span>
                        </div>
                        <div class="bg-card-sec p-3 rounded-xl border border-main">
                            <span class="text-[9px] font-black text-muted uppercase tracking-wider block mb-1">Operario Responsable</span>
                            <span class="text-xs font-black text-accent uppercase">{{ auditoriaSeleccionada.usuario }}</span>
                        </div>
                        <div class="bg-card-sec p-3 rounded-xl border border-main">
                            <span class="text-[9px] font-black text-muted uppercase tracking-wider block mb-1">Rol Operario</span>
                            <span class="text-xs font-bold">{{ auditoriaSeleccionada.role }}</span>
                        </div>
                        <div class="bg-card-sec p-3 rounded-xl border border-main">
                            <span class="text-[9px] font-black text-muted uppercase tracking-wider block mb-1">Acción Ejecutada</span>
                            <span class="text-xs font-bold">{{ auditoriaSeleccionada.accion }}</span>
                        </div>
                        <div class="bg-card-sec p-3 rounded-xl border border-main">
                            <span class="text-[9px] font-black text-muted uppercase tracking-wider block mb-1">Tabla Afectada</span>
                            <span class="text-xs font-bold font-mono">{{ auditoriaSeleccionada.tabla_afectada }}</span>
                        </div>
                        <div class="bg-card-sec p-3 rounded-xl border border-main">
                            <span class="text-[9px] font-black text-muted uppercase tracking-wider block mb-1">ID Registro</span>
                            <span class="text-xs font-bold">{{ auditoriaSeleccionada.registro_id || 'N/A' }}</span>
                        </div>
                    </div>

                    <!-- Detalles JSON Formateados -->
                    <div class="bg-card-sec p-4 rounded-xl border border-main">
                        <span class="text-[9px] font-black text-muted uppercase tracking-wider block mb-2">Datos Enviados / Detalles del Cambio</span>
                        <pre class="text-xs font-mono bg-black/5 dark:bg-black/40 p-3 rounded-lg overflow-x-auto text-main text-left leading-relaxed">{{ parseDetalles(auditoriaSeleccionada.detalles) }}</pre>
                    </div>
                </div>

                <!-- Botones de Acción -->
                <div class="px-6 pb-6 flex gap-3 bg-card-main">
                    <button @click="auditoriaSeleccionada = null"
                        class="flex-1 py-3 bg-accent text-on-accent rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
                        Cerrar Detalle
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
pre {
    white-space: pre-wrap;
    word-break: break-all;
}
</style>
