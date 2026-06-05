<script setup>
import { computed, ref, reactive } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, deleteUsuario, showToast } = mainStore
import UsuarioModal from '../components/UsuarioModal.vue'

const showModal = ref(false)
const usuarioParaEditar = ref(null)
const viewUser = ref(null)

const openView = (user) => {
    viewUser.value = user
}

const totalUsuarios = computed(() => store.usuarios.length)
const totalUsers    = computed(() => store.usuarios.filter(u => u.role === 'USER').length)
const totalAdmins   = computed(() => store.usuarios.filter(u => u.role === 'ADMIN').length)
const totalRoots    = computed(() => store.usuarios.filter(u => u.role === 'ROOT').length)

const esRoot = computed(() => uiState.user?.role === 'ROOT')

// Confirmación personalizada
const confirmDialog = reactive({
    visible: false,
    nombre: '',
    id: null
})

const handleDelete = (id, nombre) => {
    confirmDialog.id = id
    confirmDialog.nombre = nombre
    confirmDialog.visible = true
}

const confirmarRevocacion = async () => {
    confirmDialog.visible = false
    const success = await deleteUsuario(confirmDialog.id)
    if (success) {
        showToast('Acceso revocado correctamente', 'success')
    } else {
        showToast('Error al revocar acceso', 'error')
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
<div class="p-6 space-y-6 animate-fade-in">

    <!-- ESTADÍSTICAS -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
        <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4 border-l-4 border-l-blue-500">
            <div class="w-12 h-12 bg-blue-100/20 text-blue-600 rounded-2xl flex items-center justify-center text-xl">🔐</div>
            <div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Usuarios</p>
                <p class="text-2xl font-black">{{ totalUsuarios }}</p>
            </div>
        </div>
        <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4 border-l-4 border-l-emerald-400">
            <div class="w-12 h-12 bg-emerald-100/20 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">👤</div>
            <div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acceso Usuario</p>
                <p class="text-2xl font-black">{{ totalUsers }}</p>
            </div>
        </div>
        <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4 border-l-4 border-l-emerald-500">
            <div class="w-12 h-12 bg-emerald-100/20 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">⚙️</div>
            <div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acceso Administrador</p>
                <p class="text-2xl font-black">{{ totalAdmins }}</p>
            </div>
        </div>
        <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4 border-l-4 border-l-purple-500">
            <div class="w-12 h-12 bg-purple-100/20 text-purple-600 rounded-2xl flex items-center justify-center text-xl">👑</div>
            <div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acceso Superusuario</p>
                <p class="text-2xl font-black">{{ totalRoots }}</p>
            </div>
        </div>
    </div>

    <!-- TABLA -->
    <div class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <!-- Header de tabla -->
        <div class="px-6 py-5 bg-gradient-to-r from-emerald-800 to-emerald-950 flex justify-between items-center">
            <div>
                <h3 class="font-black text-white text-lg flex items-center gap-2">
                    <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    Directorio de Usuarios del Sistema
                </h3>
                <p class="text-emerald-100/70 text-xs mt-1">Personal autorizado para ingresar al sistema</p>
            </div>
            <button v-if="esRoot" @click="openNew"
                class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Habilitar Acceso
            </button>
        </div>

        <div class="overflow-x-auto p-2 bg-emerald-50/30">
            <table class="w-full text-left border-separate border-spacing-y-2">
                <thead>
                    <tr class="text-emerald-900 text-[11px] font-black uppercase tracking-widest">
                        <th class="px-6 py-3">Funcionario</th>
                        <th class="px-6 py-3">Cargo</th>
                        <th class="px-6 py-3">Nivel de Acceso</th>
                        <th class="px-6 py-3">Correo</th>
                        <th class="px-6 py-3">Estado</th>
                        <th v-if="esRoot" class="px-6 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in store.usuarios" :key="user.id" class="bg-white hover:bg-emerald-50 transition-colors">
                        <!-- Nombre -->
                        <td class="px-6 py-4 rounded-l-xl border-y border-l border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm overflow-hidden">
                                    <img v-if="user.foto" :src="user.foto" class="w-full h-full object-cover">
                                    <span v-else>{{ user.nombre?.[0]?.toUpperCase() }}</span>
                                </div>
                                <span class="font-bold text-gray-800 text-sm">{{ user.nombre }}</span>
                            </div>
                        </td>
                        <!-- Cargo -->
                        <td class="px-6 py-4 border-y border-gray-100 text-sm text-gray-600 font-medium">
                            {{ user.cargo || '—' }}
                        </td>
                        <!-- Nivel -->
                        <td class="px-6 py-4 border-y border-gray-100">
                            <span class="text-[10px] px-3 py-1 rounded-full font-black tracking-tighter"
                                :class="{
                                    'bg-purple-100 text-purple-700 border border-purple-200': user.role === 'ROOT',
                                    'bg-blue-100 text-blue-700 border border-blue-200': user.role === 'ADMIN',
                                    'bg-emerald-100 text-emerald-700 border border-emerald-200': user.role === 'USER' || !user.role
                                }">
                                {{ user.role === 'ROOT' ? 'Superusuario' : user.role === 'ADMIN' ? 'Administrador' : 'Usuario' }}
                            </span>
                        </td>
                        <!-- Correo -->
                        <td class="px-6 py-4 border-y border-gray-100 text-sm text-emerald-700 font-semibold italic">
                            {{ user.email || '—' }}
                        </td>
                        <!-- Estado -->
                        <td class="px-6 py-4 border-y border-gray-100">
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all"
                                :class="user.id === uiState.user?.id
                                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200 shadow-sm'
                                    : 'text-gray-400 bg-gray-50 border-gray-100'">
                                <span class="w-1.5 h-1.5 rounded-full"
                                    :class="user.id === uiState.user?.id ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'"></span>
                                {{ user.id === uiState.user?.id ? 'En Línea (Tú)' : 'Desconectado' }}
                            </span>
                        </td>
                        <!-- Acciones -->
                        <td v-if="esRoot" class="px-6 py-4 rounded-r-xl border-y border-r border-gray-100">
                            <div class="flex items-center justify-center gap-2">
                                <button @click="openView(user)" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mirar">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </button>
                                <button @click="openEdit(user)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button @click="handleDelete(user.id, user.nombre)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revocar Acceso">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <UsuarioModal v-if="showModal" :userData="usuarioParaEditar" @close="showModal = false" />

    <!-- MODAL DE VISTA (DETALLES DE USUARIO) -->
    <Teleport to="body">
    <div v-if="viewUser" class="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
        <div class="bg-white rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden flex flex-col border border-white/20 animate-prime-in">
            
            <!-- Header Institucional -->
            <div class="px-8 py-6 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex justify-between items-center shadow-lg">
                <div>
                    <h3 class="font-black text-xl tracking-tight leading-none">Detalles de Cuenta</h3>
                    <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em] mt-2">Seguridad e Identidad</p>
                </div>
                <button type="button" @click="viewUser = null" class="hover:bg-white/20 p-2 rounded-xl transition-all">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <!-- Cuerpo de Detalles -->
            <div class="p-8 space-y-6 bg-slate-50/50">
                <!-- Foto e Info Principal -->
                <div class="flex flex-col items-center text-center space-y-4 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div class="w-24 h-24 bg-emerald-50 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-emerald-100 shadow-md">
                        <img v-if="viewUser.foto" :src="viewUser.foto" class="w-full h-full object-cover">
                        <span v-else class="text-3xl font-black text-emerald-700">{{ viewUser.nombre?.[0].toUpperCase() }}</span>
                    </div>
                    <div>
                        <h4 class="text-lg font-black text-slate-800 leading-tight">{{ viewUser.nombre }}</h4>
                        <p class="text-xs text-slate-500 font-semibold mt-1">{{ viewUser.cargo || 'Funcionario' }}</p>
                    </div>
                </div>

                <!-- Detalles de Acceso -->
                <div class="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
                    <h5 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> Credenciales de Acceso
                    </h5>
                    
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-slate-100">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Usuario</span>
                            <span class="text-xs font-bold text-slate-800">{{ viewUser.nombre }}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-slate-100">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nivel de Acceso</span>
                            <span class="text-[10px] px-3 py-1 rounded-full font-black tracking-tighter"
                                :class="{
                                    'bg-purple-100 text-purple-700 border border-purple-200': viewUser.role === 'ROOT',
                                    'bg-blue-100 text-blue-700 border border-blue-200': viewUser.role === 'ADMIN',
                                    'bg-emerald-100 text-emerald-700 border border-emerald-200': viewUser.role === 'USER' || !viewUser.role
                                }">
                                {{ viewUser.role === 'ROOT' ? 'Superusuario' : viewUser.role === 'ADMIN' ? 'Administrador' : 'Usuario' }}
                            </span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-slate-100">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Correo</span>
                            <span class="text-xs font-bold text-emerald-700 italic">{{ viewUser.email || '—' }}</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</span>
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold">
                                <span class="w-1.5 h-1.5 rounded-full"
                                    :class="viewUser.id === uiState.user?.id ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'"></span>
                                {{ viewUser.id === uiState.user?.id ? 'En Línea' : 'Desconectado' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer del Modal -->
            <div class="px-8 py-5 bg-white border-t border-slate-100 flex justify-end">
                <button type="button" @click="viewUser = null" class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs tracking-wider transition-all">
                    Cerrar Vista
                </button>
            </div>

        </div>
    </div>
    </Teleport>

    <!-- Modal de Confirmación de Revocación -->
    <Teleport to="body">
    <Transition name="fade-confirm">
    <div v-if="confirmDialog.visible" class="fixed inset-0 bg-gray-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
        <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 scale-in">
            <!-- Icono de advertencia -->
            <div class="bg-gradient-to-br from-red-500 to-red-700 p-8 flex flex-col items-center text-white">
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h3 class="font-black text-lg tracking-tight">Revocar Acceso</h3>
                <p class="text-red-100/80 text-xs font-bold uppercase tracking-widest mt-1">Acción de seguridad</p>
            </div>
            <!-- Contenido -->
            <div class="p-6 text-center space-y-3">
                <p class="text-slate-700 text-sm font-bold leading-relaxed">
                    ¿Seguro que quieres revocar el acceso de
                </p>
                <p class="font-black text-slate-900 text-base">{{ confirmDialog.nombre }}</p>
                <p class="text-slate-500 text-xs font-medium">
                    El empleado seguirá en el directorio de Personal,<br>pero no podrá iniciar sesión en el sistema.
                </p>
            </div>
            <!-- Botones -->
            <div class="px-6 pb-6 flex gap-3">
                <button
                    @click="confirmDialog.visible = false"
                    class="flex-1 py-3 rounded-xl border-2 border-slate-100 font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">
                    Cancelar
                </button>
                <button
                    @click="confirmarRevocacion"
                    class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                    Sí, Revocar
                </button>
            </div>
        </div>
    </div>
    </Transition>
    </Teleport>
</div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

.fade-confirm-enter-active, .fade-confirm-leave-active { transition: opacity 0.2s ease; }
.fade-confirm-enter-from, .fade-confirm-leave-to { opacity: 0; }
</style>