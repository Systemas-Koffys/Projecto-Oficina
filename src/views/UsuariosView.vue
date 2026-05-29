<script setup>
import { computed, ref } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, deleteUsuario, showToast } = mainStore
import UsuarioModal from '../components/UsuarioModal.vue'

const showModal = ref(false)
const usuarioParaEditar = ref(null)

const totalUsuarios = computed(() => store.usuarios.length)
const totalAdmins = computed(() => store.usuarios.filter(u => u.role === 'ADMIN').length)
const totalRoots = computed(() => store.usuarios.filter(u => u.role === 'ROOT').length)

const esRoot = computed(() => uiState.user?.role === 'ROOT')

const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return
    
    const success = await deleteUsuario(id)
    if (success) {
        showToast('Usuario eliminado con éxito', 'success')
    } else {
        showToast('Error al eliminar usuario', 'error')
    }
}

const openEdit = (user) => {
    usuarioParaEditar.value = { ...user }
    showModal.value = true
}

const openNew = () => {
    usuarioParaEditar.value = null
    showModal.value = true
}
</script>

<template>
<div>
    <div id="usuarios">
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">
                Gestión de Usuarios
            </h2>
            <p class="text-gray-600">
                Administra los usuarios del sistema y sus niveles de acceso
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Card Total -->
            <div class="user-stat-card border-l-4 border-blue-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Usuarios</p>
                        <p class="text-3xl font-black text-gray-800">{{ totalUsuarios }}</p>
                    </div>
                    <div class="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path></svg>
                    </div>
                </div>
            </div>

            <!-- Card Admins -->
            <div class="user-stat-card border-l-4 border-emerald-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Administradores</p>
                        <p class="text-3xl font-black text-gray-800">{{ totalAdmins }}</p>
                    </div>
                    <div class="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zm-.196 9.307a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg>
                    </div>
                </div>
            </div>

            <!-- Card Roots -->
            <div class="user-stat-card border-l-4 border-orange-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Superusuarios</p>
                        <p class="text-3xl font-black text-gray-800">{{ totalRoots }}</p>
                    </div>
                    <div class="p-3 bg-orange-50 rounded-xl text-orange-600">
                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-6 py-5 bg-gradient-to-r from-emerald-800 to-emerald-900 flex justify-between items-center">
                <div>
                    <h3 class="font-bold text-white text-lg flex items-center gap-2">
                        <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        Directorio de Usuarios
                    </h3>
                    <p class="text-emerald-100/70 text-xs">Lista oficial de personal autorizado</p>
                </div>
                <button v-if="esRoot" @click="openNew" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Registrar Nuevo
                </button>
            </div>
            
            <div class="overflow-x-auto p-2 bg-emerald-50/30">
                <table class="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                        <tr class="text-emerald-900 text-[11px] font-black uppercase tracking-widest">
                            <th class="px-6 py-3">Nombre Completo</th>
                            <th class="px-6 py-3">Cargo</th>
                            <th class="px-6 py-3">Nivel Acceso</th>
                            <th class="px-6 py-3">Correo Institucional</th>
                            <th class="px-6 py-3">Estado</th>
                            <th v-if="esRoot" class="px-6 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in store.usuarios" :key="user.id" class="bg-white hover:bg-emerald-50 transition-colors group">
                            <td class="px-6 py-4 rounded-l-xl border-y border-l border-gray-100">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm overflow-hidden">
                                        <img v-if="user.foto" :src="user.foto" class="w-full h-full object-cover">
                                        <span v-else>{{ user.nombre?.[0]?.toUpperCase() }}</span>
                                    </div>
                                    <span class="font-bold text-gray-800">{{ user.nombre }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 border-y border-gray-100 text-sm text-gray-600 font-medium">
                                {{ user.cargo }}
                            </td>
                            <td class="px-6 py-4 border-y border-gray-100">
                                <span class="text-[10px] px-3 py-1 rounded-full font-black tracking-tighter"
                                    :class="user.role === 'ROOT' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'">
                                    {{ user.role === 'ROOT' ? 'SUPERUSUARIO' : 'ADMINISTRADOR' }}
                                </span>
                            </td>
                            <td class="px-6 py-4 border-y border-gray-100 text-sm text-emerald-700 font-semibold italic">
                                {{ user.email }}
                            </td>
                            <td class="px-6 py-4 border-y border-gray-100">
                                <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all"
                                    :class="user.id === uiState.user?.id ? 'text-emerald-600 bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100'">
                                    <span class="w-1.5 h-1.5 rounded-full" :class="user.id === uiState.user?.id ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'"></span>
                                    {{ user.id === uiState.user?.id ? 'En Línea (Tú)' : 'Desconectado' }}
                                </span>
                            </td>

                            <td v-if="esRoot" class="px-6 py-4 rounded-r-xl border-y border-r border-gray-100">
                                <div class="flex items-center justify-center gap-2">
                                    <button @click="openEdit(user)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Usuario">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    </button>
                                    <button @click="handleDelete(user.id, user.nombre)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar Usuario">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <UsuarioModal v-if="showModal" :userData="usuarioParaEditar" @close="showModal = false" />
</div>
</template>

<style scoped>
.user-stat-card {
    @apply bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300;
}
</style>