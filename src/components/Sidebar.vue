<template>
    <div :class="['sidebar w-full h-auto md:h-screen flex flex-col relative z-50 shrink-0 transition-all duration-300 ease-in-out', uiState.isSidebarCollapsed ? 'md:w-20' : 'md:w-72']">
        <!-- Botón Toggle Flotante Premium de la Barra Lateral (Solo Desktop) -->
        <button 
            @click="toggleSidebar"
            class="hidden md:flex absolute top-8 -right-4 w-8 h-8 rounded-full bg-[#022c22] text-white hover:text-accent items-center justify-center border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.4)] cursor-pointer z-[60] transition-all duration-300 hover:scale-110 active:scale-95 group toggle-button-custom"
            :title="uiState.isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'"
        >
            <svg 
                class="w-4.5 h-4.5"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2.5" 
                stroke-linecap="round" 
                stroke-linejoin="round"
            >
                <!-- Borde del panel -->
                <rect x="3" y="3" width="18" height="18" rx="2" class="opacity-30 group-hover:opacity-60 transition-opacity" />
                <!-- Línea de la barra lateral -->
                <line x1="9" y1="3" x2="9" y2="21" class="opacity-40 group-hover:opacity-70 transition-opacity" />
                <!-- Flecha animada -->
                <g :class="uiState.isSidebarCollapsed ? 'arrow-container-right' : 'arrow-container-left'">
                    <path :d="uiState.isSidebarCollapsed ? 'M11 16l4-4-4-4' : 'M16 16l-4-4 4-4'" />
                </g>
            </svg>
        </button>

        <!-- Logo / Brand -->
        <div class="p-4 md:p-8 mb-0 md:mb-4 hidden md:block transition-all duration-300" :class="uiState.isSidebarCollapsed ? 'md:p-4' : 'md:p-8'">
            <div class="flex items-center" :class="uiState.isSidebarCollapsed ? 'justify-center gap-0' : 'gap-4'">
                <div class="rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-white/20 shrink-0 transition-all duration-300" :class="[uiState.logo_app ? 'bg-white p-1.5' : 'bg-accent text-on-accent p-0', uiState.isSidebarCollapsed ? 'w-12 h-12' : 'w-20 h-20']">
                    <img v-if="uiState.logo_app" :src="uiState.logo_app" class="w-full h-full object-contain">
                    <span v-else class="font-black" :class="uiState.isSidebarCollapsed ? 'text-xl' : 'text-4xl'">A</span>
                </div>
                <div v-show="!uiState.isSidebarCollapsed" class="overflow-hidden transition-all duration-300">
                    <h1 class="text-base font-black text-white leading-none whitespace-normal tracking-tight"><span class="text-emerald-400 text-xl block mb-1">ArborGest</span><span class="text-[9px] text-white/65 font-bold uppercase tracking-wider block leading-tight">Arboricultura G.A.M.T.</span></h1>
                </div>
            </div>
        </div>

        <!-- Navigation Menu -->
        <div class="flex-none md:flex-1 p-2 md:px-4 md:space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto custom-scrollbar gap-2 md:gap-0">
            <div v-for="item in filteredMenuItems" :key="item.path" 
                class="nav-item group p-3 md:p-4 rounded-2xl cursor-pointer flex items-center transition-all shrink-0"
                :class="[
                    $route.path === item.path ? 'active' : '',
                    uiState.isSidebarCollapsed ? 'md:justify-center md:p-3.5 gap-0' : 'gap-2 md:gap-4'
                ]"
                :title="uiState.isSidebarCollapsed ? item.label : ''"
                @click="$router.push(item.path)">
                <div class="nav-icon opacity-70 group-hover:opacity-100 transition-all shrink-0">
                    <component :is="item.icon" class="w-6 h-6" />
                </div>
                <span v-show="!uiState.isSidebarCollapsed" class="font-bold text-sm whitespace-nowrap overflow-hidden">{{ item.label }}</span>
            </div>

            <!-- Botón de Cerrar Sesión (Solo Mobile) -->
            <div @click="logout" 
                class="nav-item group p-3 rounded-2xl cursor-pointer flex items-center gap-2 transition-all shrink-0 md:hidden bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20">
                <div class="nav-icon opacity-70 group-hover:opacity-100 transition-all">
                    <component :is="LogOut" class="w-6 h-6" />
                </div>
                <span class="font-bold text-sm">Salir</span>
            </div>
        </div>

        <!-- User Panel (Rediseñado) -->
        <div class="mt-auto border-t border-white/10 bg-black/20 hidden md:block transition-all duration-300" :class="[ uiState.isSidebarCollapsed ? 'p-3 text-center' : 'p-4 md:p-6' ]">
            <div class="mb-4" v-show="!uiState.isSidebarCollapsed">
                <div class="flex items-center gap-3 mb-4">
                    <div class="relative shrink-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-accent to-emerald-700 text-on-accent rounded-2xl flex items-center justify-center font-black text-lg shadow-xl border border-white/20 overflow-hidden">
                            <img v-if="usuarioIdentificado?.foto" :src="usuarioIdentificado?.foto" class="w-full h-full object-cover">
                            <span v-else>{{ usuarioIdentificado?.nombre?.[0]?.toUpperCase() }}</span>
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#064e3b] rounded-full"></div>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <p class="font-black text-sm text-white truncate" :title="usuarioIdentificado?.nombre">{{ usuarioIdentificado?.nombre }}</p>
                        <p class="text-[10px] text-accent font-black uppercase tracking-widest">{{ usuarioIdentificado?.role }}</p>
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

            <!-- Mini User Panel when Collapsed -->
            <div class="flex flex-col items-center gap-4" v-show="uiState.isSidebarCollapsed">
                <div class="relative shrink-0" :title="`${usuarioIdentificado?.nombre} (${usuarioIdentificado?.role})`">
                    <div class="w-12 h-12 bg-gradient-to-br from-accent to-emerald-700 text-on-accent rounded-2xl flex items-center justify-center font-black text-lg shadow-xl border border-white/20 overflow-hidden">
                        <img v-if="usuarioIdentificado?.foto" :src="usuarioIdentificado?.foto" class="w-full h-full object-cover">
                        <span v-else>{{ usuarioIdentificado?.nombre?.[0]?.toUpperCase() }}</span>
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#064e3b] rounded-full"></div>
                </div>
                
                <button 
                    @click="logout" 
                    class="w-10 h-10 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all rounded-xl shadow-lg flex items-center justify-center"
                    title="Cerrar Sesión"
                >
                    <LogOut class="w-5 h-5" />
                </button>
            </div>
            
            <button v-show="!uiState.isSidebarCollapsed" @click="logout" class="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">
                Cerrar Sesión
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { uiState } = mainStore
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
    Map,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    Wrench,
    Sparkles
} from 'lucide-vue-next'

