<template>
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-700 to-emerald-800 text-white">
                <div>
                    <h3 class="font-black text-lg">{{ userData ? 'Editar Perfil' : 'Nuevo Usuario' }}</h3>
                    <p class="text-xs text-emerald-100/70 font-bold uppercase tracking-widest">Gestión de Acceso Institucional</p>
                </div>
                <button @click="$emit('close')" class="hover:bg-white/20 p-2 rounded-xl transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-8 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
                
                <!-- Foto de Perfil de Usuario -->
                <div class="flex flex-col items-center gap-4 p-4 bg-emerald-50 rounded-[2rem] border-2 border-dashed border-emerald-100 mb-2">
                    <div class="relative group">
                        <div class="w-20 h-20 bg-white rounded-2xl border-2 border-emerald-100 overflow-hidden flex items-center justify-center shadow-md">
                            <img v-if="form.foto" :src="form.foto" class="w-full h-full object-cover">
                            <span v-else class="text-3xl">👤</span>
                        </div>
                        <label class="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all border-2 border-white">
                            📷
                            <input type="file" @change="handleFotoUpload" class="hidden" accept="image/*">
                        </label>
                    </div>
                    <div class="text-center">
                        <p class="font-black text-emerald-900 text-[10px] uppercase tracking-widest">Foto de Perfil</p>
                        <button v-if="form.foto" type="button" @click="form.foto = ''" class="text-[9px] font-black text-red-500 uppercase mt-1 hover:underline">Eliminar</button>
                    </div>
                </div>

                <!-- Vincular con Técnico -->
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Seleccionar Personal Oficial</label>
                    <select v-model="form.nombre" @change="autoUsername" required 
                        class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700">
                        <option value="" disabled>-- Seleccione de la lista de Técnicos --</option>
                        <option v-for="t in store.tecnicos" :key="t.id" :value="t.nombre">
                            {{ t.nombre }}
                        </option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <!-- Cargo -->
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cargo</label>
                        <select v-model="form.cargo" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700">
                            <option value="" disabled>Seleccione...</option>
                            <option value="Encargado del Área">Encargado del Área</option>
                            <option value="Técnico de Verificación">Técnico de Verificación</option>
                            <option value="Técnico de Personal">Técnico de Personal</option>
                            <option value="Administrativo/Secretaría">Administrativo/Secretaría</option>
                        </select>
                    </div>
                    <!-- Rol de Sistema -->
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nivel de Acceso</label>
                        <select v-model="form.role" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700">
                            <option value="ADMIN">Administrador</option>
                            <option value="ROOT">Superusuario (ROOT)</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <!-- Estado -->
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estado de Cuenta</label>
                        <select v-model="form.estado" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700">
                            <option value="Activo">Activo (Habilitado)</option>
                            <option value="Inactivo">Inactivo (Suspendido)</option>
                        </select>
                    </div>
                    <!-- Email -->
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Correo Institucional</label>
                        <input v-model="form.email" type="email" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700" placeholder="correo@tarija.bo">
                    </div>
                </div>

                <div class="pt-6 border-t border-gray-100 mt-2 space-y-4">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <p class="text-[10px] text-gray-400 uppercase font-black tracking-widest">Credenciales de Seguridad</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <!-- Username -->
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ID de Usuario (Username)</label>
                            <input v-model="form.username" type="text" :required="!userData" :readonly="!!userData"
                                class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                                :class="userData ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-700'">
                        </div>
                        <!-- Password -->
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Contraseña <span v-if="userData" class="text-emerald-500 normal-case">(Opcional)</span>
                            </label>
                            <input v-model="form.password" type="password" :required="!userData"
                                class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700"
                                :placeholder="userData ? '••••••••' : 'Crea una clave'">
                        </div>
                    </div>
                </div>

                <div class="flex gap-4 pt-4">
                    <button type="button" @click="$emit('close')" class="flex-1 px-4 py-4 rounded-2xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-all">Cancelar</button>
                    <button type="submit" class="flex-2 px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95">
                        {{ userData ? 'Guardar Cambios' : 'Crear Usuario' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { addUsuario, updateUsuario, showToast, store } = mainStore

const props = defineProps({
    userData: { type: Object, default: null }
})

const emit = defineEmits(['close'])
const form = reactive({
    nombre: '',
    cargo: '',
    role: 'ADMIN',
    email: '',
    username: '',
    password: '',
    estado: 'Activo',
    foto: ''
})

const handleFotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
        form.foto = event.target.result
    }
    reader.readAsDataURL(file)
}

const autoUsername = () => {
    if (!props.userData) {
        // Generar username sugerido basado en el nombre (puedes editarlo si quieres)
        form.username = form.nombre.toLowerCase().replace(/\s+/g, '.').replace(/[^\w.]+/g, '')
    }
}

onMounted(() => {
    if (props.userData) {
        Object.assign(form, props.userData)
        form.password = '' 
    }
})

const handleSubmit = async () => {
    let success = false
    if (props.userData?.id) {
        success = await updateUsuario(props.userData.id, { ...form })
    } else {
        success = await addUsuario({ ...form })
    }

    if (success === true) {
        showToast(props.userData ? '¡Correcto! Usuario actualizado' : '¡Correcto! Usuario registrado', 'success')
        emit('close')
    } else {
        showToast(success || 'Error al procesar la solicitud', 'error')
    }
}
</script>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
