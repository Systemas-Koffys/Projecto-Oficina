<template>
<div class="dashboard p-4 space-y-8 animate-fade-in" id="dashboard-content">
    <!-- Header de Bienvenida -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#064e3b] to-emerald-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div class="relative z-10">
            <h2 class="text-3xl font-black tracking-tighter">{{ saludo }}</h2>
            <p class="text-emerald-200/70 font-medium text-sm mt-1 uppercase tracking-widest">Resumen Operativo • Gestión de Solicitudes</p>
        </div>
        <div class="relative z-10 flex gap-4 flex-wrap">
            <!-- Filtros Temporales -->
            <div class="bg-black/20 backdrop-blur-md p-1 rounded-2xl flex gap-1 border border-white/10 html2pdf__ignore">
                <button v-for="f in filtros" :key="f.id" @click="filtroActual = f.id"
                    :class="['px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all', 
                    filtroActual === f.id ? 'bg-white text-emerald-900 shadow-lg scale-105' : 'text-emerald-100/70 hover:text-white hover:bg-white/10']">
                    {{ f.label }}
                </button>
            </div>
            <!-- Exportar -->
            <button @click="exportToPDF" class="bg-accent hover:bg-emerald-400 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 transition-all html2pdf__ignore">
                <Download class="w-4 h-4" />
                <span class="text-xs font-black uppercase tracking-widest">PDF</span>
            </button>
        </div>
    </div>

    <!-- Stats Cards Remodeladas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="(card, i) in statCards" :key="i" 
            class="card p-6 flex flex-col gap-4 border-none shadow-xl transition-all hover:-translate-y-1"
            :class="card.bg">
            <div class="flex justify-between items-start">
                <div class="p-3 rounded-2xl" :class="card.iconBg">
                    <component :is="card.icon" class="w-6 h-6" :class="card.iconColor" />
                </div>
                <div class="text-right">
                    <p class="text-3xl font-black tabular-nums">{{ animValues[card.id] }}<span v-if="card.id === 'efectividad'">%</span></p>
                    <p class="text-[10px] font-black uppercase tracking-widest opacity-50">{{ card.label }}</p>
                </div>
            </div>
            <div class="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-1000" :style="{ width: card.percent + '%', backgroundColor: card.color }"></div>
            </div>
        </div>
    </div>

    <!-- Sección de Requerimientos y Alertas de Campo (Cola Activa) y Tipo de Solicitante -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Requerimientos Logísticos (Izquierda) -->
        <div class="lg:col-span-8 card p-8 border-none shadow-2xl flex flex-col justify-between">
            <div>
                <h3 class="font-black text-xl tracking-tighter mb-2 flex items-center gap-2">
                    🛠️ Requerimientos y Alertas de Campo
                </h3>
                <p class="text-xs text-muted font-bold uppercase tracking-widest mb-6">Necesidades operativas de la cola de pendientes</p>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <!-- SETAR -->
                <div class="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 rounded-2xl border border-orange-100 flex flex-col justify-between h-28 hover:shadow-md hover:border-orange-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <span class="text-lg">⚡</span>
                        <span class="text-[9px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider">SETAR</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-gray-800 tabular-nums">{{ stats.reqSetar }}</p>
                        <p class="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Cortes de Energía</p>
                    </div>
                </div>

                <!-- Grúa / Plataforma -->
                <div class="bg-gradient-to-br from-blue-50 to-sky-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col justify-between h-28 hover:shadow-md hover:border-blue-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <span class="text-lg">🏗️</span>
                        <span class="text-[9px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Grúa</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-gray-800 tabular-nums">{{ stats.reqPlataforma }}</p>
                        <p class="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Plataformas</p>
                    </div>
                </div>

                <!-- Ficha Técnica -->
                <div class="bg-gradient-to-br from-indigo-50 to-violet-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between h-28 hover:shadow-md hover:border-indigo-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <span class="text-lg">📋</span>
                        <span class="text-[9px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Ficha</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-gray-800 tabular-nums">{{ stats.reqFicha }}</p>
                        <p class="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Evaluaciones</p>
                    </div>
                </div>

                <!-- Árbol Seco -->
                <div class="bg-gradient-to-br from-yellow-50 to-amber-50/50 p-4 rounded-2xl border border-amber-100 flex flex-col justify-between h-28 hover:shadow-md hover:border-amber-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <span class="text-lg">🌵</span>
                        <span class="text-[9px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Seco</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-gray-800 tabular-nums">{{ stats.arbolSeco }}</p>
                        <p class="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Especies Secas</p>
                    </div>
                </div>

                <!-- Segunda Nota -->
                <div class="bg-gradient-to-br from-purple-50 to-fuchsia-50/50 p-4 rounded-2xl border border-purple-100 flex flex-col justify-between h-28 hover:shadow-md hover:border-purple-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <span class="text-lg">✉️</span>
                        <span class="text-[9px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wider">2ª Nota</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-gray-800 tabular-nums">{{ stats.segundaNota }}</p>
                        <p class="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Reiteraciones</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tipo de Solicitante (Derecha) -->
        <div class="lg:col-span-4 card p-8 border-none shadow-2xl flex flex-col justify-between">
            <div>
                <h3 class="font-black text-xl tracking-tighter mb-2 flex items-center gap-2">
                    👥 Tipo de Solicitante
                </h3>
                <p class="text-xs text-muted font-bold uppercase tracking-widest mb-6">Perfil de la demanda actual</p>
            </div>

            <!-- Ratios y Proporción -->
            <div class="space-y-6">
                <!-- Barra comparativa bicolor -->
                <div class="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                    <div class="h-full bg-emerald-600 transition-all duration-1000" 
                         :style="{ width: stats.total ? (stats.particulares / stats.total) * 100 + '%' : '50%' }"
                         title="Particulares"></div>
                    <div class="h-full bg-blue-600 transition-all duration-1000" 
                         :style="{ width: stats.total ? (stats.institucionales / stats.total) * 100 + '%' : '50%' }"
                         title="Institucionales"></div>
                </div>

                <!-- Detalle con Leyenda -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- Particular -->
                    <div class="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/60">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
                            <span class="text-[9px] font-black text-gray-400 uppercase tracking-wider">Particulares</span>
                        </div>
                        <p class="text-2xl font-black text-gray-800 tabular-nums">{{ stats.particulares }}</p>
                        <p class="text-[10px] font-bold text-emerald-600">{{ stats.total ? Math.round((stats.particulares / stats.total) * 100) : 0 }}%</p>
                    </div>

                    <!-- Institucional -->
                    <div class="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/60">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                            <span class="text-[9px] font-black text-gray-400 uppercase tracking-wider">Institucionales</span>
                        </div>
                        <p class="text-2xl font-black text-gray-800 tabular-nums">{{ stats.institucionales }}</p>
                        <p class="text-[10px] font-bold text-blue-600">{{ stats.total ? Math.round((stats.institucionales / stats.total) * 100) : 0 }}%</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Evolución y Tendencias -->
        <div class="lg:col-span-8 card p-8 border-none shadow-2xl">
            <div class="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                <div>
                    <h3 class="font-black text-xl tracking-tighter">Evolución de Solicitudes</h3>
                    <p class="text-xs text-muted font-bold uppercase tracking-widest">Tendencia de ingresos</p>
                </div>
                <TrendingUp class="text-blue-500" />
            </div>
            <div class="relative h-[350px]">
                <canvas id="chartEvolucion"></canvas>
            </div>
        </div>

        <!-- Distribución por Distrito -->
        <div class="lg:col-span-4 card p-8 border-none shadow-2xl">
            <h3 class="font-black text-xl tracking-tighter mb-8 border-b border-gray-100 pb-6">Territorial</h3>
            <div class="relative h-[280px] flex justify-center">
                <canvas id="chartPie"></canvas>
            </div>
            <div class="mt-6 space-y-3">
                <div v-for="(d, idx) in distritosResumen" :key="idx" class="flex justify-between items-center text-xs">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: d.color }"></span>
                        <span class="font-bold opacity-70">{{ d.label }}</span>
                    </div>
                    <span class="font-black">{{ d.value }}</span>
                </div>
                <div v-if="distritosResumen.length === 0" class="text-center text-gray-400 text-xs font-bold py-4">No hay datos en este periodo</div>
            </div>
        </div>
    </div>

    <!-- Segunda Fila de Gráficos: Productividad -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Acciones más pedidas -->
        <div class="lg:col-span-5 card p-8 border-none shadow-2xl">
            <h3 class="font-black text-xl tracking-tighter mb-8 border-b border-gray-100 pb-6">Demanda por Acción</h3>
            <div class="relative h-[300px]">
                <canvas id="chartBar"></canvas>
            </div>
        </div>

        <!-- Productividad de Técnicos -->
        <div class="lg:col-span-7 card p-8 border-none shadow-2xl">
            <div class="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                <div>
                    <h3 class="font-black text-xl tracking-tighter">Productividad del Personal</h3>
                    <p class="text-xs text-muted font-bold uppercase tracking-widest">Trámites finalizados por técnico</p>
                </div>
                <UserCheck class="text-accent" />
            </div>
            <div class="relative h-[300px]">
                <canvas id="chartTecnicos"></canvas>
            </div>
        </div>
    </div>

    <!-- Tabla de Pendientes y Backlog por Distrito -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Tabla de Pendientes (Izquierda) -->
        <div class="lg:col-span-8 card p-8 border-none shadow-2xl overflow-hidden bg-white">
            <div class="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                <h3 class="font-black text-xl tracking-tighter flex items-center gap-3">
                    <div class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    Cola de Trabajo Inmediata
                </h3>
                <button @click="$router.push('/solicitudes')" class="text-[10px] font-black uppercase tracking-widest text-accent hover:underline html2pdf__ignore">Ver todo</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full" v-if="ultimasSolicitudes.length > 0">
                    <thead>
                        <tr class="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                            <th class="py-4 px-4 text-left">Código</th>
                            <th class="py-4 px-4 text-left">Ingreso</th>
                            <th class="py-4 px-4 text-left">Ubicación / Barrio</th>
                            <th class="py-4 px-4 text-left">Solicitud</th>
                            <th class="py-4 px-4 text-center">Prioridad</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        <tr v-for="(sol, index) in ultimasSolicitudes" :key="index" class="group hover:bg-gray-50 transition-all">
                            <td class="py-5 px-4 font-black text-sm text-accent">{{ sol.comunicacion_interna || `#${sol.id_solicitud}` }}</td>
                            <td class="py-5 px-4 text-xs font-bold text-gray-500">{{ sol.fecha_ingreso }}</td>
                            <td class="py-5 px-4">
                                <p class="text-sm font-black text-gray-800">{{ getBarrioNombre(sol.id_barrio) }}</p>
                                <p class="text-[10px] font-bold text-gray-400 truncate max-w-[200px]">{{ sol.calle }}</p>
                            </td>
                            <td class="py-5 px-4">
                                <div class="flex items-center gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
                                    <span class="text-xs font-bold text-gray-700">{{ getAccionNombre(sol.id_accion_solicitada) }}</span>
                                </div>
                            </td>
                            <td class="py-5 px-4 text-center">
                                <span :class="['px-3 py-1 rounded-full text-[9px] font-black tracking-widest', 
                                    sol.nivel_urgencia === 'Alta' || sol.es_emergencia ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500']">
                                    {{ sol.es_emergencia ? 'EMERGENCIA' : sol.nivel_urgencia }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="text-center py-12">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                        <CheckCircle2 class="w-8 h-8 text-emerald-400" />
                    </div>
                    <h4 class="text-lg font-black text-gray-800">¡Todo al día!</h4>
                    <p class="text-sm font-medium text-gray-500 mt-1">No hay solicitudes pendientes en este periodo.</p>
                </div>
            </div>
        </div>

        <!-- Backlog por Distrito (Derecha) -->
        <div class="lg:col-span-4 card p-8 border-none shadow-2xl bg-white flex flex-col justify-between">
            <div>
                <h3 class="font-black text-xl tracking-tighter mb-2 flex items-center gap-2">
                    📍 Pendientes por Distrito
                </h3>
                <p class="text-xs text-muted font-bold uppercase tracking-widest mb-6">Carga activa en territorio</p>
            </div>

            <div class="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 flex-1 mt-4">
                <div v-for="(dist, idx) in distritosPendientes" :key="idx" 
                     class="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-accent/30 hover:bg-accent/5 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-xs">
                            D{{ dist.nombre.replace(/\D/g, '') || idx + 1 }}
                        </div>
                        <span class="text-xs font-black text-gray-700 uppercase tracking-wide">{{ dist.nombre }}</span>
                    </div>
                    <span class="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-black tabular-nums">
                        {{ dist.value }} pend.
                    </span>
                </div>
                
                <div v-if="distritosPendientes.length === 0" class="text-center py-12 text-gray-400 text-xs font-bold">
                    ¡Todos los distritos al día!
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup>
import { computed, onMounted, ref, watch, reactive } from 'vue'
import { useMainStore } from '../store/mainStore.js'
import html2pdf from 'html2pdf.js'
const mainStore = useMainStore()
const { store, uiState } = mainStore
import { 
    ClipboardList, CheckCircle2, Clock3, AlertTriangle, 
    TrendingUp, UserCheck, Download 
} from 'lucide-vue-next'

// --- SALUDO DINÁMICO ---
const saludo = computed(() => {
    const hora = new Date().getHours()
    let mensaje = 'Buenas noches'
    if (hora >= 5 && hora < 12) mensaje = 'Buenos días'
    else if (hora >= 12 && hora < 19) mensaje = 'Buenas tardes'
    
    const nombreUsuario = uiState.user?.nombre?.split(' ')[0] || 'Administrador'
    return `${mensaje}, ${nombreUsuario}`
})

// --- FILTROS TEMPORALES ---
const filtros = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'todo', label: 'Histórico' }
]
const filtroActual = ref('todo')