const router = useRouter()
const tiempoTranscurrido = ref('00:00:00')
let timer = null

const usuarioIdentificado = computed(() => {
    if (!uiState.user) return null
    const match = mainStore.store.tecnicos.find(t => t.username === uiState.user.username || t.id == uiState.user.id)
    return {
        nombre: match?.nombre || uiState.user.nombre,
        cargo: match?.cargo || uiState.user.cargo,
        foto: match?.foto || uiState.user.foto,
        role: uiState.user.role
    }
})

const toggleSidebar = () => {
    uiState.isSidebarCollapsed = !uiState.isSidebarCollapsed
    localStorage.setItem('sidebar_collapsed', uiState.isSidebarCollapsed ? 'true' : 'false')
}

const actualizarReloj = () => {
    if (!uiState.loginTime) return
    
    // El loginTime se guarda como HH:mm string. 
    // Para calcular duración real, necesitamos la fecha de login original.
    // Como simplificación usaremos el tiempo desde que cargó el componente si no hay Date real
    const storedLogin = sessionStorage.getItem('loginTimeFull') || new Date().toISOString()
    if (!sessionStorage.getItem('loginTimeFull')) sessionStorage.setItem('loginTimeFull', storedLogin)
    
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
    { path: '/inventario', label: 'Herramientas e Inventario', icon: Wrench },
    { path: '/usuarios', label: 'Usuarios', icon: ShieldCheck },
    { path: '/configuraciones', label: 'Configuraciones', icon: Settings },
    { path: '/auditoria', label: 'Caja Negra', icon: ShieldAlert },
    { path: '/ai-arboricultura', label: 'AI Arboricultura', icon: Sparkles },
    { path: '/acerca', label: 'Acerca de', icon: Info },
]

