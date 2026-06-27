<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMainStore } from '../store/mainStore.js'
import packageInfo from '../../package.json'
const mainStore = useMainStore()

import { 
    Trees, Wrench, Home, Map, Landmark, Building, Palette, Settings, Calendar,
    Plus, Pencil, Trash2, X, AlertTriangle, Database, Server, Lock, Eye, EyeOff
} from 'lucide-vue-next'

// Mapa de color por número de distrito
const DISTRICT_COLORS = {
    1: '#10b981', 2: '#10b981',
    3: '#3b82f6', 4: '#3b82f6',
    5: '#8b5cf6', 6: '#8b5cf6',
    7: '#f59e0b', 8: '#f59e0b',
    9: '#ec4899', 10: '#ec4899',
    11: '#6366f1', 12: '#6366f1', 13: '#6366f1'
}

// Categorías disponibles
const categorias = [
    { id: 'especies', nombre: 'Especies de Árboles', icono: Trees, campos: [
        { key: 'nombre', label: 'Nombre Común', type: 'text' },
        { key: 'nombre_cientifico', label: 'Nombre Científico', type: 'text' }
    ] },
    { id: 'acciones', nombre: 'Acciones Técnicas', icono: Wrench, campos: [
        { key: 'nombre', label: 'Nombre de la Acción', type: 'text' },
        { key: 'descripcion', label: 'Detalles de la Acción', type: 'text' }
    ] },
    { id: 'barrios', nombre: 'Barrios', icono: Home, campos: [
        { key: 'nombre', label: 'Nombre del Barrio', type: 'text' },
        { key: 'id_distrito', label: 'Distrito', type: 'select', options: 'distritos' }
    ]},
    { id: 'calendario', nombre: 'Aniversarios y Feriados', icono: Calendar, tipo: 'especial_calendario' },
    { id: 'distritos', nombre: 'Distritos', icono: Map, campos: [{ key: 'nombre', label: 'Nombre/Número del Distrito', type: 'text' }] },
    { id: 'instituciones', nombre: 'Instituciones', icono: Landmark, campos: [
        { key: 'nombre', label: 'Nombre de la Institución', type: 'text' },
        { key: 'id_tipo', label: 'Tipo de Institución', type: 'select', options: 'tipos_institucion' }
    ]},
    { id: 'tipos_institucion', nombre: 'Tipos de Institución', icono: Building, campos: [{ key: 'nombre', label: 'Categoría', type: 'text' }] },
    { id: 'personalizacion', nombre: 'Identidad Visual', icono: Palette, tipo: 'especial_logos' },
    { id: 'mantenimiento', nombre: 'Mantenimiento', icono: Settings, tipo: 'especial' },
]

const categoriaActiva = ref(categorias[0])
const showModal = ref(false)
const editData = ref(null)
const formData = ref({})

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

const handleBackup = () => {
    window.location.href = `/api/backup?token=${uiState.token}`
    showToast('Iniciando descarga del respaldo...', 'success')
}

const handleLogoUpload = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
        const base64 = event.target.result
        try {
            // Comprimir la imagen antes de guardarla para evitar llenar la cuota de localStorage (5MB)
            const compressed = await compressImage(base64, 800, 800, 0.7)
            if (type === 'app') {
                uiState.logo_app = compressed
                localStorage.setItem('logo_app', compressed)
                await updateConfig({ logo_app: compressed })
            } else {
                uiState.logo_institucional = compressed
                localStorage.setItem('logo_institucional', compressed)
                await updateConfig({ logo_institucional: compressed })
            }
            showToast('Logo guardado en servidor con éxito', 'success')
        } catch (error) {
            console.error('Error al comprimir/subir el logo:', error)
            showToast('No se pudo procesar la imagen', 'error')
        }
    }
    reader.readAsDataURL(file)
}

const removeLogo = async (type) => {
    if (type === 'app') {
        uiState.logo_app = null
        localStorage.removeItem('logo_app')
        await updateConfig({ logo_app: '' })
    } else {
        uiState.logo_institucional = null
        localStorage.removeItem('logo_institucional')
        await updateConfig({ logo_institucional: '' })
    }
    showToast('Logo eliminado del servidor', 'success')
}

