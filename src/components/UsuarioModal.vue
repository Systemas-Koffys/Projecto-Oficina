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
                            <select v-model="form.role" required class="form-input-prime" :disabled="(userData && userData.role === 'ROOT') || (userData && userData.id === uiState.user?.id)">
                                <option value="USER">Usuario (Acceso básico)</option>
                                <option value="ADMIN">Administrador</option>
                                <option v-if="(userData && userData.role === 'ROOT') || (userData && userData.id === uiState.user?.id)" value="ROOT">Superusuario (ROOT)</option>
                            </select>
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime">Estado de Cuenta <span class="text-red-500 font-black">*</span></label>
                            <select v-model="form.estado" required class="form-input-prime" :disabled="userData && userData.id === uiState.user?.id">
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
                                    <!-- CASO A: NUEVA CUENTA (Crear) -->
                    <div v-if="!userData" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div class="flex flex-col">
                            <label class="label-prime text-emerald-800">Contraseña <span class="text-red-500 font-black">*</span></label>
                            <div class="relative flex items-center w-full">
                                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required 
                                    class="form-input-prime border-emerald-100 focus:border-emerald-500 pr-12 w-full" placeholder="Crea una clave segura">
                                <button type="button" @click="showPassword = !showPassword" 
                                    class="absolute right-4 text-muted hover:text-emerald-700 transition-colors flex items-center justify-center cursor-pointer focus:outline-none" style="background: none; border: none; padding: 0;">
                                    <Eye v-if="!showPassword" class="w-4 h-4" />
                                    <EyeOff v-else class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <label class="label-prime text-emerald-800">Confirmar Contraseña <span class="text-red-500 font-black">*</span></label>
                            <div class="relative flex items-center w-full">
                                <input v-model="form.passwordConfirm" :type="showPasswordConfirm ? 'text' : 'password'" required
                                    class="form-input-prime border-emerald-100 focus:border-emerald-500 pr-12 w-full"
                                    :class="{ 'border-red-400 focus:border-red-400': passwordMismatch }"
                                    placeholder="Repita la clave">
                                <button type="button" @click="showPasswordConfirm = !showPasswordConfirm" 
                                    class="absolute right-4 text-muted hover:text-emerald-700 transition-colors flex items-center justify-center cursor-pointer focus:outline-none" style="background: none; border: none; padding: 0;">
                                    <Eye v-if="!showPasswordConfirm" class="w-4 h-4" />
                                    <EyeOff v-else class="w-4 h-4" />
                                </button>
                            </div>
                            <p v-if="passwordMismatch" class="text-[10px] text-red-500 font-bold mt-1 ml-1">⚠ Las contraseñas no coinciden.</p>
                        </div>
                    </div>

                    <!-- CASO B: EDICIÓN DE OTRO USUARIO -->
                    <div v-else-if="userData.id !== uiState.user?.id" class="p-4 bg-white/50 border border-emerald-100 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div class="text-left">
                            <p class="text-xs font-black text-emerald-800 uppercase tracking-wide">Acceso de Seguridad Activo</p>
                            <p class="text-[10px] text-muted font-bold mt-1">
                                Las contraseñas están protegidas por Firebase. Puede enviar un correo seguro para que el usuario elija su nueva contraseña.
                            </p>
                        </div>
                        <button type="button" @click="handleResetPassword" :disabled="enviandoCorreo"
                            class="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all shrink-0 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            <span v-if="!enviandoCorreo">Restablecer por Correo</span>
                            <span v-else class="flex items-center gap-1.5">
                                <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Enviando...
                            </span>
                        </button>
                    </div>

                    <!-- CASO C: EDICIÓN DE UNO MISMO -->
                    <div v-else class="space-y-4">
                        <h5 class="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Lock class="w-4 h-4" />
                            <span>Cambiar mi Contraseña</span>
                        </h5>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div class="flex flex-col">
                                <label class="label-prime text-emerald-800">Contraseña Actual</label>
                                <div class="relative flex items-center w-full">
                                    <input v-model="passwordCurrent" :type="showPasswordCurrent ? 'text' : 'password'"
                                        class="form-input-prime border-emerald-100 focus:border-emerald-500 pr-12 w-full" placeholder="Clave actual">
                                    <button type="button" @click="showPasswordCurrent = !showPasswordCurrent" 
                                        class="absolute right-4 text-muted hover:text-emerald-700 transition-colors flex items-center justify-center cursor-pointer focus:outline-none" style="background: none; border: none; padding: 0;">
                                        <Eye v-if="!showPasswordCurrent" class="w-4 h-4" />
                                        <EyeOff v-else class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div class="flex flex-col">
                                <label class="label-prime text-emerald-800">Nueva Contraseña</label>
                                <div class="relative flex items-center w-full">
                                    <input v-model="passwordNew" :type="showPassword ? 'text' : 'password'"
                                        class="form-input-prime border-emerald-100 focus:border-emerald-500 pr-12 w-full" placeholder="Mínimo 6 caracteres">
                                    <button type="button" @click="showPassword = !showPassword" 
                                        class="absolute right-4 text-muted hover:text-emerald-700 transition-colors flex items-center justify-center cursor-pointer focus:outline-none" style="background: none; border: none; padding: 0;">
                                        <Eye v-if="!showPassword" class="w-4 h-4" />
                                        <EyeOff v-else class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div class="flex flex-col">
                                <label class="label-prime text-emerald-800">Confirmar Nueva Clave</label>
                                <div class="relative flex items-center w-full">
                                    <input v-model="passwordNewConfirm" :type="showPasswordConfirm ? 'text' : 'password'"
                                        class="form-input-prime border-emerald-100 focus:border-emerald-500 pr-12 w-full"
                                        :class="{ 'border-red-400 focus:border-red-400': passwordNewConfirm && passwordNew !== passwordNewConfirm }"
                                        placeholder="Repita la clave">
                                    <button type="button" @click="showPasswordConfirm = !showPasswordConfirm" 
                                        class="absolute right-4 text-muted hover:text-emerald-700 transition-colors flex items-center justify-center cursor-pointer focus:outline-none" style="background: none; border: none; padding: 0;">
                                        <Eye v-if="!showPasswordConfirm" class="w-4 h-4" />
                                        <EyeOff v-else class="w-4 h-4" />
                                    </button>
                                </div>
                                <p v-if="passwordNewConfirm && passwordNew !== passwordNewConfirm" class="text-[10px] text-red-500 font-bold mt-1 ml-1">⚠ Las contraseñas no coinciden.</p>
                            </div>
                        </div>
                        <p class="text-[10px] text-muted font-bold italic">Llene estos campos únicamente si desea actualizar su contraseña.</p>
                    </div>                </div>
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
import { reactive, ref, computed, onMounted } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { addUsuario, updateUsuario, restablecerPasswordPorCorreo, showToast, store, uiState } = mainStore
import { Eye, EyeOff, Lock } from 'lucide-vue-next'

