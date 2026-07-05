<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const router = useRouter()
const { store, uiState, registrarImpresion, deleteImpresion, updateImpresionName, showToast, fetchImpresiones, responsableArea, jefeUnidad } = mainStore
import { Printer, History, Trash2, Edit3, Eye, FileText, Filter, ChevronRight, Search, Download, AlertTriangle } from 'lucide-vue-next'

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
const nombreHojaRuta = ref('')
const filtroEstado = ref('En espera') 
const filtroDistrito = ref('')
const filtroBarrio = ref('')
const filtroTecnico = ref('')
const filtroTipoInstitucion = ref('')
const filtroAccion = ref('')
const filtroUrgencia = ref('')
const filtroEspecie = ref('')

// Rango de fechas
const filtroFechaVerifDesde = ref('')
const filtroFechaVerifHasta = ref('')

// Banderas Booleanas
const filtroSetar = ref('')
const filtroPlataforma = ref('')
const filtroArbolSeco = ref('')
const filtroEmergencia = ref('')
const filtroSegundaNota = ref('')
const filtroFichaTecnica = ref('')
const filtroProcede = ref('')

// 1. DISTRITO -> BARRIOS (Si cambio distrito, limpio barrio si no pertenece o si se deselecciona)
watch(filtroDistrito, (newDist) => {
    if (newDist && filtroBarrio.value) {
        const barrioActual = store.barrios.find(b => b.id == filtroBarrio.value);
        if (barrioActual && barrioActual.id_distrito != newDist) {
            filtroBarrio.value = '';
        }
    } else if (!newDist) {
        filtroBarrio.value = '';
    }
})

onMounted(() => {
    // Los datos ya vienen cargados desde el App.vue
})