// Datos y acciones del store
const { 
    store, uiState, 
    addCatalogo, updateCatalogo, deleteCatalogo, showToast, updateConfig, compressImage,
    fetchCalendario, addCalendarioEvento, updateCalendarioEvento, deleteCalendarioEvento
} = mainStore

const localCalendarioData = ref([])

const loadCalendario = async () => {
    localCalendarioData.value = await fetchCalendario()
}

onMounted(async () => {
    await loadCalendario()
})

// Items para catálogos genéricos (no calendario)
const items = computed(() => store[categoriaActiva.value.id] || [])

const cambiarCategoria = (cat) => {
    categoriaActiva.value = cat
    if (cat.id === 'calendario') loadCalendario()
}

// --- GESTIÓN GENÉRICA DE CATÁLOGOS ---
const abrirNuevo = () => {
    editData.value = null
    formData.value = {}
    if (categoriaActiva.value.campos) {
        categoriaActiva.value.campos.forEach(c => {
            formData.value[c.key] = ''
        })
    }
    showModal.value = true
}

const abrirEdicion = (item) => {
    editData.value = item
    formData.value = { ...item }
    showModal.value = true
}

const guardar = async () => {
    let ok = false
    const tabla = categoriaActiva.value.id
    if (editData.value) {
        ok = await updateCatalogo(tabla, editData.value.id, formData.value)
    } else {
        ok = await addCatalogo(tabla, formData.value)
    }
    if (ok === true) {
        showToast('Guardado correctamente', 'success')
        showModal.value = false
    } else {
        showToast(ok || 'Error al guardar', 'error')
    }
}

const eliminar = (id) => {
    mostrarConfirmacion(
        'Confirmar Eliminación',
        '¿Estás seguro de eliminar este registro? Esto podría afectar a las solicitudes existentes y no se puede deshacer.',
        async () => {
            const ok = await deleteCatalogo(categoriaActiva.value.id, id)
            if (ok) showToast('Eliminado correctamente', 'success')
            else showToast('Error al eliminar', 'error')
        }
    )
}

// --- GESTIÓN ESPECIAL: ANIVERSARIOS Y FERIADOS ---

// Determinar si un ítem es feriado por su nombre
const esFeriado = (item) => item?.nombre_barrio?.startsWith('Feriado:')

// Obtener color automático para un barrio según su distrito
const getColorForBarrio = (nombreBarrio) => {
    if (!nombreBarrio) return '#10b981'
    const barrio = store.barrios.find(b =>
        b.nombre?.toLowerCase().trim() === nombreBarrio?.toLowerCase().trim()
    )
    if (!barrio) return '#10b981'
    return DISTRICT_COLORS[barrio.id_distrito] || '#10b981'
}

// Formatear fecha de DB correctamente — muestra solo DD de MMMM (sin año)
// porque estos eventos son anuales; el año en el DB es sólo referencial
const formatFechaCalendario = (val) => {
    if (!val) return '—'
    try {
        const str = (val instanceof Date)
            ? val.toISOString().split('T')[0]
            : String(val).split('T')[0]
        if (!str || str === 'undefined') return '—'
        // Mostrar solo día y mes, sin año
        return new Date(str + 'T00:00:00Z').toLocaleDateString('es-ES', {
            day: '2-digit', month: 'long', timeZone: 'UTC'
        })
    } catch { return '—' }
}

// Estado del modal de calendario
const tipoCalendario = ref('barrio')  // 'barrio' | 'feriado'
const showCalendarioModal = ref(false)
const editCalendarioData = ref(null)
const formCalendario = ref({
    nombre_barrio: '',
    nombre_feriado: '',
    fecha_aniversario: '',
    presidente_barrio: '',
    telefono_presidente: ''
})

const abrirNuevoCalendario = () => {
    editCalendarioData.value = null
    tipoCalendario.value = 'barrio'
    formCalendario.value = {
        nombre_barrio: '',
        nombre_feriado: '',
        fecha_aniversario: '',
        presidente_barrio: '',
        telefono_presidente: ''
    }
    showCalendarioModal.value = true
}