const props = defineProps({
    userData: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const showPasswordCurrent = ref(false)
const passwordConfirm = ref('')
const passwordCurrent = ref('')
const passwordNew = ref('')
const passwordNewConfirm = ref('')
const enviandoCorreo = ref(false)

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

        // Reset password variables
        passwordConfirm.value = ''
        passwordCurrent.value = ''
        passwordNew.value = ''
        passwordNewConfirm.value = ''
        showPassword.value = false
        showPasswordConfirm.value = false
        showPasswordCurrent.value = false
    }
})

const handleResetPassword = async () => {
    if (!form.email) {
        showToast('El usuario debe tener un correo electrónico institucional registrado.', 'error')
        return
    }
    enviandoCorreo.value = true
    const res = await restablecerPasswordPorCorreo(form.email)
    enviandoCorreo.value = false
    if (res === true) {
        showToast(`Se envió el correo de restablecimiento a: ${form.email}`, 'success')
    } else {
        showToast(res || 'Error al enviar el correo de restablecimiento', 'error')
    }
}

const handleSubmit = async () => {
    if (!props.userData && passwordMismatch.value) {
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
    // Solo incluir contraseña si se escribió algo (crear usuario)
    if (!props.userData && form.password) {
        payload.password = form.password
    }

    // Si es su propio perfil y llenó campos de cambio de clave
    if (props.userData && props.userData.id === uiState.user?.id && passwordNew.value) {
        if (!passwordCurrent.value) {
            showToast('Debe ingresar su contraseña actual para cambiarla', 'error')
            return
        }
        if (passwordNew.value !== passwordNewConfirm.value) {
            showToast('La nueva contraseña y su confirmación no coinciden', 'error')
            return
        }
        if (passwordNew.value.length < 6) {
            showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error')
            return
        }
        
        // Cambiar contraseña propia
        const resPass = await mainStore.changeOwnPassword(passwordCurrent.value, passwordNew.value)
        if (!resPass.success) {
            showToast(resPass.error, 'error')
            return
        }
    }

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