const solicitudesFiltradas = computed(() => {
    return store.solicitudes.filter(sol => {
        let match = true
        if (filtroBarrio.value && sol.id_barrio != filtroBarrio.value) match = false
        
        // Distrito filter
        if (filtroDistrito.value) {
            const b = store.barrios.find(x => x.id == sol.id_barrio)
            if (!b || b.id_distrito != filtroDistrito.value) match = false
        }
        
        if (filtroTecnico.value && sol.id_tecnico_ejecucion != filtroTecnico.value) match = false
        if (filtroUrgencia.value && sol.nivel_urgencia != filtroUrgencia.value) match = false
        
        // Acción filter: Match either main determined action or any tree's determined action
        if (filtroAccion.value) {
            const matchAccionPrincipal = sol.id_accion == filtroAccion.value
            const matchAccionArboles = sol.arboles && sol.arboles.some(a => a.id_accion_realizar == filtroAccion.value)
            if (!matchAccionPrincipal && !matchAccionArboles) match = false
        }
        
        if (filtroEspecie.value && sol.id_especie != filtroEspecie.value) match = false
        if (filtroTipoInstitucion.value && sol.id_tipo_institucion != filtroTipoInstitucion.value) match = false



        // Fechas Verificación
        if (filtroFechaVerifDesde.value && sol.fecha_verificacion) {
            if (new Date(sol.fecha_verificacion) < new Date(filtroFechaVerifDesde.value)) match = false
        }
        if (filtroFechaVerifHasta.value && sol.fecha_verificacion) {
            const hasta = new Date(filtroFechaVerifHasta.value)
            hasta.setDate(hasta.getDate() + 1)
            if (new Date(sol.fecha_verificacion) >= hasta) match = false
        }

        // Condiciones Especiales
        if (filtroSetar.value !== '') {
            const req = sol.requiere_setar ? '1' : '0'
            if (req !== filtroSetar.value) match = false
        }
        if (filtroPlataforma.value !== '') {
            const req = sol.requiere_plataforma ? '1' : '0'
            if (req !== filtroPlataforma.value) match = false
        }
        if (filtroArbolSeco.value !== '') {
            const req = sol.arbol_seco ? '1' : '0'
            if (req !== filtroArbolSeco.value) match = false
        }
        if (filtroEmergencia.value !== '') {
            const req = (sol.es_emergencia || sol.nivel_urgencia === 'Alta') ? '1' : '0'
            if (req !== filtroEmergencia.value) match = false
        }
        if (filtroSegundaNota.value !== '') {
            const req = sol.segunda_nota ? '1' : '0'
            if (req !== filtroSegundaNota.value) match = false
        }
        if (filtroFichaTecnica.value !== '') {
            const req = sol.requiere_ficha_tecnica ? '1' : '0'
            if (req !== filtroFichaTecnica.value) match = false
        }
        if (filtroProcede.value !== '') {
            const req = sol.procede ? '1' : '0'
            if (req !== filtroProcede.value) match = false
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

const getDistritoByBarrio = (idBarrio) => {
    if (!idBarrio) return '—'
    const b = store.barrios.find(x => x.id == idBarrio)
    if (!b) return '—'
    const d = store.distritos.find(x => x.id == b.id_distrito)
    return d ? d.nombre : '—'
}

const formatFechaSimple = (str) => {
    if (!str) return '—'
    const f = new Date(str)
    const d = String(f.getUTCDate()).padStart(2, '0');
    const m = String(f.getUTCMonth() + 1).padStart(2, '0');
    const a = String(f.getUTCFullYear()).slice(-2);
    return `${d}/${m}/${a}`;
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

const imprimirHojaRuta = () => {
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

    // Snapshot completo de todos los filtros para poder re-generar el reporte exacto
    const filtrosSnapshot = JSON.stringify({
        filtroEstado: filtroEstado.value,
        filtroDistrito: filtroDistrito.value,
        filtroBarrio: filtroBarrio.value,
        filtroTecnico: filtroTecnico.value,
        filtroTipoInstitucion: filtroTipoInstitucion.value,
        filtroAccion: filtroAccion.value,
        filtroUrgencia: filtroUrgencia.value,
        filtroEspecie: filtroEspecie.value,
        filtroFechaVerifDesde: filtroFechaVerifDesde.value,
        filtroFechaVerifHasta: filtroFechaVerifHasta.value,
        filtroSetar: filtroSetar.value,
        filtroPlataforma: filtroPlataforma.value,
        filtroArbolSeco: filtroArbolSeco.value,
        filtroEmergencia: filtroEmergencia.value,
        filtroSegundaNota: filtroSegundaNota.value,
        filtroFichaTecnica: filtroFichaTecnica.value,
        filtroProcede: filtroProcede.value,
    })

    const nombreFinal = nombreHojaRuta.value || `Hoja de Ruta - ${getBarrio(filtroBarrio.value)} (${new Date().toLocaleDateString()})`

    // Disparar la impresión con un pequeño delay para asegurar la reactividad
    setTimeout(() => {
        window.print()
        
        // Registrar en el historial en segundo plano una vez cerrado el diálogo de impresión
        registrarImpresion({
            nombre_reporte: nombreFinal,
            tipo_reporte: 'Hoja de Ruta',
            filtros_aplicados: filtrosTxt,
            filtros_snapshot: filtrosSnapshot,
            detalles: `Consolidado de ${solicitudesFiltradas.value.length} trámites.`
        }).catch(e => console.error("Error al registrar impresión:", e))

        nombreHojaRuta.value = ''
    }, 300)
}

const exportarExcel = () => {
    if (solicitudesFiltradas.value.length === 0) {
        showToast('No hay solicitudes que coincidan con los filtros.', 'error')
        return
    }
    
    // Mapear los datos de las solicitudes filtradas a columnas legibles
    const data = solicitudesFiltradas.value.map((sol, idx) => ({
        "Nº": idx + 1,
        "Código/Com. Interna": sol.comunicacion_interna || `#${sol.id_solicitud}`,
        "Fecha Ingreso": formatFechaSimple(sol.fecha_ingreso),
        "Solicitante": sol.solicitante_nombre,
        "Teléfono": sol.solicitante_telefono || '—',
        "Calle": sol.calle || '—',
        "Nº Casa": sol.numero_casa || '—',
        "Barrio": getBarrio(sol.id_barrio),
        "Distrito": getDistritoByBarrio(sol.id_barrio),
        "Acción Solicitada": formatLoSolicitado(sol),
        "Acción Determinada": formatLoDeterminado(sol),
        "Referencia": sol.referencia || '—'
    }))

    // Crear libro y hoja
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hoja de Ruta")

    // Ajustar el ancho de las columnas
    const maxLens = {}
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            const valStr = String(row[key] || '')
            maxLens[key] = Math.max(maxLens[key] || 10, valStr.length)
        })
    })
    worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }))

    // Determinar nombre del archivo
    const nombreFinal = nombreHojaRuta.value 
        ? nombreHojaRuta.value 
        : `Hoja_de_Ruta_${getBarrio(filtroBarrio.value)}_${new Date().toISOString().split('T')[0]}`

    // Guardar
    XLSX.writeFile(workbook, `${nombreFinal}.xlsx`)
    showToast('Archivo Excel exportado con éxito.', 'success')
}

