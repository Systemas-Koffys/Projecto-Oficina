<template>
    <div class="acerca-view p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        <!-- Header con Selector de 3 Temas -->
        <div class="bg-white dark-card p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h1 class="text-3xl font-black text-gray-800 dark-text">Sistema de Arboricultura</h1>
                <p class="text-gray-500 font-medium dark-text-muted">Versión 3.25 - Edición Profesional</p>
            </div>
            
            <div class="flex bg-gray-100 dark-bg p-1.5 rounded-2xl gap-1 border border-gray-200 dark-border">
                <button v-for="t in temas" :key="t.id" @click="setTheme(t.id)"
                    :class="uiState.theme === t.id ? 'bg-white dark-card text-emerald-600 shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700'"
                    class="px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                    <span>{{ t.icono }}</span> {{ t.nombre }}
                </button>
            </div>
        </div>

        <!-- Estadísticas Reales -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg flex items-center gap-4">
                <div class="text-3xl bg-white/20 p-3 rounded-2xl">📋</div>
                <div>
                    <p class="text-xs text-emerald-100 font-bold uppercase">Solicitudes</p>
                    <h3 class="text-2xl font-black">{{ store.solicitudes.length }}</h3>
                </div>
            </div>
            <div class="bg-blue-600 p-6 rounded-3xl text-white shadow-lg flex items-center gap-4">
                <div class="text-3xl bg-white/20 p-3 rounded-2xl">👷</div>
                <div>
                    <p class="text-xs text-blue-100 font-bold uppercase">Técnicos</p>
                    <h3 class="text-2xl font-black">{{ store.tecnicos.length }}</h3>
                </div>
            </div>
            <div class="bg-amber-500 p-6 rounded-3xl text-white shadow-lg flex items-center gap-4">
                <div class="text-3xl bg-white/20 p-3 rounded-2xl">🏘️</div>
                <div>
                    <p class="text-xs text-amber-100 font-bold uppercase">Barrios</p>
                    <h3 class="text-2xl font-black">{{ store.barrios.length }}</h3>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Contenido Izquierdo -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Acerca del Sistema -->
                <div class="bg-white dark-card p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 class="text-xl font-black text-gray-800 dark-text mb-4 flex items-center gap-3">
                        <span class="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-sm">ℹ️</span>
                        Acerca del Sistema
                    </h2>
                    <p class="text-gray-600 dark-text-muted leading-relaxed mb-4">
                        El <strong>Sistema de Seguimiento de Área de Arboricultura</strong> fue diseñado específicamente para digitalizar, organizar y agilizar el flujo de trabajo del equipo técnico de podas y derribos.
                    </p>
                    <p class="text-gray-600 dark-text-muted leading-relaxed">
                        Su principal objetivo es reemplazar el manejo manual en planillas de Excel, proporcionando una base de datos robusta, métricas en tiempo real y una interfaz amigable (estilo Excel) para que ingenieros, técnicos y secretaría puedan coordinar verificaciones y ejecuciones de manera eficiente, optimizando la respuesta a la ciudadanía de Tarija.
                    </p>
                </div>

                <!-- Tecnologías y Privacidad -->
                <div class="bg-white dark-card p-8 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="font-black text-gray-800 dark-text mb-4 uppercase text-xs tracking-widest">Stack Tecnológico</h3>
                        <ul class="space-y-3">
                            <li v-for="tech in techs" :key="tech.n" class="flex items-center gap-3 text-sm font-bold text-gray-600 dark-text-muted">
                                <span :class="tech.c" class="w-2 h-2 rounded-full"></span> {{ tech.n }}
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="font-black text-gray-800 dark-text mb-4 uppercase text-xs tracking-widest">Privacidad y Uso</h3>
                        <p class="text-sm text-gray-500 dark-text-muted mb-4">
                            Este software es de uso institucional exclusivo para <strong>Obras Públicas Municipales de Tarija</strong>. Los datos registrados están sujetos a confidencialidad gubernamental.
                        </p>
                        <p class="text-[10px] text-gray-400 font-bold uppercase">© 2026 Systemas Koffy's. Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>

            <!-- Columna Derecha: Desarrollador -->
            <div class="space-y-6">
                <div class="bg-white dark-card rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="bg-slate-800 h-24 flex items-center px-6">
                        <div class="w-16 h-16 bg-white rounded-2xl p-2 shadow-inner flex items-center justify-center">
                            <span class="text-2xl font-black text-slate-800">SK</span>
                        </div>
                    </div>
                    <div class="p-6">
                        <h2 class="text-xl font-black text-gray-800 dark-text">Kevin Flores Vallejos</h2>
                        <p class="text-emerald-600 font-black text-sm">Systemas Koffys</p>
                        <p class="text-gray-500 text-xs font-bold mt-1">Técnico en Sistemas / Full-Stack Developer</p>
                        
                        <div class="mt-6 pt-6 border-t border-gray-50 dark-border space-y-4">
                            <div class="flex items-center gap-4 group">
                                <div class="w-10 h-10 bg-gray-50 dark-bg rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">📞</div>
                                <a href="tel:+59169309970" class="text-sm font-bold text-gray-700 dark-text hover:text-emerald-600">+591 69309970</a>
                            </div>
                            <div class="flex items-center gap-4 group">
                                <div class="w-10 h-10 bg-gray-50 dark-bg rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">✉️</div>
                                <a href="mailto:Systemaskoffys@gmail.com" class="text-sm font-bold text-gray-700 dark-text hover:text-emerald-600 truncate">Systemaskoffys@gmail.com</a>
                            </div>
                        </div>

                        <div class="mt-8 flex gap-3">
                            <button class="flex-1 bg-slate-100 dark-bg py-3 rounded-2xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all">LINKEDIN</button>
                            <button class="flex-1 bg-slate-800 text-white py-3 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all">GITHUB</button>
                        </div>
                    </div>
                </div>

                <div class="bg-emerald-50 dark-bg p-6 rounded-3xl border border-emerald-100 dark-border">
                    <p class="text-xs font-black text-emerald-800 uppercase mb-2">Estado del Servidor</p>
                    <div class="flex items-center gap-2 text-emerald-600">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span class="text-sm font-bold">Conexión Segura MySQL activa</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { uiState, store } = mainStore

const temas = [
    { id: 'colors', nombre: 'Institucional', icono: '🎨' },
    { id: 'black', nombre: 'Oscuro', icono: '🌙' },
    { id: 'white', nombre: 'Minimalista', icono: '☀️' }
]

const techs = [
    { n: 'Frontend: Vue.js 3 + Tailwind', c: 'bg-emerald-500' },
    { n: 'Gráficos: Chart.js', c: 'bg-amber-500' },
    { n: 'Backend: Node.js + Express', c: 'bg-blue-500' },
    { n: 'Base de Datos: MySQL 8', c: 'bg-slate-700' },
    { n: 'Infraestructura: Docker', c: 'bg-sky-500' }
]

const setTheme = (id) => {
    uiState.theme = id
    localStorage.setItem('theme', id)
}
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
