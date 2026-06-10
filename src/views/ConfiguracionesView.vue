<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, addCatalogo, updateCatalogo, deleteCatalogo, showToast, updateConfig } = mainStore

import { 
    Trees, Wrench, Home, Map, Landmark, Building, Palette, Settings,
    Plus, Pencil, Trash2, X, AlertTriangle, Database, Server
} from 'lucide-vue-next'

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
        if (type === 'app') {
            uiState.logo_app = base64
            localStorage.setItem('logo_app', base64)
            await updateConfig({ logo_app: base64 })
        } else {
            uiState.logo_institucional = base64
            localStorage.setItem('logo_institucional', base64)
            await updateConfig({ logo_institucional: base64 })
        }
        showToast('Logo guardado en servidor con éxito', 'success')
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

// Datos de la tabla activa
const items = computed(() => store[categoriaActiva.value.id] || [])

const cambiarCategoria = (cat) => {
    categoriaActiva.value = cat
}

const abrirNuevo = () => {
    editData.value = null
    formData.value = {}
    if (categoriaActiva.value.campos) {
        categoriaActiva.value.campos.forEach(c => formData.value[c.key] = '')
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

    if (ok) {
        showToast('Guardado correctamente', 'success')
        showModal.value = false
    } else {
        showToast('Error al guardar', 'error')
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

// Helpers para selects
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
                                        <span class="font-black text-accent">v3.25.0</span>
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

                <!-- VISTA DE CATÁLOGOS -->
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

        <!-- MODAL DE EDICIÓN/NUEVO (TELEPORTADO Y REDISEÑADO PREMIUM) -->
        <Teleport to="body">
            <div v-if="showModal" class="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
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
                            <label class="label-prime">{{ campo.label }} <span class="text-red-500 font-black">*</span></label>
                            
                            <input v-if="campo.type === 'text'" type="text" v-model="formData[campo.key]" required
                                class="form-input-prime"
                                :placeholder="`Ingrese el ${campo.label.toLowerCase()}...`">

                            <select v-if="campo.type === 'select'" v-model="formData[campo.key]" required
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