const handleReimprimir = (imp) => {
    if (imp.tipo_reporte === 'Individual') {
        const sol = store.solicitudes.find(s => s.id_solicitud === imp.id_solicitud || s.comunicacion_interna === imp.id_solicitud)
        if (sol) {
            uiState.autoVerSolicitudId = sol.id_solicitud
            uiState.autoImprimirSolicitud = true
            if (sol.estado_tramite === 'Terminado') {
                router.push('/historial')
            } else {
                router.push('/solicitudes')
            }
        } else {
            showToast('No se encontró la solicitud original en el sistema.', 'error')
        }
        return
    }

    // Restaurar todos los filtros guardados al momento de generar el reporte
    if (imp.filtros_snapshot) {
        try {
            const snap = JSON.parse(imp.filtros_snapshot)
            filtroEstado.value = snap.filtroEstado ?? 'En espera'
            filtroDistrito.value = snap.filtroDistrito ?? ''
            filtroBarrio.value = snap.filtroBarrio ?? ''
            filtroTecnico.value = snap.filtroTecnico ?? ''
            filtroTipoInstitucion.value = snap.filtroTipoInstitucion ?? ''
            filtroAccion.value = snap.filtroAccion ?? ''
            filtroUrgencia.value = snap.filtroUrgencia ?? ''
            filtroEspecie.value = snap.filtroEspecie ?? ''
            filtroFechaVerifDesde.value = snap.filtroFechaVerifDesde ?? ''
            filtroFechaVerifHasta.value = snap.filtroFechaVerifHasta ?? ''
            filtroSetar.value = snap.filtroSetar ?? ''
            filtroPlataforma.value = snap.filtroPlataforma ?? ''
            filtroArbolSeco.value = snap.filtroArbolSeco ?? ''
            filtroEmergencia.value = snap.filtroEmergencia ?? ''
            filtroSegundaNota.value = snap.filtroSegundaNota ?? ''
            filtroFichaTecnica.value = snap.filtroFichaTecnica ?? ''
            filtroProcede.value = snap.filtroProcede ?? ''
        } catch (e) {
            console.warn('No se pudo restaurar filtros del reporte:', e)
        }
    }
    // Esperar un tick para que Vue aplique los filtros antes de imprimir
    activeTab.value = 'generador'
    setTimeout(() => {
        showToast('Re-generando vista de impresión para: ' + imp.nombre_reporte, 'success')
        window.print()
    }, 200)
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

const formatFecha = (val) => {
    if (!val) return '—'
    // Firestore Timestamp object (tiene método toDate())
    let f
    if (val && typeof val.toDate === 'function') {
        f = val.toDate()
    } else if (val && typeof val === 'object' && val.seconds) {
        // Formato plano { seconds, nanoseconds }
        f = new Date(val.seconds * 1000)
    } else {
        f = new Date(val)
    }
    if (isNaN(f.getTime())) return '—'
    return f.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const limpiarFiltros = () => {
    nombreHojaRuta.value = ''
    filtroBarrio.value = ''
    filtroTecnico.value = ''
    filtroSetar.value = ''
    filtroPlataforma.value = ''
    filtroEstado.value = 'En espera'
    filtroUrgencia.value = ''
    filtroAccion.value = ''
    filtroEspecie.value = ''
    filtroDistrito.value = ''
    filtroTipoInstitucion.value = ''
    filtroFechaVerifDesde.value = ''
    filtroFechaVerifHasta.value = ''
    filtroArbolSeco.value = ''
    filtroEmergencia.value = ''
    filtroSegundaNota.value = ''
    filtroFichaTecnica.value = ''
    filtroProcede.value = ''
}
</script>

<template>
    <div class="reportes-view p-6 text-main animate-in">
        
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
                        
                        <div class="flex justify-between items-center mb-6 relative z-10">
                            <h3 class="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                <Filter size="14" /> Parámetros de Compilación
                            </h3>
                            <button @click="limpiarFiltros" 
                                class="text-[10px] font-black text-red-500 hover:text-white transition-all uppercase tracking-widest flex items-center gap-1 cursor-pointer bg-red-500/10 hover:bg-red-600 px-2.5 py-1 rounded-lg">
                                Limpiar
                            </button>
                        </div>

                        <div class="space-y-6 max-h-[620px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                            <!-- SECCIÓN: REPORTES & ESTADOS -->
                            <div class="space-y-4">
                                <span class="text-[9px] font-black text-muted uppercase tracking-wider block border-b border-main pb-1.5">Reportes y Estados</span>
                                <div>
                                    <label class="label-mini">Nombre del Reporte (Opcional)</label>
                                    <input type="text" v-model="nombreHojaRuta" placeholder="Ej: Ruta Norte Lunes..." class="input-modern" />
                                </div>
                                <div>
                                    <label class="label-mini">Estado del Trámite</label>
                                    <select v-model="filtroEstado" class="input-modern">
                                        <option value="En espera">Solo Pendientes</option>
                                        <option value="Terminado">Solo Terminados</option>
                                        <option value="">Cualquier estado</option>
                                    </select>
                                </div>
                            </div>

                            <!-- SECCIÓN: UBICACIÓN -->
                            <div class="space-y-4">
                                <span class="text-[9px] font-black text-muted uppercase tracking-wider block border-b border-main pb-1.5">Ubicación</span>
                                <div>
                                    <label class="label-mini">Distrito Municipal</label>
                                    <select v-model="filtroDistrito" class="input-modern">
                                        <option value="">Todos los distritos</option>
                                        <option v-for="d in store.distritos" :key="d.id" :value="d.id">{{ d.nombre }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="label-mini">Barrio Objetivo</label>
                                    <select v-model="filtroBarrio" class="input-modern">
                                        <option value="">Todos los sectores</option>
                                        <option v-for="b in (filtroDistrito ? store.barrios.filter(x => x.id_distrito == filtroDistrito) : store.barrios)" :key="b.id" :value="b.id">{{ b.nombre }}</option>
                                    </select>
                                </div>
                            </div>

                            <!-- SECCIÓN: RANGOS DE FECHAS -->
                            <div class="space-y-4">
                                <span class="text-[9px] font-black text-muted uppercase tracking-wider block border-b border-main pb-1.5">Rango de Fechas</span>
                                <div>
                                    <label class="label-mini">F. Verificación Desde</label>
                                    <input type="date" v-model="filtroFechaVerifDesde" class="input-modern" />
                                </div>
                                <div>
                                    <label class="label-mini">F. Verificación Hasta</label>
                                    <input type="date" v-model="filtroFechaVerifHasta" class="input-modern" />
                                </div>
                            </div>

                            <!-- SECCIÓN: DETALLES TÉCNICOS -->
                            <div class="space-y-4">
                                <span class="text-[9px] font-black text-muted uppercase tracking-wider block border-b border-main pb-1.5">Detalles Técnicos</span>
                                <div>
                                    <label class="label-mini">Técnico Responsable</label>
                                    <select v-model="filtroTecnico" class="input-modern">
                                        <option value="">Todos los técnicos</option>
                                        <option v-for="t in store.tecnicos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="label-mini">Acción Técnica</label>
                                    <select v-model="filtroAccion" class="input-modern">
                                        <option value="">Todas las acciones</option>
                                        <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="label-mini">Tipo de Institución</label>
                                    <select v-model="filtroTipoInstitucion" class="input-modern">
                                        <option value="">Particular / Todos</option>
                                        <option v-for="t in store.tipos_institucion" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="label-mini">Especie de Árbol</label>
                                    <select v-model="filtroEspecie" class="input-modern">
                                        <option value="">Todas las especies</option>
                                        <option v-for="e in store.especies" :key="e.id" :value="e.id">{{ e.nombre }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="label-mini">Nivel de Urgencia</label>
                                    <select v-model="filtroUrgencia" class="input-modern">
                                        <option value="">Todas</option>
                                        <option value="Baja">🟢 Baja</option>
                                        <option value="Intermedia">🟡 Intermedia</option>
                                        <option value="Alta">🔴 Alta</option>
                                    </select>
                                </div>
                            </div>

                            <!-- SECCIÓN: CONDICIONES LOGÍSTICAS -->
                            <div class="space-y-4">
                                <span class="text-[9px] font-black text-muted uppercase tracking-wider block border-b border-main pb-1.5">Condiciones Logísticas</span>
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
                                    <div>
                                        <label class="label-mini">Seco</label>
                                        <select v-model="filtroArbolSeco" class="input-modern">
                                            <option value="">Ambos</option>
                                            <option value="1">Sí</option>
                                            <option value="0">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="label-mini">Emergencia</label>
                                        <select v-model="filtroEmergencia" class="input-modern">
                                            <option value="">Ambos</option>
                                            <option value="1">Sí</option>
                                            <option value="0">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="label-mini">2da Nota</label>
                                        <select v-model="filtroSegundaNota" class="input-modern">
                                            <option value="">Ambos</option>
                                            <option value="1">Sí</option>
                                            <option value="0">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="label-mini">Ficha Tec.</label>
                                        <select v-model="filtroFichaTecnica" class="input-modern">
                                            <option value="">Ambos</option>
                                            <option value="1">Sí</option>
                                            <option value="0">No</option>
                                        </select>
                                    </div>
                                    <div class="col-span-2">
                                        <label class="label-mini">Procede</label>
                                        <select v-model="filtroProcede" class="input-modern">
                                            <option value="">Ambos</option>
                                            <option value="1">Sí</option>
                                            <option value="0">No</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button @click="imprimirHojaRuta" 
                            class="w-full mt-6 bg-accent text-on-accent py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer">
                            <Printer size="18" /> Generar y Registrar
                        </button>
                        <button @click="exportarExcel" 
                            class="w-full mt-3 bg-card-sec text-accent border border-main py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer">
                            <Download size="18" /> Exportar a Excel
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
                                        <th class="px-8 py-4 w-32 border-b border-main">Código / F. Ingreso</th>
                                        <th class="px-8 py-4 border-b border-main">Solicitante y Ubicación</th>
                                        <th class="px-6 py-4 border-b border-main">Detalle de Acción Técnica</th>
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
                                            <p class="font-black text-accent text-sm mb-0.5 whitespace-nowrap">{{ sol.comunicacion_interna || `#${sol.id_solicitud}` }}</p>
                                            <p class="text-[10px] text-muted font-bold">{{ formatFechaSimple(sol.fecha_ingreso) }}</p>
                                        </td>
                                        <td class="px-8 py-5 border-b border-main">
                                            <p class="text-xs text-muted font-black uppercase tracking-tighter mb-0.5">{{ sol.solicitante_nombre }}</p>
                                            <p class="text-[10px] text-muted mb-1">📞 Telf: {{ sol.solicitante_telefono || '—' }}</p>
                                            <p class="text-sm font-bold text-main mb-0.5">{{ sol.calle }} {{ sol.numero_casa }}</p>
                                            <p class="text-[10px] text-accent font-black uppercase tracking-widest">{{ getBarrio(sol.id_barrio) }} (Distrito {{ getDistritoByBarrio(sol.id_barrio) }})</p>
                                        </td>
                                        <td class="px-6 py-5 border-b border-main">
                                            <p class="text-xs font-black text-main uppercase mb-0.5">Determinado: {{ formatLoDeterminado(sol) }}</p>
                                            <p class="text-[11px] text-muted mb-0.5">Solicitado: {{ formatLoSolicitado(sol) }}</p>
                                            <p class="text-[10px] text-muted italic">Ref: {{ sol.referencia || 'Sin referencia' }}</p>
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
                                        <button @click="handleReimprimir(imp)" class="btn-icon btn-print" title="Ver / Descargar">
                                            <Eye />
                                        </button>
                                        <button @click="confirmarEliminar(imp)" class="btn-icon btn-delete" title="Eliminar del historial">
                                            <Trash2 />
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
                    <p class="font-bold text-sm print-sec">DIRECCIÓN DE OBRAS PÚBLICAS MUNICIPALES DE TARIJA</p>
                    <p class="text-sm font-medium print-unit">Unidad de Mantenimiento de Ornato Público • Área de Arboricultura</p>
                </div>
            </div>

            <div class="text-center mb-6">
                <h1 class="text-2xl font-black mt-2 print-title">HOJA DE RUTA CONSOLIDADA</h1>
                <div class="flex justify-center gap-4 mt-1 text-[10px] font-bold italic text-gray-600 print-meta">
                    <span>Emisión: {{ new Date().toLocaleString() }}</span>
                    <span>|</span>
                    <span>Generado por: Usuario {{ uiState.user?.nombre }}</span>
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
                        <th class="border-2 border-black p-2 w-20">Código</th>
                        <th class="border-2 border-black p-2 w-20">F. Ingreso</th>
                        <th class="border-2 border-black p-2 w-48 text-left">Solicitante y Ubicación</th>
                        <th class="border-2 border-black p-2 text-left">Detalle de Acción Técnica</th>
                        <th class="border-2 border-black p-2 w-24">Firma Conformidad</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(sol, idx) in solicitudesFiltradas" :key="sol.id_solicitud" class="text-[10px]">
                        <td class="border-2 border-black p-2 text-center font-bold">{{ idx + 1 }}</td>
                        <td class="border-2 border-black p-2 text-center font-black whitespace-nowrap">{{ sol.comunicacion_interna || `#${sol.id_solicitud}` }}</td>
                        <td class="border-2 border-black p-2 text-center whitespace-nowrap">{{ formatFechaSimple(sol.fecha_ingreso) }}</td>
                        <td class="border-2 border-black p-2">
                            <p class="font-black uppercase text-emerald-900 mb-0.5">{{ sol.solicitante_nombre }}</p>
                            <p class="text-[9px] text-gray-500 mb-1 font-bold">📞 Telf: {{ sol.solicitante_telefono || '—' }}</p>
                            <p class="font-bold mb-0.5">{{ sol.calle }} {{ sol.numero_casa }}</p>
                            <p class="text-[9px] italic">{{ getBarrio(sol.id_barrio) }} (Distrito {{ getDistritoByBarrio(sol.id_barrio) }})</p>
                        </td>
                        <td class="border-2 border-black p-2">
                            <p class="font-bold uppercase text-gray-800 mb-0.5">Determinado: {{ formatLoDeterminado(sol) }}</p>
                            <p class="text-[9px] text-gray-600 mb-0.5">Solicitado: {{ formatLoSolicitado(sol) }}</p>
                            <p class="text-[9px] text-gray-500 italic">Ref: {{ sol.referencia || 'Sin referencia' }}</p>
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
                    <p class="text-[10px] font-black uppercase">{{ responsableArea }}</p>
                    <p class="text-[8px] text-gray-400">Responsable de Área</p>
                </div>
                <div class="border-t border-black pt-2">
                    <p class="text-[10px] font-black uppercase">{{ jefeUnidad }}</p>
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
        <div v-if="showConfirmModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[99999]">
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