const solicitudesFiltradas = computed(() => {
    const limitDate = new Date('2026-01-01T00:00:00')
    const baseData = store.solicitudes.filter(s => {
        if (!s.fecha_ingreso) return false
        const fecha = new Date(s.fecha_ingreso)
        return fecha >= limitDate
    })

    if (filtroActual.value === 'todo') return baseData
    
    const hoy = new Date()
    hoy.setHours(0,0,0,0)
    
    return baseData.filter(s => {
        const fecha = new Date(s.fecha_ingreso)
        
        if (filtroActual.value === 'hoy') {
            return fecha >= hoy
        } else if (filtroActual.value === 'semana') {
            const haceUnaSemana = new Date(hoy)
            haceUnaSemana.setDate(haceUnaSemana.getDate() - 7)
            return fecha >= haceUnaSemana
        } else if (filtroActual.value === 'mes') {
            return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
        }
        return true
    })
})

// --- CÁLCULO DE ESTADÍSTICAS ---
const stats = computed(() => {
    const data = solicitudesFiltradas.value;
    const total = data.length;
    const completadas = data.filter(s => s.estado_tramite === 'Terminado').length;
    const enProceso = data.filter(s => s.estado_tramite === 'En espera').length;
    const urgentes = data.filter(s => s.nivel_urgencia === 'Alta' && s.estado_tramite === 'En espera').length;
    const efectividad = total > 0 ? Math.round((completadas / total) * 100) : 0;
    
    // Alertas de Campo (Filtro por solicitudes pendientes)
    const pendientes = data.filter(s => s.estado_tramite === 'En espera');
    const reqSetar = pendientes.filter(s => s.requiere_setar).length;
    const reqPlataforma = pendientes.filter(s => s.requiere_plataforma).length;
    const reqFicha = pendientes.filter(s => s.requiere_ficha_tecnica).length;
    const arbolSeco = pendientes.filter(s => s.arbol_seco).length;
    const segundaNota = pendientes.filter(s => s.segunda_nota).length;

    // Tipos de Solicitantes (Del total filtrado)
    const institucionales = data.filter(s => s.id_tipo_institucion && s.id_tipo_institucion !== '').length;
    const particulares = total - institucionales;

    return {
        total,
        completadas,
        enProceso,
        urgentes,
        efectividad,
        reqSetar,
        reqPlataforma,
        reqFicha,
        arbolSeco,
        segundaNota,
        institucionales,
        particulares
    }
})