const abrirEdicionCalendario = (item) => {
    editCalendarioData.value = item
    const isFer = esFeriado(item)
    tipoCalendario.value = isFer ? 'feriado' : 'barrio'

    // Parsear la fecha de forma segura
    const dateStr = (item.fecha_aniversario instanceof Date)
        ? item.fecha_aniversario.toISOString().split('T')[0]
        : String(item.fecha_aniversario || '').split('T')[0]

    formCalendario.value = {
        nombre_barrio: isFer ? '' : (item.nombre_barrio || ''),
        nombre_feriado: isFer ? item.nombre_barrio.replace('Feriado: ', '') : '',
        fecha_aniversario: dateStr,
        presidente_barrio: item.presidente_barrio || '',
        telefono_presidente: item.telefono_presidente || ''
    }
    showCalendarioModal.value = true
}

const guardarCalendario = async () => {
    const isFer = tipoCalendario.value === 'feriado'
    let nombre_barrio, color_etiqueta

    if (isFer) {
        const nombreFer = formCalendario.value.nombre_feriado?.trim()
        if (!nombreFer) { showToast('Ingrese el nombre del feriado', 'error'); return }
        nombre_barrio = `Feriado: ${nombreFer}`
        color_etiqueta = '#ef4444'
    } else {
        nombre_barrio = formCalendario.value.nombre_barrio
        if (!nombre_barrio) { showToast('Seleccione un barrio', 'error'); return }
        color_etiqueta = getColorForBarrio(nombre_barrio)
    }

    if (!formCalendario.value.fecha_aniversario) {
        showToast('Ingrese la fecha', 'error'); return
    }

    const payload = {
        nombre_barrio,
        fecha_aniversario: formCalendario.value.fecha_aniversario,
        presidente_barrio: isFer ? null : (formCalendario.value.presidente_barrio || null),
        telefono_presidente: isFer ? null : (formCalendario.value.telefono_presidente || null),
        color_etiqueta
    }

    let res
    if (editCalendarioData.value) {
        res = await updateCalendarioEvento(editCalendarioData.value.id, payload)
    } else {
        res = await addCalendarioEvento(payload)
    }

    if (res.success) {
        showToast('Guardado correctamente', 'success')
        showCalendarioModal.value = false
        await loadCalendario()
    } else {
        showToast(res.error || 'Error al guardar', 'error')
    }
}

const eliminarCalendario = (id) => {
    mostrarConfirmacion(
        'Confirmar Eliminación',
        '¿Estás seguro de eliminar este registro? No se puede deshacer.',
        async () => {
            const ok = await deleteCalendarioEvento(id)
            if (ok) {
                await loadCalendario()
                showToast('Eliminado correctamente', 'success')
            } else {
                showToast('Error al eliminar', 'error')
            }
        }
    )
}

// Helpers para selects genéricos
const getOptions = (optionKey) => store[optionKey] || []
</script>

