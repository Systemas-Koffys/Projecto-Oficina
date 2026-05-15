<template>
<div class="dashboard p-4 space-y-8 animate-fade-in">
    <!-- Header de Bienvenida -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#064e3b] to-emerald-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div class="relative z-10">
            <h2 class="text-3xl font-black tracking-tighter">Resumen Operativo</h2>
            <p class="text-emerald-200/70 font-medium text-sm mt-1 uppercase tracking-widest">Gobierno Autónomo Municipal de Tarija</p>
        </div>
        <div class="relative z-10 flex gap-4">
            <div class="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center">
                <p class="text-[10px] font-black uppercase opacity-60">Tiempo Promedio</p>
                <p class="text-2xl font-black tabular-nums">{{ stats.tiempoPromedio }} <span class="text-xs opacity-50">días</span></p>
            </div>
            <div class="bg-accent text-white px-6 py-3 rounded-2xl shadow-xl text-center">
                <p class="text-[10px] font-black uppercase opacity-80">Efectividad</p>
                <p class="text-2xl font-black tabular-nums">{{ stats.porcentaje_completadas }}%</p>
            </div>
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
                    <p class="text-3xl font-black tabular-nums">{{ card.value }}</p>
                    <p class="text-[10px] font-black uppercase tracking-widest opacity-50">{{ card.label }}</p>
                </div>
            </div>
            <div class="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-1000" :style="{ width: card.percent + '%', backgroundColor: card.color }"></div>
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
                    <p class="text-xs text-muted font-bold uppercase tracking-widest">Tendencia de ingresos mensuales</p>
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

    <!-- Tabla de Pendientes con Nuevo Diseño -->
    <div class="card p-8 border-none shadow-2xl overflow-hidden bg-white">
        <div class="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
            <h3 class="font-black text-xl tracking-tighter flex items-center gap-3">
                <div class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                Cola de Trabajo Inmediata
            </h3>
            <button @click="$router.push('/solicitudes')" class="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">Ver todo</button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full">
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
                        <td class="py-5 px-4 font-black text-sm text-accent">{{ sol.comunicacion_interna }}</td>
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
        </div>
    </div>
</div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { store } from '../store/data.js'
import { 
    ClipboardList, CheckCircle2, Clock3, AlertTriangle, 
    TrendingUp, UserCheck, MapPin 
} from 'lucide-vue-next'

// --- CÁLCULO DE ESTADÍSTICAS ---
const stats = computed(() => {
    const total = store.solicitudes.length;
    const completadas = store.solicitudes.filter(s => s.estado_tramite === 'Ejecutado').length;
    const enProceso = store.solicitudes.filter(s => s.estado_tramite === 'En espera').length;
    const urgentes = store.solicitudes.filter(s => s.nivel_urgencia === 'Alta' || s.es_emergencia).length;
    
    // Cálculo de Tiempo Promedio
    let totalDias = 0;
    let countCompletados = 0;
    store.solicitudes.forEach(s => {
        if (s.fecha_ingreso && s.fecha_ejecucion && s.estado_tramite === 'Ejecutado') {
            const inicio = new Date(s.fecha_ingreso);
            const fin = new Date(s.fecha_ejecucion);
            const diff = (fin - inicio) / (1000 * 60 * 60 * 24);
            if (diff >= 0) {
                totalDias += diff;
                countCompletados++;
            }
        }
    });
    
    return {
        total,
        completadas,
        enProceso,
        urgentes,
        tiempoPromedio: countCompletados > 0 ? (totalDias / countCompletados).toFixed(1) : '---',
        porcentaje_completadas: total > 0 ? ((completadas / total) * 100).toFixed(0) : 0
    }
})

const statCards = computed(() => [
    { label: 'Total Solicitudes', value: stats.value.total, icon: ClipboardList, color: '#10b981', bg: 'bg-white', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', percent: 100 },
    { label: 'Obras Ejecutadas', value: stats.value.completadas, icon: CheckCircle2, color: '#10b981', bg: 'bg-white', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', percent: stats.value.porcentaje_completadas },
    { label: 'Trámites en Cola', value: stats.value.enProceso, icon: Clock3, color: '#f59e0b', bg: 'bg-white', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', percent: (stats.value.enProceso/stats.value.total)*100 },
    { label: 'Alertas Críticas', value: stats.value.urgentes, icon: AlertTriangle, color: '#ef4444', bg: 'bg-white', iconBg: 'bg-red-50', iconColor: 'text-red-600', percent: (stats.value.urgentes/stats.value.total)*100 }
])

const ultimasSolicitudes = computed(() => {
    return store.solicitudes
        .filter(s => s.estado_tramite === 'En espera')
        .slice(-6)
        .reverse()
})

const distritosResumen = ref([])

const getBarrioNombre = (id) => store.barrios.find(x => x.id == id)?.nombre || '---'
const getAccionNombre = (id) => store.acciones.find(x => x.id == id)?.nombre.split('–')[0].trim() || '---'

// --- GRÁFICOS ---
let charts = { pie: null, bar: null, tecs: null, evol: null };

const generarDatosGraficos = () => {
    const data = { distritos: {}, acciones: {}, tecnicos: {}, evolucion: {} };
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    store.solicitudes.forEach(s => {
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
        if (s.estado_tramite === 'Ejecutado' && s.id_tecnico_ejecucion) {
            const tec = store.tecnicos.find(t => t.id === s.id_tecnico_ejecucion);
            if (tec) data.tecnicos[tec.nombre] = (data.tecnicos[tec.nombre] || 0) + 1;
        }
        // Evolución
        if (s.fecha_ingreso) {
            const date = new Date(s.fecha_ingreso);
            const m = `${meses[date.getMonth()]} ${date.getFullYear()}`;
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

onMounted(renderCharts)
watch(() => store.solicitudes.length, renderCharts)
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.stat-card { @apply bg-white; }
canvas { filter: drop-shadow(0 10px 10px rgba(0,0,0,0.02)); }
</style>