// --- DISTRITOS CON TRÁMITES PENDIENTES ---
const distritosPendientes = computed(() => {
    const counts = {}
    store.solicitudes.forEach(s => {
        if (s.estado_tramite === 'En espera') {
            const barrio = store.barrios.find(b => b.id === s.id_barrio)
            if (barrio) {
                const distId = barrio.id_distrito
                const d = store.distritos.find(x => x.id === distId)
                const nombre = d ? d.nombre : `Distrito ${distId}`
                counts[nombre] = (counts[nombre] || 0) + 1
            }
        }
    })
    return Object.entries(counts)
        .map(([nombre, value]) => ({ nombre, value }))
        .sort((a, b) => b.value - a.value)
})

// --- ANIMACIÓN DE NÚMEROS (CountUp) ---
const animValues = reactive({
    total: 0,
    completadas: 0,
    enProceso: 0,
    urgentes: 0,
    efectividad: 0
})

const animarNumeros = () => {
    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;

    ['total', 'completadas', 'enProceso', 'urgentes', 'efectividad'].forEach(key => {
        const target = stats.value[key];
        let current = 0;
        const increment = target / steps;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                animValues[key] = target;
                clearInterval(timer);
            } else {
                animValues[key] = Math.floor(current);
            }
        }, stepTime);
    });
}