const filteredMenuItems = computed(() => {
    const role = uiState.user?.role
    return menuItems.filter(item => {
        if (role === 'USER') {
            // USER ve: Dashboard, Trámites Pendientes, Mapa, Historial, Reportes, Calendario, Acerca de, IA
            return ['/', '/solicitudes', '/mapa', '/historial', '/reportes', '/calendario', '/acerca', '/ai-arboricultura'].includes(item.path)
        } else if (role === 'ADMIN') {
            // ADMIN ve todo excepto Usuarios y Configuraciones
            return ['/', '/solicitudes', '/mapa', '/historial', '/reportes', '/calendario', '/personal', '/equipos', '/inventario', '/acerca', '/ai-arboricultura'].includes(item.path)
        }
        // ROOT ve todo
        return true
    })
})

const logout = () => {
    mainStore.logout()
    sessionStorage.removeItem('loginTimeFull')
    router.push('/')
}
</script>

<style scoped>
.nav-item {
    color: rgba(255, 255, 255, 0.5);
    transition: all 0.2s ease-in-out;
}

.nav-item:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: white;
}

/* Solo aplicar traslación si el menú está expandido */
.sidebar:not(.md\:w-20) .nav-item:hover {
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

/* ==========================================
   MICRO-ANIMACIONES EN ICONOS DE NAVEGACIÓN
   ========================================== */
.nav-item .nav-icon svg {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Dashboard - LayoutDashboard */
.nav-item:hover svg.lucide-layout-dashboard {
    transform: scale(1.15) rotate(5deg);
}

/* Solicitudes - ClipboardList */
.nav-item:hover svg.lucide-clipboard-list {
    transform: translateY(-2.5px) scale(1.05);
}

/* Mapa - Map */
.nav-item:hover svg.lucide-map {
    transform: scale(1.12) rotate(-8deg);
}

/* Historial - History */
.nav-item:hover svg.lucide-history {
    transform: rotate(-45deg) scale(1.05);
}

/* Reportes - BarChart3 */
.nav-item:hover svg.lucide-bar-chart3 {
    transform: scaleY(1.22) scaleX(1.05);
}

/* Calendario - Calendar */
.nav-item:hover svg.lucide-calendar {
    transform: translateY(-2.5px) rotate(6deg);
}

/* Personal - Users2 */
.nav-item:hover svg.lucide-users2 {
    transform: scale(1.16);
}

/* Equipos - Truck */
.nav-item:hover svg.lucide-truck {
    transform: translateX(4px) scale(1.05);
}

/* Usuarios - ShieldCheck */
.nav-item:hover svg.lucide-shield-check {
    transform: scale(1.12) rotate(-5deg);
}

/* Caja Negra - ShieldAlert */
.nav-item:hover svg.lucide-shield-alert {
    transform: scale(1.12) rotate(5deg);
}

/* Configuraciones - Settings */
.nav-item:hover svg.lucide-settings {
    transform: rotate(90deg);
}

/* Acerca de - Info */
.nav-item:hover svg.lucide-info {
    transform: scale(1.16) rotate(12deg);
}

/* Inventario - Wrench */
.nav-item:hover svg.lucide-wrench {
    transform: scale(1.12) rotate(15deg);
}

/* Salir - LogOut */
.nav-item:hover svg.lucide-log-out {
    transform: translateX(-3.5px);
}

/* ==========================================
   BOTÓN TOGGLE ANIMADO PERSONALIZADO
   ========================================== */
.toggle-button-custom {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-button-custom:hover {
    border-color: rgba(52, 211, 153, 0.4);
    box-shadow: 0 0 15px rgba(52, 211, 153, 0.3), 0 4px 15px rgba(0,0,0,0.4);
}

.arrow-container-left, .arrow-container-right {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-button-custom:hover .arrow-container-left {
    animation: arrowSlideLeft 0.8s infinite alternate ease-in-out;
}

.toggle-button-custom:hover .arrow-container-right {
    animation: arrowSlideRight 0.8s infinite alternate ease-in-out;
}

@keyframes arrowSlideLeft {
    0% { transform: translateX(0); }
    100% { transform: translateX(-3px); }
}

@keyframes arrowSlideRight {
    0% { transform: translateX(0); }
    100% { transform: translateX(3px); }
}
</style>