<template>
    <div class="config-view p-2 h-full flex flex-col">
        <div class="mb-8">
            <h2 class="text-3xl font-black text-main tracking-tighter uppercase">Configuración Maestro</h2>
            <p class="text-muted font-medium">Control centralizado de catálogos e identidad corporativa</p>
        </div>

        <div class="flex flex-1 gap-8 overflow-hidden">
            <!-- Sidebar de Categorías -->
            <div class="w-72 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar shrink-0">
                <button v-for="cat in categorias" :key="cat.id" 
                    @click="cambiarCategoria(cat)"
                    :class="[
                        'flex items-center gap-4 p-5 rounded-[1.5rem] font-bold transition-all border shadow-sm',
                        categoriaActiva.id === cat.id 
                            ? 'bg-accent text-[color:var(--text-on-accent)] border-accent shadow-accent/20 translate-x-2' 
                            : 'bg-card-main text-main border-main hover:border-accent/50 hover:bg-accent/5'
                    ]"
                >
                    <component :is="cat.icono" class="w-6 h-6 shrink-0 select-none" />
                    <span class="text-xs uppercase tracking-widest text-left">{{ cat.nombre }}</span>
                </button>
            </div>

            <!-- Panel Central -->
            <div class="flex-1 bg-card-main rounded-[2.5rem] shadow-xl border border-main flex flex-col overflow-hidden relative">
                
                <!-- VISTA DE IDENTIDAD VISUAL (LOGOS) -->
                <div v-if="categoriaActiva.tipo === 'especial_logos'" class="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                    <div class="border-b border-main pb-6">
                        <h3 class="text-2xl font-black text-main">Identidad Visual</h3>
                        <p class="text-muted">Personaliza los logotipos que se muestran en el sistema y reportes.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <!-- Logo de la App -->
                        <div class="space-y-4">
                            <h4 class="text-sm font-black text-main uppercase tracking-widest ml-2">Logo de la Aplicación</h4>
                            <div class="bg-card-sec p-8 rounded-[2.5rem] border-2 border-dashed border-main flex flex-col items-center gap-6 relative group">
                                <div class="w-40 h-40 bg-card-main rounded-[2rem] shadow-2xl flex items-center justify-center overflow-hidden border border-main">
                                    <img v-if="uiState.logo_app" :src="uiState.logo_app" class="w-full h-full object-contain p-4">
                                    <Trees v-else class="w-16 h-16 text-accent/40" />
                                </div>
                                <div class="text-center">
                                    <p class="text-[10px] font-black text-muted uppercase tracking-widest">Uso: Sidebar y Pantalla de Login</p>
                                    <div class="flex gap-3 mt-4">
                                        <label class="px-6 py-2 bg-accent text-[color:var(--text-on-accent)] rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-lg shadow-accent/20">
                                            Subir Nuevo
                                            <input type="file" @change="e => handleLogoUpload(e, 'app')" class="hidden" accept="image/*">
                                        </label>
                                        <button v-if="uiState.logo_app" @click="removeLogo('app')" class="px-6 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Logo Institucional -->
                        <div class="space-y-4">
                            <h4 class="text-sm font-black text-main uppercase tracking-widest ml-2">Logo para Reportes (PDF)</h4>
                            <div class="bg-card-sec p-8 rounded-[2.5rem] border-2 border-dashed border-main flex flex-col items-center gap-6">
                                <div class="w-full h-40 bg-card-main rounded-[2rem] shadow-xl flex items-center justify-center overflow-hidden border border-main">
                                    <img v-if="uiState.logo_institucional" :src="uiState.logo_institucional" class="w-full h-full object-contain p-6">
                                    <div v-else class="text-center opacity-30 flex flex-col items-center gap-1.5">
                                        <Landmark class="w-10 h-10 text-main mb-1" />
                                        <p class="text-[10px] font-black uppercase tracking-tighter text-main">Sin Logo Institucional</p>
                                    </div>
                                </div>
                                <div class="text-center">
                                    <p class="text-[10px] font-black text-muted uppercase tracking-widest">Uso: Encabezado de Reportes Técnicos</p>
                                    <div class="flex gap-3 mt-4">
                                        <label class="px-6 py-2 bg-accent text-[color:var(--text-on-accent)] rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-lg shadow-accent/20">
                                            Cargar Imagen
                                            <input type="file" @change="e => handleLogoUpload(e, 'institucional')" class="hidden" accept="image/*">
                                        </label>
                                        <button v-if="uiState.logo_institucional" @click="removeLogo('institucional')" class="px-6 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VISTA DE MANTENIMIENTO -->
                <div v-else-if="categoriaActiva.tipo === 'especial'" class="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                    <div class="border-b border-main pb-6">
                        <h3 class="text-2xl font-black text-main">Mantenimiento Global</h3>
                        <p class="text-muted">Herramientas de respaldo y estado de los servicios.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-accent-soft border border-accent/20 p-8 rounded-[2rem] flex flex-col gap-6">
                            <div class="w-16 h-16 bg-accent text-[color:var(--text-on-accent)] rounded-2xl flex items-center justify-center shadow-lg shadow-accent/30">
                                <Database class="w-8 h-8" />
                            </div>
                            <div>
                                <h4 class="text-xl font-black text-main">Copia de Seguridad</h4>
                                <p class="text-sm text-muted mt-2">Genera un respaldo completo de la base de datos MySQL en formato SQL.</p>
                            </div>
                            <button @click="handleBackup" class="w-full bg-accent hover:bg-accent-hover text-[color:var(--text-on-accent)] py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-accent/20 active:scale-95">
                                Descargar Respaldo
                            </button>
                        </div>

                        <div class="bg-card-main border border-main p-8 rounded-[2rem] flex flex-col gap-6">
                            <div class="w-16 h-16 bg-card-sec rounded-2xl flex items-center justify-center border border-main text-accent">
                                <Server class="w-8 h-8" />
                            </div>
                            <div>
                                <h4 class="text-xl font-black text-main">Estado del Servidor</h4>
                                <div class="mt-4 space-y-2">
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-muted font-medium">Versión Frontend</span>
                                        <span class="font-black text-accent">v{{ packageInfo.version }}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-muted font-medium">Base de Datos</span>
                                        <span class="text-green-500 font-black flex items-center gap-1">
                                            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            SINCRONIZADO
                                         </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VISTA DE ANIVERSARIOS Y FERIADOS (ESPECIAL) -->
                <div v-else-if="categoriaActiva.tipo === 'especial_calendario'" class="flex flex-col overflow-hidden h-full">
                    <!-- Header -->
                    <div class="p-8 border-b border-main flex justify-between items-center bg-accent-soft shrink-0">
                        <div>
                            <h3 class="text-2xl font-black text-main uppercase tracking-tighter">Aniversarios y Feriados</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="w-2 h-2 bg-accent rounded-full"></span>
                                <p class="text-xs text-muted font-bold uppercase tracking-widest">{{ localCalendarioData.length }} Registros totales</p>
                            </div>
                        </div>
                        <button @click="abrirNuevoCalendario" class="bg-accent hover:bg-accent-hover text-[color:var(--text-on-accent)] px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-xl shadow-accent/20 active:scale-95">
                            <Plus class="w-4 h-4" /> Nuevo Registro
                        </button>
                    </div>

                    <!-- Tabla -->
                    <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <table class="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr class="text-[10px] font-black uppercase text-muted tracking-[0.3em]">
                                    <th class="px-6 py-2">ID</th>
                                    <th class="px-6 py-2">Tipo</th>
                                    <th class="px-6 py-2">Nombre</th>
                                    <th class="px-6 py-2">Fecha</th>
                                    <th class="px-6 py-2">Color</th>
                                    <th class="px-6 py-2 text-right">Gestión</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in localCalendarioData" :key="item.id" class="group bg-card-sec hover:bg-accent-soft transition-all">
                                    <td class="px-6 py-4 text-sm font-black text-accent border-y border-l border-main rounded-l-2xl w-20">
                                        #{{ item.id }}
                                    </td>
                                    <td class="px-5 py-4 border-y border-main">
                                        <span :class="[
                                            esFeriado(item)
                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : 'bg-accent/10 text-accent border-accent/20',
                                            'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border whitespace-nowrap'
                                        ]">
                                            {{ esFeriado(item) ? 'Feriado' : 'Aniversario' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 border-y border-main">
                                        <span class="text-sm font-bold text-main">
                                            {{ esFeriado(item) ? item.nombre_barrio.replace('Feriado: ', '') : item.nombre_barrio }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 border-y border-main">
                                        <span class="text-sm font-bold text-main">{{ formatFechaCalendario(item.fecha_aniversario) }}</span>
                                    </td>
                                    <td class="px-6 py-4 border-y border-main">
                                        <div class="flex items-center gap-2">
                                            <div class="w-5 h-5 rounded-full border border-main shrink-0" :style="{ backgroundColor: item.color_etiqueta }"></div>
                                            <span class="text-[10px] font-mono font-bold text-muted">{{ item.color_etiqueta }}</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-right border-y border-r border-main rounded-r-2xl">
                                        <div class="flex justify-end gap-3">
                                            <button @click="abrirEdicionCalendario(item)" class="btn-icon btn-edit" title="Editar Registro">
                                                <Pencil />
                                            </button>
                                            <button @click="eliminarCalendario(item.id)" class="btn-icon btn-delete" title="Eliminar Registro">
                                                <Trash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>



                <!-- VISTA DE CATÁLOGOS GENÉRICOS -->
                <template v-else>
                    <div class="p-8 border-b border-main flex justify-between items-center bg-accent-soft">
                        <div>
                            <h3 class="text-2xl font-black text-main uppercase tracking-tighter">{{ categoriaActiva.nombre }}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="w-2 h-2 bg-accent rounded-full"></span>
                                <p class="text-xs text-muted font-bold uppercase tracking-widest">{{ items.length }} Registros totales</p>
                            </div>
                        </div>
                        <button @click="abrirNuevo" class="bg-accent hover:bg-accent-hover text-[color:var(--text-on-accent)] px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-xl shadow-accent/20 active:scale-95">
                            <Plus class="w-4 h-4" /> Nuevo Registro
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <table class="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr class="text-[10px] font-black uppercase text-muted tracking-[0.3em]">
                                    <th class="px-6 py-2">Identificador</th>
                                    <th v-for="campo in categoriaActiva.campos" :key="campo.key" class="px-6 py-2">{{ campo.label }}</th>
                                    <th class="px-6 py-2 text-right">Gestión</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in items" :key="item.id" class="group bg-card-sec hover:bg-accent-soft transition-all">
                                    <td class="px-6 py-5 text-sm font-black text-accent border-y border-l border-main rounded-l-2xl w-32">
                                        #{{ item.id }}
                                    </td>
                                    <td v-for="campo in categoriaActiva.campos" :key="campo.key" class="px-6 py-5 border-y border-main">
                                        <template v-if="campo.type === 'select'">
                                            <span class="text-xs font-black text-main bg-accent-soft px-3 py-1.5 rounded-lg border border-accent/20">
                                                {{ getOptions(campo.options).find(o => o.id == item[campo.key])?.nombre || item[campo.key] }}
                                            </span>
                                        </template>
                                        <template v-else>
                                            <span class="text-sm font-bold text-main">{{ item[campo.key] }}</span>
                                        </template>
                                    </td>
                                    <td class="px-6 py-5 text-right border-y border-r border-main rounded-r-2xl">
                                        <div class="flex justify-end gap-3 transition-all">
                                            <button @click="abrirEdicion(item)" class="btn-icon btn-edit" title="Editar Registro">
                                                <Pencil />
                                            </button>
                                            <button @click="eliminar(item.id)" class="btn-icon btn-delete" title="Eliminar Registro">
                                                <Trash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </div>
        </div>

        <!-- MODAL DE ANIVERSARIOS Y FERIADOS (DEDICADO) -->
        <Teleport to="body">
            <div v-if="showCalendarioModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
                <div class="bg-card-main rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden flex flex-col border border-main animate-prime-in">
                    
                    <!-- Cabecera -->
                    <div class="px-8 py-6 modal-header-gradient flex justify-between items-center shadow-lg shrink-0">
                        <div>
                            <h3 class="font-black text-xl tracking-tight leading-none text-[color:var(--text-on-accent)]">
                                {{ editCalendarioData ? 'Modificar Registro' : 'Agregar Nuevo Registro' }}
                            </h3>
                            <p class="text-[9px] text-[color:var(--text-on-accent)] opacity-80 font-bold uppercase tracking-[0.3em] mt-2">
                                Aniversarios y Feriados
                            </p>
                        </div>
                        <button type="button" @click="showCalendarioModal = false" class="hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center">
                            <X class="w-6 h-6 text-[color:var(--text-on-accent)]" />
                        </button>
                    </div>
                    
                    <!-- Formulario -->
                    <div class="p-8 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar bg-card-sec">

                        <!-- Selector de tipo (solo al crear) -->
                        <div v-if="!editCalendarioData" class="grid grid-cols-2 gap-2 p-1.5 bg-card-main rounded-2xl border border-main">
                            <button type="button" @click="tipoCalendario = 'barrio'; formCalendario.nombre_feriado = ''"
                                :class="[
                                    tipoCalendario === 'barrio'
                                        ? 'bg-accent text-[color:var(--text-on-accent)] shadow-lg shadow-accent/20'
                                        : 'text-muted hover:text-main',
                                    'py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all'
                                ]">
                                Aniversario de Barrio
                            </button>
                            <button type="button" @click="tipoCalendario = 'feriado'; formCalendario.nombre_barrio = ''"
                                :class="[
                                    tipoCalendario === 'feriado'
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                        : 'text-muted hover:text-main',
                                     'py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all'
                                ]">
                                Feriado / Festivo
                            </button>
                        </div>

                        <!-- Indicador de tipo (solo al editar) -->
                        <div v-else class="flex items-center gap-3 p-3 bg-card-main rounded-xl border border-main">
                            <span :class="[
                                esFeriado(editCalendarioData) ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-accent/10 text-accent border-accent/20',
                                'text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border'
                            ]">
                                {{ esFeriado(editCalendarioData) ? 'Feriado' : 'Aniversario de Barrio' }}
                            </span>
                            <span class="text-xs text-muted font-semibold">El tipo no es editable</span>
                        </div>

                        <!-- Campos para BARRIO -->
                        <template v-if="tipoCalendario === 'barrio'">
                            <div class="p-5 bg-card-main border border-main rounded-xl shadow-sm space-y-2">
                                <label class="label-prime">Barrio <span class="text-red-500 font-black">*</span></label>
                                <select v-model="formCalendario.nombre_barrio" required class="form-input-prime">
                                    <option value="" disabled>-- Seleccione un barrio --</option>
                                    <option v-for="barrio in store.barrios" :key="barrio.id" :value="barrio.nombre">{{ barrio.nombre }}</option>
                                </select>
                            </div>
                            <div class="p-5 bg-card-main border border-main rounded-xl shadow-sm space-y-2">
                                <label class="label-prime">Fecha de Aniversario <span class="text-red-500 font-black">*</span></label>
                                <input type="date" v-model="formCalendario.fecha_aniversario" required class="form-input-prime [color-scheme:dark]">
                            </div>
                            <div class="p-5 bg-card-main border border-main rounded-xl shadow-sm space-y-2">
                                <label class="label-prime">Presidente del Barrio</label>
                                <input type="text" v-model="formCalendario.presidente_barrio" class="form-input-prime" placeholder="Nombre del presidente...">
                            </div>
                            <div class="p-5 bg-card-main border border-main rounded-xl shadow-sm space-y-2">
                                <label class="label-prime">Teléfono del Presidente</label>
                                <input type="text" v-model="formCalendario.telefono_presidente" class="form-input-prime" placeholder="Número de contacto...">
                            </div>
                            <!-- Color auto-asignado (solo visual) -->
                            <div class="p-4 bg-card-main border border-main rounded-xl flex items-center gap-3">
                                <div class="w-9 h-9 rounded-full border-2 border-white/20 shadow-lg shrink-0 transition-colors"
                                     :style="{ backgroundColor: getColorForBarrio(formCalendario.nombre_barrio) }">
                                </div>
                                <div>
                                    <p class="text-[10px] font-black text-muted uppercase tracking-widest">Color de Etiqueta</p>
                                    <p class="text-xs text-main font-semibold mt-0.5">Asignado automáticamente por distrito</p>
                                </div>
                            </div>
                        </template>

                        <!-- Campos para FERIADO -->
                        <template v-if="tipoCalendario === 'feriado'">
                            <div class="p-5 bg-card-main border border-main rounded-xl shadow-sm space-y-2">
                                <label class="label-prime">Nombre del Feriado <span class="text-red-500 font-black">*</span></label>
                                <input type="text" v-model="formCalendario.nombre_feriado" required class="form-input-prime" placeholder="Ej: Año Nuevo, Día del Trabajo...">
                            </div>
                            <div class="p-5 bg-card-main border border-main rounded-xl shadow-sm space-y-2">
                                <label class="label-prime">Fecha del Feriado <span class="text-red-500 font-black">*</span></label>
                                <input type="date" v-model="formCalendario.fecha_aniversario" required class="form-input-prime [color-scheme:dark]">
                            </div>
                            <!-- Color automático rojo para feriados (solo visual) -->
                            <div class="p-4 bg-card-main border border-main rounded-xl flex items-center gap-3">
                                <div class="w-9 h-9 rounded-full border-2 border-red-500/30 shadow-lg shrink-0 bg-red-500"></div>
                                <div>
                                    <p class="text-[10px] font-black text-muted uppercase tracking-widest">Color de Etiqueta</p>
                                    <p class="text-xs text-main font-semibold mt-0.5">Rojo — asignado automáticamente a todos los feriados</p>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- Acciones -->
                    <div class="p-8 bg-app-main border-t border-main flex gap-4 shrink-0">
                        <button type="button" @click="showCalendarioModal = false"
                            class="flex-1 px-4 py-3 bg-card-main border border-main rounded-xl font-black text-[10px] uppercase tracking-widest text-muted hover:bg-accent-soft transition-all active:scale-95 shadow-sm cursor-pointer">
                            Cancelar
                        </button>
                        <button type="button" @click="guardarCalendario"
                            class="flex-[2] bg-accent hover:bg-accent-hover text-[color:var(--text-on-accent)] px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer">
                            {{ editCalendarioData ? 'Guardar Cambios' : 'Crear Registro' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- MODAL DE EDICIÓN/NUEVO GENÉRICO (Para catálogos normales) -->
        <Teleport to="body">
            <div v-if="showModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
                <div class="bg-card-main rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden flex flex-col border border-main animate-prime-in">
                    
                    <!-- Cabecera del Modal -->
                    <div class="px-8 py-6 modal-header-gradient text-white flex justify-between items-center shadow-lg relative shrink-0">
                        <div>
                            <h3 class="font-black text-xl tracking-tight leading-none text-[color:var(--text-on-accent)]">
                                {{ editData ? 'Modificar Registro' : 'Agregar Nuevo Registro' }}
                            </h3>
                            <p class="text-[9px] text-[color:var(--text-on-accent)] opacity-80 font-bold uppercase tracking-[0.3em] mt-2">
                                Catálogo: {{ categoriaActiva.nombre }}
                            </p>
                        </div>
                        <button type="button" @click="showModal = false" class="hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center">
                            <X class="w-6 h-6 text-[color:var(--text-on-accent)]" />
                        </button>
                    </div>
                    
                    <!-- Formulario -->
                    <form @submit.prevent="guardar" class="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-card-sec">
                        <div v-for="campo in categoriaActiva.campos" :key="campo.key" class="p-5 bg-card-main border border-main rounded-xl shadow-sm space-y-2">
                            <label class="label-prime">
                                {{ campo.label }} 
                                <span v-if="campo.required !== false" class="text-red-500 font-black">*</span>
                            </label>
                            
                            <input v-if="campo.type === 'text'" type="text" v-model="formData[campo.key]" :required="campo.required !== false"
                                class="form-input-prime"
                                :placeholder="`Ingrese el ${campo.label.toLowerCase()}...`">

                            <select v-else-if="campo.type === 'select'" v-model="formData[campo.key]" :required="campo.required !== false"
                                class="form-input-prime">
                                <option value="" disabled>-- Seleccione una opción --</option>
                                <option v-for="opt in getOptions(campo.options)" :key="opt.id" :value="opt.id">{{ opt.nombre }}</option>
                            </select>
                        </div>
                    </form>

                    <!-- Acciones del Formulario -->
                    <div class="p-8 bg-app-main border-t border-main flex gap-4 shrink-0">
                        <button type="button" @click="showModal = false" 
                            class="flex-1 px-4 py-3 bg-card-main border border-main rounded-xl font-black text-[10px] uppercase tracking-widest text-muted hover:bg-accent-soft transition-all active:scale-95 shadow-sm cursor-pointer">
                            Cancelar
                        </button>
                        <button type="submit" @click="guardar" 
                            class="flex-[2] bg-accent hover:bg-accent-hover text-[color:var(--text-on-accent)] px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer">
                            {{ editData ? 'Guardar Cambios' : 'Crear Registro' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

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

.label-prime { 
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.375rem;
    margin-left: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
}

.form-input-prime {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-main);
    outline: none;
    transition: all 0.2s ease-in-out;
    box-shadow: var(--shadow-sm);
}

.form-input-prime:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px var(--accent-soft);
}

.animate-prime-in {
    animation: primePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes primePop {
    from { opacity: 0; transform: scale(0.97) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: var(--accent);
}
</style>