<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, addCatalogo, updateCatalogo, deleteCatalogo, showToast } = mainStore

// Categorías disponibles
const categorias = [
    { id: 'tecnicos', nombre: 'Técnicos', icono: '👷', campos: [{ key: 'nombre', label: 'Nombre Completo', type: 'text' }] },
    { id: 'especies', nombre: 'Especies de Árboles', icono: '🌳', campos: [{ key: 'nombre', label: 'Nombre de la Especie', type: 'text' }] },
    { id: 'acciones', nombre: 'Acciones Técnicas', icono: '🪚', campos: [{ key: 'nombre', label: 'Nombre de la Acción', type: 'text' }] },
    { id: 'barrios', nombre: 'Barrios', icono: '🏘️', campos: [
        { key: 'nombre', label: 'Nombre del Barrio', type: 'text' },
        { key: 'id_distrito', label: 'Distrito', type: 'select', options: 'distritos' }
    ]},
    { id: 'distritos', nombre: 'Distritos', icono: '🗺️', campos: [{ key: 'nombre', label: 'Nombre/Número del Distrito', type: 'text' }] },
    { id: 'instituciones', nombre: 'Instituciones', icono: '🏛️', campos: [
        { key: 'nombre', label: 'Nombre de la Institución', type: 'text' },
        { key: 'id_tipo_institucion', label: 'Tipo de Institución', type: 'select', options: 'tipos_institucion' }
    ]},
    { id: 'tipos_institucion', nombre: 'Tipos de Institución', icono: '🏢', campos: [{ key: 'nombre', label: 'Categoría', type: 'text' }] },
    { id: 'personalizacion', nombre: 'Identidad Visual', icono: '🎨', tipo: 'especial_logos' },
    { id: 'mantenimiento', nombre: 'Mantenimiento', icono: '🛠️', tipo: 'especial' },
]

const categoriaActiva = ref(categorias[0])
const showModal = ref(false)
const editData = ref(null)
const formData = ref({})

const handleBackup = () => {
    window.location.href = '/api/backup'
    showToast('Iniciando descarga del respaldo...', 'success')
}

const handleLogoUpload = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
        const base64 = event.target.result
        if (type === 'app') {
            uiState.logo_app = base64
            localStorage.setItem('logo_app', base64)
        } else {
            uiState.logo_institucional = base64
            localStorage.setItem('logo_institucional', base64)
        }
        showToast('Logo actualizado correctamente', 'success')
    }
    reader.readAsDataURL(file)
}

