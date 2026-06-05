<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { login, fetchPublicUsuarios, uiState, showToast } = mainStore

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const publicUsers = ref([])
const showPassword = ref(false)

onMounted(async () => {
    document.title = 'Iniciar Sesión | Sistema de Gestión de Podas'
    publicUsers.value = await fetchPublicUsuarios()
})

const selectedUserRole = computed(() => {
    const user = publicUsers.value.find(u => u.nombre === username.value)
    if (!user) return ''
    return `Ingresando como ${user.role} - ${user.cargo || 'Técnico'}`
})

const handleLogin = async () => {
    if (!username.value || !password.value) {
        error.value = 'Por favor seleccione su nombre e ingrese su contraseña'
        showToast('Por favor seleccione su nombre e ingrese su contraseña', 'error')
        return
    }
    
    loading.value = true
    error.value = ''
    
    const success = await login(username.value, password.value)
    if (success) {
        showToast('¡Sesión iniciada correctamente!', 'success')
        router.push('/')
    } else {
        error.value = 'Contraseña incorrecta. Intente de nuevo.'
        showToast('Contraseña incorrecta. Por favor intente de nuevo.', 'error')
    }
    loading.value = false
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-6">
        <div class="w-full max-w-md">
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-[2.5rem] backdrop-blur-xl border border-white/20 mb-6 shadow-2xl overflow-hidden">
                    <img v-if="uiState.logo_app" :src="uiState.logo_app" class="w-full h-full object-contain p-4" alt="Logo Institucional">
                    <span v-else class="text-4xl">🌳</span>
                </div>
                <h1 class="text-4xl font-black text-white tracking-tighter mb-2">SISTEMA DE ARBORICULTURA</h1>
                <p class="text-emerald-300 font-medium text-sm uppercase tracking-widest opacity-80">OBRAS PUBLICAS MUNICIPALES</p>
            </div>

            <!-- Card de Login -->
            <div class="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20">
                <div class="p-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-1">Bienvenido al Sistema</h2>
                    <p class="text-gray-500 text-sm mb-8">Por favor, identifíquese para continuar</p>

                    <form @submit.prevent="handleLogin" class="space-y-6" id="login-form">
                        <!-- Selector de Usuario -->
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-emerald-900 uppercase tracking-wider ml-1" for="login-username-select">Personal Autorizado</label>
                            <div class="relative group">
                                <select v-model="username" required id="login-username-select"
                                    class="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all cursor-pointer">
                                    <option value="" disabled class="text-gray-500 bg-white">-- Seleccione su Nombre --</option>
                                    <option v-for="user in publicUsers" :key="user.nombre" :value="user.nombre" class="text-gray-900 bg-white">
                                        {{ user.nombre }}
                                    </option>
                                </select>

                                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                </div>
                                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Rango (Detección Automática) -->
                        <div v-if="username" class="space-y-2 animate-fade-in">
                            <label class="block text-xs font-black text-emerald-900 uppercase tracking-wider ml-1">Rango / Nivel de Acceso</label>
                            <div class="relative">
                                <div class="w-full pl-12 pr-4 py-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-emerald-700 font-black flex items-center shadow-inner">
                                    {{ selectedUserRole }}
                                </div>
                                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Password -->
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-emerald-900 uppercase tracking-wider ml-1" for="login-password-input">Contraseña de Seguridad</label>
                            <div class="relative group">
                                <input v-model="password" :type="showPassword ? 'text' : 'password'" required placeholder="••••••••" id="login-password-input"
                                    class="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all">
                                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                </div>
                                <button type="button" @click="showPassword = !showPassword" id="login-toggle-password-btn"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
                                    :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                                    <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Botón de Entrada -->
                        <button type="submit" :disabled="loading" id="login-submit-btn"
                            class="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-2xl shadow-[0_12px_24px_-8px_rgba(16,185,129,0.5)] hover:shadow-[0_16px_32px_-12px_rgba(16,185,129,0.6)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                            <span v-if="!loading">ACCEDER AL SISTEMA</span>
                            <span v-else class="flex items-center justify-center gap-2">
                                <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                VALIDANDO...
                            </span>
                        </button>

                        <p v-if="error" class="text-center text-red-500 font-bold text-sm animate-bounce" id="login-error-msg">{{ error }}</p>
                    </form>
                </div>
            </div>

            <!-- Footer -->
            <p class="text-center text-emerald-300/50 text-xs mt-8 font-medium">
                © 2026 Gobierno Autónomo Municipal de Tarija<br>
                Desarrollado por Systemas Koffys
            </p>
        </div>
    </div>
</template>

<style scoped>
select option {
    color: #111827 !important;
    background-color: #ffffff !important;
}

.animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