// Observar cambios en stats para re-animar
watch(() => stats.value.total, animarNumeros, { immediate: true })

const statCards = computed(() => [
    { id: 'total', label: 'Total Solicitudes', value: stats.value.total, icon: ClipboardList, color: '#10b981', bg: 'bg-white', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', percent: 100 },
    { id: 'completadas', label: 'Solicitudes Realizadas', value: stats.value.completadas, icon: CheckCircle2, color: '#10b981', bg: 'bg-white', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', percent: stats.value.efectividad },
    { id: 'enProceso', label: 'Solicitudes en Espera', value: stats.value.enProceso, icon: Clock3, color: '#f59e0b', bg: 'bg-white', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', percent: stats.value.total ? (stats.value.enProceso/stats.value.total)*100 : 0 },
    { id: 'urgentes', label: 'Solicitudes Críticas', value: stats.value.urgentes, icon: AlertTriangle, color: '#ef4444', bg: 'bg-white', iconBg: 'bg-red-50', iconColor: 'text-red-600', percent: stats.value.total ? (stats.value.urgentes/stats.value.total)*100 : 0 }
])

const ultimasSolicitudes = computed(() => {
    return solicitudesFiltradas.value
        .filter(s => s.estado_tramite === 'En espera')
        .slice(-6)
        .reverse()
})

const distritosResumen = ref([])

const getBarrioNombre = (id) => store.barrios.find(x => x.id == id)?.nombre || '---'
const getAccionNombre = (id) => {
    const acc = store.acciones.find(x => x.id == id);
    if (!acc || !acc.nombre) return '---';
    return acc.nombre.split('–')[0].trim();
}

// --- GRÁFICOS ---
let charts = { pie: null, bar: null, tecs: null, evol: null };

const generarDatosGraficos = () => {
    const data = { distritos: {}, acciones: {}, tecnicos: {}, evolucion: {} };
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    solicitudesFiltradas.value.forEach(s => {
        // Distritos
        const barrio = store.barrios.find(b => b.id === s.id_barrio);
        if (barrio) {
            const d = `Distrito ${barrio.id_distrito}`;
            data.distritos[d] = (data.distritos[d] || 0) + 1;
        }
        // Acciones
        const acc = store.acciones.find(a => a.id === (s.id_accion_solicitada || s.id_accion));
        if (acc) {
            const n = acc.nombre.split('–')[0].trim();
            data.acciones[n] = (data.acciones[n] || 0) + 1;
        }
        // Técnicos (Solo completados)
        if (s.estado_tramite === 'Terminado' && s.id_tecnico_ejecucion) {
            const tec = store.tecnicos.find(t => t.id === s.id_tecnico_ejecucion);
            if (tec) data.tecnicos[tec.nombre] = (data.tecnicos[tec.nombre] || 0) + 1;
        }
        // Evolución
        if (s.fecha_ingreso) {
            const date = new Date(s.fecha_ingreso);
            let m;
            if (filtroActual.value === 'semana' || filtroActual.value === 'hoy' || filtroActual.value === 'mes') {
                m = `${date.getDate()} ${meses[date.getMonth()]}`;
            } else {
                m = `${meses[date.getMonth()]} ${date.getFullYear()}`;
            }
            data.evolucion[m] = (data.evolucion[m] || 0) + 1;
        }
    });

    return data;
}

const renderCharts = () => {
    if (!window.Chart) return;
    const raw = generarDatosGraficos();
    Object.values(charts).forEach(c => c?.destroy());

    const colors = ['#064e3b', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

    // Pie (Distritos)
    distritosResumen.value = Object.entries(raw.distritos).map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));
    charts.pie = new window.Chart(document.getElementById('chartPie'), {
        type: 'doughnut',
        data: { labels: Object.keys(raw.distritos), datasets: [{ data: Object.values(raw.distritos), backgroundColor: colors, borderWidth: 8, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }
    });

    // Bar (Acciones)
    charts.bar = new window.Chart(document.getElementById('chartBar'), {
        type: 'bar',
        data: { labels: Object.keys(raw.acciones), datasets: [{ data: Object.values(raw.acciones), backgroundColor: '#10b981', borderRadius: 12 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } } } }
    });

    // Bar (Técnicos)
    charts.tecs = new window.Chart(document.getElementById('chartTecnicos'), {
        type: 'bar',
        data: { labels: Object.keys(raw.tecnicos), datasets: [{ data: Object.values(raw.tecnicos), backgroundColor: '#3b82f6', borderRadius: 12 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // Line (Evolución)
    charts.evol = new window.Chart(document.getElementById('chartEvolucion'), {
        type: 'line',
        data: { 
            labels: Object.keys(raw.evolucion), 
            datasets: [{ 
                data: Object.values(raw.evolucion), 
                borderColor: '#10b981', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                fill: true, 
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#10b981',
                pointBorderWidth: 3
            }] 
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }
    });
}

onMounted(() => {
    // Re-render chart on data or filter change
    watch([() => store.solicitudes.length, filtroActual], () => {
        setTimeout(renderCharts, 100);
    }, { immediate: true })
})

// --- EXPORTAR A PDF ---
const exportToPDF = () => {
    const element = document.getElementById('dashboard-content');
    const opt = {
      margin:       0.2,
      filename:     `Dashboard_Operativo_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    mainStore.showToast('Generando PDF, por favor espere...', 'success', 3000);
    html2pdf().set(opt).from(element).save();
}
</script>

<style scoped>
@reference "tailwindcss";
.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.stat-card { @apply bg-white; }
canvas { filter: drop-shadow(0 10px 10px rgba(0,0,0,0.02)); }

/* Clases para ocultar botones al imprimir a PDF */
@media print {
    .html2pdf__ignore { display: none !important; }
}
</style>