const removeLogo = (type) => {
    if (type === 'app') {
        uiState.logo_app = null
        localStorage.removeItem('logo_app')
    } else {
        uiState.logo_institucional = null
        localStorage.removeItem('logo_institucional')
    }
    showToast('Logo eliminado', 'success')
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

const eliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro? Esto podría afectar a las solicitudes existentes.')) return
    
    const ok = await deleteCatalogo(categoriaActiva.value.id, id)
    if (ok) showToast('Eliminado correctamente', 'success')
    else showToast('Error al eliminar', 'error')
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
            <div class="w-72 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                <button v-for="cat in categorias" :key="cat.id" 
                    @click="cambiarCategoria(cat)"
                    :class="[
                        'flex items-center gap-4 p-5 rounded-[1.5rem] font-bold transition-all border shadow-sm',
                        categoriaActiva.id === cat.id 
                            ? 'bg-accent text-white border-accent shadow-accent/20 translate-x-2' 
                            : 'bg-card text-main border-border hover:border-accent/50 hover:bg-accent/5'
                    ]"
                >
                    <span class="text-2xl">{{ cat.icono }}</span>
                    <span class="text-xs uppercase tracking-widest">{{ cat.nombre }}</span>
                </button>
            </div>

            <!-- Panel Central -->
            <div class="flex-1 bg-card rounded-[2.5rem] shadow-xl border border-border flex flex-col overflow-hidden relative">
                
                <!-- VISTA DE IDENTIDAD VISUAL (LOGOS) -->
                <div v-if="categoriaActiva.tipo === 'especial_logos'" class="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                    <div class="border-b border-border pb-6">
                        <h3 class="text-2xl font-black text-main">Identidad Visual</h3>
                        <p class="text-muted">Personaliza los logotipos que se muestran en el sistema y reportes.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <!-- Logo de la App -->
                        <div class="space-y-4">
                            <h4 class="text-sm font-black text-main uppercase tracking-widest ml-2">Logo de la Aplicación</h4>
                            <div class="bg-app p-8 rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center gap-6 relative group">
                                <div class="w-40 h-40 bg-card rounded-[2rem] shadow-2xl flex items-center justify-center overflow-hidden border border-border">
                                    <img v-if="uiState.logo_app" :src="uiState.logo_app" class="w-full h-full object-contain p-4">
                                    <span v-else class="text-5xl">🌳</span>
                                </div>
                                <div class="text-center">
                                    <p class="text-[10px] font-black text-muted uppercase tracking-widest">Uso: Sidebar y Pantalla de Login</p>
                                    <div class="flex gap-3 mt-4">
                                        <label class="px-6 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-lg shadow-accent/20">
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
                            <div class="bg-app p-8 rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center gap-6">
                                <div class="w-full h-40 bg-card rounded-[2rem] shadow-xl flex items-center justify-center overflow-hidden border border-border">
                                    <img v-if="uiState.logo_institucional" :src="uiState.logo_institucional" class="w-full h-full object-contain p-6">
                                    <div v-else class="text-center opacity-30">
                                        <p class="text-4xl mb-2">🏛️</p>
                                        <p class="text-[10px] font-black uppercase tracking-tighter">Sin Logo Institucional</p>
                                    </div>
                                </div>
                                <div class="text-center">
                                    <p class="text-[10px] font-black text-muted uppercase tracking-widest">Uso: Encabezado de Reportes Técnicos</p>
                                    <div class="flex gap-3 mt-4">
                                        <label class="px-6 py-2 bg-main/10 text-main rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-accent hover:text-white transition-all">
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
                    <div class="border-b border-border pb-6">
                        <h3 class="text-2xl font-black text-main">Mantenimiento Global</h3>
                        <p class="text-muted">Herramientas de respaldo y estado de los servicios.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-accent/5 border border-accent/20 p-8 rounded-[2rem] flex flex-col gap-6">
                            <div class="w-16 h-16 bg-accent text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-accent/30">
                                📦
                            </div>
                            <div>
                                <h4 class="text-xl font-black text-main">Copia de Seguridad</h4>
                                <p class="text-sm text-muted mt-2">Genera un respaldo completo de la base de datos MySQL en formato SQL.</p>
                            </div>
                            <button @click="handleBackup" class="w-full bg-accent hover:bg-accent-hover text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-accent/20 active:scale-95">
                                Descargar Respaldo
                            </button>
                        </div>

                        <div class="bg-card border border-border p-8 rounded-[2rem] flex flex-col gap-6">
                            <div class="w-16 h-16 bg-main/5 text-main rounded-2xl flex items-center justify-center text-3xl">
                                🛰️
                            </div>
                            <div>
                                <h4 class="text-xl font-black text-main">Estado del Servidor</h4>
                                <div class="mt-4 space-y-2">
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-muted">Versión Frontend</span>
                                        <span class="font-black text-accent">v3.5.0-LTS</span>
                                    </div>
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-muted">Base de Datos</span>
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
                    <div class="p-8 border-b border-border flex justify-between items-center bg-accent/5">
                        <div>
                            <h3 class="text-2xl font-black text-main uppercase tracking-tighter">{{ categoriaActiva.nombre }}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="w-2 h-2 bg-accent rounded-full"></span>
                                <p class="text-xs text-muted font-bold uppercase tracking-widest">{{ items.length }} Registros totales</p>
                            </div>
                        </div>
                        <button @click="abrirNuevo" class="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-xl shadow-accent/20">
                            <span class="text-lg">+</span> Nuevo Registro
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
                                <tr v-for="item in items" :key="item.id" class="group bg-app/50 hover:bg-accent/5 transition-all">
                                    <td class="px-6 py-5 text-sm font-black text-accent border-y border-l border-border rounded-l-2xl w-32">
                                        #{{ item.id }}
                                    </td>
                                    <td v-for="campo in categoriaActiva.campos" :key="campo.key" class="px-6 py-5 border-y border-border">
                                        <template v-if="campo.type === 'select'">
                                            <span class="text-xs font-black text-main bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/10">
                                                {{ getOptions(campo.options).find(o => o.id == item[campo.key])?.nombre || item[campo.key] }}
                                            </span>
                                        </template>
                                        <template v-else>
                                            <span class="text-sm font-bold text-main">{{ item[campo.key] }}</span>
                                        </template>
                                    </td>
                                    <td class="px-6 py-5 text-right border-y border-r border-border rounded-r-2xl">
                                        <div class="flex justify-end gap-3 transition-all">
                                            <button @click="abrirEdicion(item)" 
                                                class="w-10 h-10 flex items-center justify-center bg-accent/10 text-accent rounded-xl hover:bg-accent hover:text-white transition-all shadow-sm">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                            </button>
                                            <button @click="eliminar(item.id)" 
                                                class="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
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

        <!-- MODAL DE EDICIÓN/NUEVO -->
        <div v-if="showModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div class="bg-card rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-modalIn border border-white/10">
                <div class="p-10 bg-accent text-white relative">
                    <div class="relative z-10">
                        <h4 class="text-3xl font-black tracking-tighter uppercase">{{ editData ? 'Editar' : 'Nuevo' }}</h4>
                        <p class="text-xs text-white/70 uppercase font-black tracking-[0.2em] mt-1">{{ categoriaActiva.nombre }}</p>
                    </div>
                    <button @click="showModal = false" class="absolute top-8 right-8 text-white/50 hover:text-white transition-colors text-3xl font-light">&times;</button>
                </div>
                
                <div class="p-10 space-y-6">
                    <div v-for="campo in categoriaActiva.campos" :key="campo.key" class="space-y-2">
                        <label class="block text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">{{ campo.label }}</label>
                        
                        <input v-if="campo.type === 'text'" type="text" v-model="formData[campo.key]" 
                            class="w-full px-6 py-4 rounded-2xl bg-app border-2 border-border focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all font-bold text-main"
                            placeholder="Ingrese valor...">

                        <select v-if="campo.type === 'select'" v-model="formData[campo.key]"
                            class="w-full px-6 py-4 rounded-2xl bg-app border-2 border-border focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all font-bold text-main">
                            <option value="">Seleccione una opción</option>
                            <option v-for="opt in getOptions(campo.options)" :key="opt.id" :value="opt.id">{{ opt.nombre }}</option>
                        </select>
                    </div>
                </div>

                <div class="p-10 bg-app flex gap-4">
                    <button @click="showModal = false" class="flex-1 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-muted hover:bg-main/5 transition-all">Cancelar</button>
                    <button @click="guardar" class="flex-[2] bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-accent/20 active:scale-95">
                        {{ editData ? 'Guardar Cambios' : 'Crear Registro' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes modalIn {
    from { opacity: 0; transform: scale(0.9) translateY(30px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-modalIn {
    animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
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