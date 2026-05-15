<template>
    <div class="sidebar w-full md:w-72 h-auto md:h-screen flex flex-col relative z-50 shrink-0">
        <!-- Logo / Brand -->
        <div class="p-4 md:p-8 mb-0 md:mb-4 hidden md:block">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-accent text-on-accent rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-white/20">
                    <img v-if="uiState.logo_app" :src="uiState.logo_app" class="w-full h-full object-contain p-2">
                    <span v-else class="font-black text-2xl">A</span>
                </div>
                <div>
                    <h1 class="text-xl font-black text-white leading-tight">Arboricultura</h1>
                    <p class="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Municipalidad</p>
                </div>
            </div>
        </div>

        <!-- Navigation Menu -->
        <div class="flex-none md:flex-1 p-2 md:px-4 md:space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto custom-scrollbar gap-2 md:gap-0">
            <div v-for="item in menuItems" :key="item.path" 
                class="nav-item group p-3 md:p-4 rounded-2xl cursor-pointer flex items-center gap-2 md:gap-4 transition-all shrink-0"
                :class="{ 'active': $route.path === item.path }"
                @click="$router.push(item.path)">
                <div class="nav-icon opacity-70 group-hover:opacity-100 transition-all">
                    <component :is="item.icon" class="w-6 h-6" />
                </div>
                <span class="font-bold text-sm">{{ item.label }}</span>
            </div>
        </div>

        <!-- User Panel (Rediseñado) -->
        <div class="p-4 md:p-6 mt-auto border-t border-white/10 bg-black/20 hidden md:block">
            <div class="mb-4">
                <div class="flex items-center gap-3 mb-4">
                    <div class="relative">
                        <div class="w-12 h-12 bg-gradient-to-br from-accent to-emerald-700 text-on-accent rounded-2xl flex items-center justify-center font-black text-lg shadow-xl border border-white/20 overflow-hidden">
                            <img v-if="uiState.user?.foto" :src="uiState.user?.foto" class="w-full h-full object-cover">
                            <span v-else>{{ uiState.user?.nombre?.[0] }}</span>
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#064e3b] rounded-full"></div>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <p class="font-black text-sm text-white truncate">{{ uiState.user?.nombre }}</p>
                        <p class="text-[10px] text-accent font-black uppercase tracking-widest">{{ uiState.user?.role }}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                    <div class="bg-white/5 p-2 rounded-xl border border-white/5">
                        <p class="text-[8px] text-white/40 uppercase font-black mb-1 tracking-tighter">Inicio Sesión</p>
                        <p class="text-[10px] text-white font-bold">{{ uiState.loginTime || '--:--' }}</p>
                    </div>
                    <div class="bg-white/5 p-2 rounded-xl border border-white/5">
                        <p class="text-[8px] text-white/40 uppercase font-black mb-1 tracking-tighter">En Línea</p>
                        <p class="text-[10px] text-emerald-400 font-bold tabular-nums">{{ tiempoTranscurrido }}</p>
                    </div>
                </div>
            </div>

            <button @click="logout" class="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">
                Cerrar Sesión
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { uiState } from '../store/data.js'
import { useRouter } from 'vue-router'
import { 
    LayoutDashboard, 
    ClipboardList, 
    BarChart3, 
    Users2, 
    ShieldCheck, 
    Settings, 
    Info,
    Truck,
    History,
    Calendar,
    Map
} from 'lucide-vue-next'

const router = useRouter()
const tiempoTranscurrido = ref('00:00:00')
let timer = null

const actualizarReloj = () => {
    if (!uiState.loginTime) return
    
    // El loginTime se guarda como HH:mm string. 
    // Para calcular duración real, necesitamos la fecha de login original.
    // Como simplificación usaremos el tiempo desde que cargó el componente si no hay Date real
    const storedLogin = localStorage.getItem('loginTimeFull') || new Date().toISOString()
    if (!localStorage.getItem('loginTimeFull')) localStorage.setItem('loginTimeFull', storedLogin)
    
    const loginDate = new Date(storedLogin)
    const now = new Date()
    const diff = Math.floor((now - loginDate) / 1000)
    
    const h = Math.floor(diff / 3600).toString().padStart(2, '0')
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0')
    const s = (diff % 60).toString().padStart(2, '0')
    
    tiempoTranscurrido.value = `${h}:${m}:${s}`
}

onMounted(() => {
    actualizarReloj()
    timer = setInterval(actualizarReloj, 1000)
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
})

const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/solicitudes', label: 'Trámites Pendientes', icon: ClipboardList },
    { path: '/mapa', label: 'Mapa de Solicitudes', icon: Map },
    { path: '/historial', label: 'Historial de Trámites', icon: History },
    { path: '/reportes', label: 'Centro de Reportes', icon: BarChart3 },
    { path: '/calendario', label: 'Calendario', icon: Calendar },
    { path: '/personal', label: 'Personal', icon: Users2 },
    { path: '/equipos', label: 'Equipos de Trabajo', icon: Truck },
    { path: '/usuarios', label: 'Usuarios', icon: ShieldCheck },
    { path: '/configuraciones', label: 'Configuraciones', icon: Settings },
    { path: '/acerca', label: 'Acerca de', icon: Info },
]

const logout = () => {
    uiState.user = null
    uiState.loginTime = null
    localStorage.removeItem('user')
    localStorage.removeItem('loginTime')
    localStorage.removeItem('loginTimeFull')
    router.push('/login')
}
</script>

<style scoped>
.nav-item {
    color: rgba(255, 255, 255, 0.5);
}

.nav-item:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: white;
    transform: translateX(4px);
}

.nav-item.active {
    background-color: var(--accent) !important;
    color: var(--text-on-accent) !important;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.nav-item.active .nav-icon {
    opacity: 1;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

.sidebar {
    background: linear-gradient(180deg, #064e3b 0%, #022c22 100%);
    border-right: 1px solid rgba(255,255,255,0.05);
}
</style>