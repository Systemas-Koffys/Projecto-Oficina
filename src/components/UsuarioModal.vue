<template>
    <Teleport to="body">
    <div class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
        <div class="bg-card-main border border-main rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden flex flex-col animate-prime-in">
            
            <!-- Header Institucional -->
            <div class="px-8 py-6 modal-header-gradient flex justify-between items-center shadow-lg border-b border-black/10 shrink-0">
                <div>
                    <h3 class="font-black text-xl tracking-tight leading-none">
                        {{ userData ? 'Editar Cuenta de Usuario' : 'Habilitar Acceso al Sistema' }}
                    </h3>
                    <p class="text-[10px] opacity-80 font-bold uppercase tracking-[0.3em] mt-2">Gestión de Credenciales Institucionales</p>
                </div>
                <button type="button" @click="$emit('close')" class="hover:bg-white/10 p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer text-[inherit]">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <form @submit.prevent="handleSubmit" class="p-8 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar bg-card-main text-main">

                <!-- SECCIÓN 01: IDENTIFICACIÓN DEL FUNCIONARIO -->
                <div class="p-6 bg-card-sec border border-main rounded-xl shadow-sm space-y-5">
                    <h4 class="text-[10px] font-black text-main uppercase tracking-[0.2em] flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> 01. Funcionario
                    </h4>

                    <!-- MODO EDICIÓN: nombre fijo, no editable -->
                    <template v-if="userData">
                        <div class="flex items-center gap-4 p-4 bg-card-main rounded-xl border border-main">
                            <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-lg border border-emerald-200 overflow-hidden">
                                <img v-if="userData.foto" :src="userData.foto" class="w-full h-full object-cover">
                                <span v-else>{{ userData.nombre?.[0] }}</span>
                            </div>
                            <div>
                                <p class="font-black text-main text-sm">{{ userData.nombre }}</p>
                                <p class="text-[10px] text-muted font-bold uppercase tracking-wide mt-0.5">{{ userData.cargo }}</p>
                            </div>
                            <span class="ml-auto text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg uppercase">Registro fijo</span>
                        </div>
                    </template>

                    <!-- MODO NUEVO: seleccionar de lista de personal -->
                    <template v-else>
                        <div class="flex flex-col">
                            <label class="label-prime">Seleccionar Funcionario <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.personalId" @change="onPersonalChange" required class="form-input-prime">
                                <option value="" disabled>-- Seleccione de la lista de personal --</option>
                                <option v-for="t in personalSinAcceso" :key="t.id" :value="t.id">
                                    {{ t.nombre }} — {{ t.cargo }}
                                </option>
                            </select>
                            <p class="text-[10px] text-muted font-bold mt-1 ml-1">Solo muestra personal sin cuenta activa.</p>
                        </div>
                        <!-- Cargo auto-rellenado (solo lectura) -->
                        <div v-if="form.cargo" class="flex flex-col">
                            <label class="label-prime">Cargo Institucional</label>
                            <div class="form-input-prime bg-card-sec text-muted cursor-not-allowed select-none border-main">{{ form.cargo }}</div>
                        </div>
                    </template>
                </div>

                <!-- SECCIÓN 02: NIVEL DE ACCESO Y ESTADO -->
                <div class="p-6 bg-card-sec border border-main rounded-xl shadow-sm space-y-5">
                    <h4 class="text-[10px] font-black text-main uppercase tracking-[0.2em] flex items-center gap-2">
                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span> 02. Perfil de Acceso
                    </h4>
                    <div class="grid grid-cols-2 gap-5">
                        <div class="flex flex-col">
                            <label class="label-prime">Nivel de Acceso <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.role" required class="form-input-prime" :disabled="userData && userData.role === 'ROOT'">
                                <option value="USER">Usuario (Acceso básico)</option>
                                <option value="ADMIN">Administrador</option>
                                <option v-if="userData && userData.role === 'ROOT'" value="ROOT">Superusuario (ROOT)</option>
                            </select>
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime">Estado de Cuenta <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.estado" required class="form-input-prime">
                                <option value="Activo">Activo (Habilitado)</option>
                                <option value="Inactivo">Inactivo (Suspendido)</option>
                            </select>
                        </div>
                        <div class="col-span-2 flex flex-col">
                            <label class="label-prime">Correo Institucional</label>
                            <input v-model="form.email" type="email" class="form-input-prime" placeholder="correo@tarija.bo">
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 03: CREDENCIALES -->
                <div class="p-6 bg-emerald-50/30 border border-emerald-100 rounded-xl shadow-sm space-y-5">
                    <h4 class="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> 03. Credenciales de Seguridad
                    </h4>

                    <!-- Nombre de usuario (siempre el nombre completo, solo lectura) -->
                    <div class="flex flex-col">
                        <label class="label-prime text-emerald-800">Nombre de Usuario
                            <span class="text-emerald-500 normal-case text-[10px] font-medium ml-1">(nombre completo del funcionario)</span>
                        </label>
                        <div class="form-input-prime bg-card-sec text-muted select-none cursor-not-allowed border-main">
                            {{ form.nombre || 'Selecciona un funcionario primero...' }}
                        </div>
                        <p class="text-[10px] text-emerald-600 font-bold mt-1 ml-1">⚡ El nombre completo es el identificador de inicio de sesión.</p>
                    </div>

                    <!-- Contraseña -->
                    <div v-if="userData" class="grid grid-cols-2 gap-5">
                        <div class="flex flex-col">
                            <label class="label-prime text-emerald-800">Nueva Contraseña
                                <span class="text-emerald-500 normal-case text-[10px] font-medium">(vacío = no cambiar)</span>
                            </label>
                            <input v-model="form.password" type="password" class="form-input-prime border-emerald-100 focus:border-emerald-500" placeholder="••••••••">
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime text-emerald-800">Confirmar Nueva Contraseña</label>
                            <input v-model="form.passwordConfirm" type="password" 
                                class="form-input-prime border-emerald-100 focus:border-emerald-500"
                                :class="{ 'border-red-400 focus:border-red-400': passwordMismatch }"
                                placeholder="••••••••">
                            <p v-if="passwordMismatch" class="text-[10px] text-red-500 font-bold mt-1 ml-1">⚠ Las contraseñas no coinciden.</p>
                        </div>
                    </div>
                    <div v-else class="grid grid-cols-2 gap-5">
                        <div class="flex flex-col">
                            <label class="label-prime text-emerald-800">Contraseña <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.password" type="password" required class="form-input-prime border-emerald-100 focus:border-emerald-500" placeholder="Crea una clave segura">
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime text-emerald-800">Confirmar Contraseña <span class="text-red-500 font-black">*</span></label>
                            <input v-model="form.passwordConfirm" type="password" required
                                class="form-input-prime border-emerald-100 focus:border-emerald-500"
                                :class="{ 'border-red-400 focus:border-red-400': passwordMismatch }"
                                placeholder="Repite la clave">
                            <p v-if="passwordMismatch" class="text-[10px] text-red-500 font-bold mt-1 ml-1">⚠ Las contraseñas no coinciden.</p>
                        </div>
                    </div>
                </div>

                <!-- Botones -->
                <div class="flex gap-4 pt-2">
                    <button type="button" @click="$emit('close')" class="flex-1 py-4 rounded-xl border-2 border-main font-black text-muted uppercase text-xs tracking-widest hover:bg-card-sec transition-all cursor-pointer">
                        Cancelar
                    </button>
                    <button type="submit" :disabled="passwordMismatch" class="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer">
                        {{ userData ? 'Guardar Cambios' : 'Habilitar Acceso' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
    </Teleport>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { addUsuario, updateUsuario, showToast, store } = mainStore

const props = defineProps({
    userData: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const form = reactive({
    personalId: '',
    nombre: '',
    cargo: '',
    role: 'USER',
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
    estado: 'Activo',
})

// Solo personal que NO tiene usuario activo (para modo "nuevo")
const personalSinAcceso = computed(() =>
    store.tecnicos.filter(t => !t.username)
)

// Cuando se selecciona un funcionario en modo nuevo
const onPersonalChange = () => {
    const p = store.tecnicos.find(t => t.id === form.personalId)
    if (p) {
        form.nombre   = p.nombre
        form.cargo    = p.cargo
        form.username = p.nombre
        form.email    = p.email || ''
        form.role     = p.role && p.role !== 'TECNICO' ? p.role : 'USER'
    }
}

// Validación de contraseñas
const passwordMismatch = computed(() => {
    if (!form.password && !form.passwordConfirm) return false
    return form.password !== form.passwordConfirm
})

onMounted(() => {
    if (props.userData) {
        form.nombre   = props.userData.nombre  || ''
        form.cargo    = props.userData.cargo   || ''
        form.role     = props.userData.role    || 'USER'
        form.email    = props.userData.email   || ''
        form.username = props.userData.username || props.userData.nombre || ''
        form.estado   = props.userData.estado  || 'Activo'
        form.password = ''
        form.passwordConfirm = ''
    }
})

const handleSubmit = async () => {
    if (passwordMismatch.value) {
        showToast('Las contraseñas no coinciden', 'error')
        return
    }

    const payload = {
        nombre:   form.nombre,
        cargo:    form.cargo,
        role:     form.role,
        email:    form.email,
        username: form.nombre,   // siempre el nombre completo
        estado:   form.estado,
    }
    // Solo incluir contraseña si se escribió algo
    if (form.password) payload.password = form.password

    let success = false
    if (props.userData?.id) {
        success = await updateUsuario(props.userData.id, payload)
    } else {
        success = await addUsuario(payload)
    }

    if (success === true) {
        showToast(props.userData ? 'Usuario actualizado correctamente' : 'Acceso habilitado correctamente', 'success')
        emit('close')
    } else {
        showToast(success || 'Error al procesar la solicitud', 'error')
    }
}
</script>

<style scoped>
@reference "tailwindcss";
.label-prime {
    @apply text-sm font-semibold mb-1.5 ml-1 flex items-center gap-1;
    color: var(--text-main);
}
.form-input-prime {
    @apply w-full px-4 py-3 rounded-xl text-sm font-bold 
           outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-sm;
    background-color: var(--input-bg) !important;
    border: 2px solid var(--border) !important;
    color: var(--text-main) !important;
}
.animate-prime-in {
    animation: primePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes primePop {
    from { opacity: 0; transform: scale(0.97) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

</style>
