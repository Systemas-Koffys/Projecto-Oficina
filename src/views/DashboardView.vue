<template>
<div class="dashboard p-4 space-y-8 animate-fade-in" id="dashboard-content">
    <!-- Header Institucional para Impresión -->
    <div class="hidden print:flex items-center gap-6 border-b-2 border-black pb-4 mb-6">
        <div class="w-16 h-16 border border-gray-300 rounded flex items-center justify-center bg-gray-50 overflow-hidden">
            <img v-if="uiState.logo_institucional" :src="uiState.logo_institucional" class="w-full h-full object-contain" />
            <div v-else class="text-[8px] font-black text-center text-slate-400 p-1 uppercase">
                Logo <br> Municipal
            </div>
        </div>
        <div class="flex-1 text-center">
            <p class="font-black text-lg text-black">Gobierno Autónomo Municipal de Tarija</p>
            <p class="font-bold text-xs uppercase text-slate-700">Dirección de Obras Públicas Municipales</p>
            <p class="text-xs font-medium text-slate-500">Unidad de Arboricultura y Espacios Verdes</p>
        </div>
    </div>

    <!-- Header de Bienvenida -->
    <div class="welcome-card print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div class="relative z-10">
            <h2 class="welcome-title text-3xl font-black tracking-tighter">{{ saludo }}</h2>
            <p class="welcome-subtitle font-medium text-sm mt-1 uppercase tracking-widest">Resumen Operativo • Gestión de Solicitudes</p>
        </div>
        <div class="relative z-10 flex gap-4 flex-wrap">
            <!-- Filtros Temporales -->
            <div class="welcome-filters p-1 rounded-2xl flex gap-1 html2pdf__ignore">
                <button v-for="f in filtros" :key="f.id" @click="filtroActual = f.id"
                    :class="['welcome-filter-btn px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all', 
                    filtroActual === f.id ? 'active shadow-lg scale-105' : '']">
                    {{ f.label }}
                </button>
            </div>
            <!-- Exportar (Imprimir) -->
            <button @click="imprimirDashboard" class="welcome-pdf-btn px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 transition-all no-print">
                <Printer class="w-4 h-4" />
                <span class="text-xs font-black uppercase tracking-widest">Imprimir</span>
            </button>
        </div>
    </div>

    <!-- Stats Cards Remodeladas -->
    <div class="dashboard-stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="(card, i) in statCards" :key="i" 
            class="card p-6 flex flex-col gap-4 border-none shadow-xl transition-all hover:-translate-y-1 relative"
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
            <!-- Desglose Operativo Inline -->
            <div class="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 select-none tracking-wide">
                {{ card.detailText }}
            </div>
        </div>
    </div>

    <!-- Sección de Requerimientos y Alertas de Campo (Cola Activa) y Tipo de Solicitante -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Requerimientos Logísticos (Izquierda) -->
        <div class="lg:col-span-8 card p-8 border-none shadow-2xl flex flex-col justify-between">
            <div>
                <h3 class="font-black text-xl tracking-tighter mb-2 flex items-center gap-2">
                    <Wrench class="w-5 h-5 text-emerald-600" /> Requerimientos y Alertas de Campo
                </h3>
                <p class="text-xs text-muted font-bold uppercase tracking-widest mb-6">Necesidades operativas de la cola de pendientes</p>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <!-- SETAR -->
                <div class="bg-card-sec p-4 rounded-2xl border border-sec flex flex-col justify-between h-28 hover:shadow-md hover:border-orange-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <Zap class="w-5 h-5 text-amber-500 animate-pulse" />
                        <span class="text-[9px] font-black text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">SETAR</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-main tabular-nums">{{ stats.reqSetar }}</p>
                        <p class="text-[9px] font-bold text-muted uppercase tracking-tight">Cortes de Energía</p>
                    </div>
                </div>

                <!-- Grúa / Plataforma -->
                <div class="bg-card-sec p-4 rounded-2xl border border-sec flex flex-col justify-between h-28 hover:shadow-md hover:border-blue-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <Hammer class="w-5 h-5 text-blue-500" />
                        <span class="text-[9px] font-black text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Grúa</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-main tabular-nums">{{ stats.reqPlataforma }}</p>
                        <p class="text-[9px] font-bold text-muted uppercase tracking-tight">Plataformas</p>
                    </div>
                </div>

                <!-- Ficha Técnica -->
                <div class="bg-card-sec p-4 rounded-2xl border border-sec flex flex-col justify-between h-28 hover:shadow-md hover:border-indigo-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <ClipboardList class="w-5 h-5 text-indigo-500" />
                        <span class="text-[9px] font-black text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Ficha</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-main tabular-nums">{{ stats.reqFicha }}</p>
                        <p class="text-[9px] font-bold text-muted uppercase tracking-tight">Evaluaciones</p>
                    </div>
                </div>

                <!-- Árbol Seco -->
                <div class="bg-card-sec p-4 rounded-2xl border border-sec flex flex-col justify-between h-28 hover:shadow-md hover:border-amber-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <Leaf class="w-5 h-5 text-yellow-600" />
                        <span class="text-[9px] font-black text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Seco</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-main tabular-nums">{{ stats.arbolSeco }}</p>
                        <p class="text-[9px] font-bold text-muted uppercase tracking-tight">Especies Secas</p>
                    </div>
                </div>

                <!-- Segunda Nota -->
                <div class="bg-card-sec p-4 rounded-2xl border border-sec flex flex-col justify-between h-28 hover:shadow-md hover:border-purple-200 transition-all group cursor-default">
                    <div class="flex justify-between items-center">
                        <MailOpen class="w-5 h-5 text-purple-500" />
                        <span class="text-[9px] font-black text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">2ª Nota</span>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-main tabular-nums">{{ stats.segundaNota }}</p>
                        <p class="text-[9px] font-bold text-muted uppercase tracking-tight">Reiteraciones</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tipo de Solicitante (Derecha) -->
        <div class="lg:col-span-4 card p-8 border-none shadow-2xl flex flex-col justify-between">
            <div>
                <h3 class="font-black text-xl tracking-tighter mb-2 flex items-center gap-2">
                    <Users class="w-5 h-5 text-emerald-600" /> Tipo de Solicitante
                </h3>
                <p class="text-xs text-muted font-bold uppercase tracking-widest mb-6">Perfil de la demanda actual</p>
            </div>

            <!-- Ratios y Proporción -->
            <div class="space-y-6">
                <!-- Barra comparativa bicolor -->
                <div class="w-full h-4 bg-card-sec rounded-full overflow-hidden flex shadow-inner">
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
                    <div class="p-4 bg-card-sec rounded-2xl border border-sec">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
                            <span class="text-[9px] font-black text-muted uppercase tracking-wider">Particulares</span>
                        </div>
                        <p class="text-2xl font-black text-main tabular-nums">{{ stats.particulares }}</p>
                        <p class="text-[10px] font-bold text-emerald-600">{{ stats.total ? Math.round((stats.particulares / stats.total) * 100) : 0 }}%</p>
                    </div>

                    <!-- Institucional -->
                    <div class="p-4 bg-card-sec rounded-2xl border border-sec">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                            <span class="text-[9px] font-black text-muted uppercase tracking-wider">Institucionales</span>
                        </div>
                        <p class="text-2xl font-black text-main tabular-nums">{{ stats.institucionales }}</p>
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

    <!-- Fila de Distribución de Pendientes (Tres Cajas) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Pendientes por Distrito -->
        <div class="card p-8 border-none shadow-2xl flex flex-col justify-between">
            <div>
                <h3 class="font-black text-xl tracking-tighter mb-2 flex items-center gap-2">
                    <MapPin class="w-5 h-5 text-emerald-600" /> Pendientes por Distrito
                </h3>
                <p class="text-xs text-muted font-bold uppercase tracking-widest mb-6">Carga activa en territorio</p>
            </div>

            <div class="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 flex-1 mt-4">
                <div v-for="(dist, idx) in distritosPendientes" :key="idx" 
                     class="flex items-center justify-between p-3.5 bg-card-sec rounded-2xl border border-sec hover:border-accent/30 hover:bg-accent-soft transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-accent-soft text-accent rounded-xl flex items-center justify-center font-black text-xs">
                            D{{ dist.nombre.replace(/\D/g, '') || idx + 1 }}
                        </div>
                        <span class="text-xs font-black text-main uppercase tracking-wide">{{ dist.nombre }}</span>
                    </div>
                    <span class="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-black tabular-nums">
                        {{ dist.value }} pend.
                    </span>
                </div>
                
                <div v-if="distritosPendientes.length === 0" class="text-center py-12 text-muted text-xs font-bold">
                    ¡Todos los distritos al día!
                </div>
            </div>
        </div>

        <!-- Pendientes por Barrio -->
        <div class="card p-8 border-none shadow-2xl flex flex-col justify-between">
            <div>
                <h3 class="font-black text-xl tracking-tighter mb-2 flex items-center gap-2">
                    <Clock class="w-5 h-5 text-yellow-500 animate-pulse" />
                    Pendientes por Barrio
                </h3>
                <p class="text-xs text-muted font-bold uppercase tracking-widest mb-6">Puntos críticos en barrios</p>
            </div>

            <div class="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 flex-1 mt-4">
                <div v-for="(barr, idx) in barriosPendientes" :key="idx" 
                     class="flex items-center justify-between p-3.5 bg-card-sec rounded-2xl border border-sec hover:border-accent/30 hover:bg-accent-soft transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center font-black text-xs">
                            #{{ idx + 1 }}
                        </div>
                        <span class="text-xs font-black text-main uppercase tracking-wide truncate max-w-[150px]">{{ barr.nombre }}</span>
                    </div>
                    <span class="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg text-xs font-black tabular-nums">
                        {{ barr.value }} pend.
                    </span>
                </div>
                
                <div v-if="barriosPendientes.length === 0" class="text-center py-12 text-muted text-xs font-bold">
                    ¡Todos los barrios al día!
                </div>
            </div>
        </div>

        <!-- Pendientes por Tipo de Trabajo -->
        <div class="card p-8 border-none shadow-2xl flex flex-col justify-between">
            <div>
                <h3 class="font-black text-xl tracking-tighter mb-2 flex items-center gap-2">
                    <Wrench class="w-5 h-5 text-blue-600" /> Pendientes por Trabajo
                </h3>
                <p class="text-xs text-muted font-bold uppercase tracking-widest mb-6">Clasificación por tipo de acción</p>
            </div>

            <div class="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 flex-1 mt-4">
                <div v-for="(acc, idx) in accionesPendientes" :key="idx" 
                     class="flex items-center justify-between p-3.5 bg-card-sec rounded-2xl border border-sec hover:border-accent/30 hover:bg-accent-soft transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                            {{ acc.nombre[0] || 'A' }}
                        </div>
                        <span class="text-xs font-black text-main uppercase tracking-wide truncate max-w-[150px]">{{ acc.nombre }}</span>
                    </div>
                    <span class="px-3 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg text-xs font-black tabular-nums">
                        {{ acc.value }} pend.
                    </span>
                </div>
                
                <div v-if="accionesPendientes.length === 0" class="text-center py-12 text-muted text-xs font-bold">
                    ¡Cero tareas pendientes!
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup>
import { computed, onMounted, ref, watch, reactive } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState } = mainStore
import { 
    ClipboardList, CheckCircle2, Clock3, AlertTriangle, 
    TrendingUp, UserCheck, Printer,
    Wrench, Zap, Hammer, Leaf, MailOpen, Users, MapPin, Clock
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
    const baseData = store.solicitudes.filter(s => !!s.fecha_ingreso)

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
    // 1. Datos filtrados por fecha (Demanda del periodo seleccionado)
    const dataFiltrada = solicitudesFiltradas.value;
    const total = dataFiltrada.length;
    const completadas = dataFiltrada.filter(s => s.estado_tramite === 'Terminado').length;
    
    // Tipo de Solicitante (Dinámico por el periodo seleccionado)
    const institucionales = dataFiltrada.filter(s => s.id_tipo_institucion && s.id_tipo_institucion !== '').length;
    const particulares = total - institucionales;
    
    // 2. Datos globales (Backlog / Cola Activa acumulada de todo el sistema, ignora filtro de fecha)
    const pendientesGlobales = store.solicitudes.filter(s => s.estado_tramite === 'En espera' || s.estado_tramite === 'Pendiente');
    const enProceso = pendientesGlobales.length;
    
    const urgentesGlobales = pendientesGlobales.filter(s => 
        s.nivel_urgencia === 'Alta' || s.es_emergencia || s.es_urgencia || s.segunda_nota
    );
    const urgentes = urgentesGlobales.length;
    
    // Requerimientos y Alertas de Campo (de la cola de pendientes global)
    const reqSetar = pendientesGlobales.filter(s => s.requiere_setar).length;
    const reqPlataforma = pendientesGlobales.filter(s => s.requiere_plataforma).length;
    const reqFicha = pendientesGlobales.filter(s => s.requiere_ficha_tecnica).length;
    const arbolSeco = pendientesGlobales.filter(s => s.arbol_seco).length;
    const segundaNota = pendientesGlobales.filter(s => s.segunda_nota).length;

    const efectividad = total > 0 ? Math.round((completadas / total) * 100) : 0;
    
    // Desgloses de detalle para el pie de las tarjetas (Operativos, sin datos de sincronización)
    const detailTotal = `Particulares: ${particulares} • Institucionales: ${institucionales}`;
    
    const realPeriodo = dataFiltrada.filter(s => s.estado_tramite === 'Terminado');
    const instReal = realPeriodo.filter(s => s.id_tipo_institucion && s.id_tipo_institucion !== '').length;
    const partReal = realPeriodo.length - instReal;
    const detailReal = `Particulares: ${partReal} • Institucionales: ${instReal}`;

    const espAlta = pendientesGlobales.filter(s => s.nivel_urgencia === 'Alta').length;
    const espMedia = pendientesGlobales.filter(s => s.nivel_urgencia === 'Media' || s.nivel_urgencia === 'Intermedia').length;
    const espBaja = pendientesGlobales.filter(s => s.nivel_urgencia === 'Baja' || !s.nivel_urgencia).length;
    const detailEspera = `Alta: ${espAlta} • Media: ${espMedia} • Baja: ${espBaja}`;

    const critEmergencia = pendientesGlobales.filter(s => s.es_emergencia).length;
    const critUrgencia = pendientesGlobales.filter(s => s.es_urgencia).length;
    const critSegunda = pendientesGlobales.filter(s => s.segunda_nota).length;
    const detailCriticas = `Emerg: ${critEmergencia} • Urg: ${critUrgencia} • 2da Nota: ${critSegunda}`;

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
        particulares,
        detailText: {
            total: detailTotal,
            completadas: detailReal,
            enProceso: detailEspera,
            urgentes: detailCriticas
        }
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

// --- BARRIOS CON TRÁMITES PENDIENTES ---
const barriosPendientes = computed(() => {
    const counts = {}
    store.solicitudes.forEach(s => {
        if (s.estado_tramite === 'En espera') {
            const barrio = store.barrios.find(b => b.id === s.id_barrio)
            const nombre = barrio ? barrio.nombre : 'Sin Barrio'
            counts[nombre] = (counts[nombre] || 0) + 1
        }
    })
    return Object.entries(counts)
        .map(([nombre, value]) => ({ nombre, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
})

// --- ACCIONES CON TRÁMITES PENDIENTES ---
const accionesPendientes = computed(() => {
    const counts = {}
    store.solicitudes.forEach(s => {
        if (s.estado_tramite === 'En espera') {
            let accId = s.id_accion_solicitada;
            if (!accId && s.arboles && s.arboles.length > 0) {
                accId = s.arboles[0].id_accion_solicitada;
            }
            const acc = store.acciones.find(a => a.id === accId)
            const nombre = acc ? acc.nombre.split('–')[0].trim() : 'Sin Acción'
            counts[nombre] = (counts[nombre] || 0) + 1
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
    { id: 'total', label: 'Solicitudes Recibidas', value: stats.value.total, icon: ClipboardList, color: 'var(--accent)', bg: '', iconBg: 'bg-accent-soft', iconColor: 'text-accent', percent: 100, detailText: stats.value.detailText.total },
    { id: 'completadas', label: 'Solicitudes Realizadas', value: stats.value.completadas, icon: CheckCircle2, color: 'var(--accent)', bg: '', iconBg: 'bg-accent-soft', iconColor: 'text-accent', percent: stats.value.efectividad, detailText: stats.value.detailText.completadas },
    { id: 'enProceso', label: 'Solicitudes en Espera', value: stats.value.enProceso, icon: Clock3, color: '#f59e0b', bg: '', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500', percent: stats.value.total ? (stats.value.enProceso/stats.value.total)*100 : 0, detailText: stats.value.detailText.enProceso },
    { id: 'urgentes', label: 'Solicitudes Críticas', value: stats.value.urgentes, icon: AlertTriangle, color: '#ef4444', bg: '', iconBg: 'bg-red-500/10', iconColor: 'text-red-500', percent: stats.value.total ? (stats.value.urgentes/stats.value.total)*100 : 0, detailText: stats.value.detailText.urgentes }
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
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesActual = new Date().getMonth();

    // Pre-llenar meses para que el gráfico de evolución siempre muestre de Enero hasta el mes actual en orden
    if (filtroActual.value === 'todo' || filtroActual.value === 'mes') {
        for (let i = 0; i <= mesActual; i++) {
            data.evolucion[meses[i]] = 0;
        }
    }

    solicitudesFiltradas.value.forEach(s => {
        // Distritos
        const barrio = store.barrios.find(b => b.id === s.id_barrio);
        if (barrio) {
            const d = `Distrito ${barrio.id_distrito}`;
            data.distritos[d] = (data.distritos[d] || 0) + 1;
        }
        // Acciones
        let accId = s.id_accion_solicitada || s.id_accion;
        if (!accId && s.arboles && s.arboles.length > 0) {
            accId = s.arboles[0].id_accion_solicitada;
        }
        const acc = store.acciones.find(a => a.id === accId);
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
            if (filtroActual.value === 'semana' || filtroActual.value === 'hoy') {
                m = `${date.getDate()} ${meses[date.getMonth()].substring(0,3)}`;
                data.evolucion[m] = (data.evolucion[m] || 0) + 1;
            } else {
                m = meses[date.getMonth()];
                // Solo contabilizar si el mes es hasta el mes actual (ignorar fechas futuras erróneas)
                if (data.evolucion[m] !== undefined) {
                    data.evolucion[m]++;
                }
            }
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
        type: 'pie',
        data: { labels: Object.keys(raw.distritos), datasets: [{ data: Object.values(raw.distritos), backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // Bar (Acciones)
    charts.bar = new window.Chart(document.getElementById('chartBar'), {
        type: 'bar',
        data: { labels: Object.keys(raw.acciones), datasets: [{ data: Object.values(raw.acciones), backgroundColor: colors, borderRadius: { topLeft: 16, topRight: 16, bottomLeft: 0, bottomRight: 0 } }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }
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

// --- IMPRIMIR DASHBOARD ---
const imprimirDashboard = () => {
    window.print();
}
</script>

<style scoped>
@reference "tailwindcss";
.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.stat-card { @apply bg-white; }
canvas { filter: drop-shadow(0 10px 10px rgba(0,0,0,0.02)); }

.welcome-card {
    background: linear-gradient(135deg, #064e3b 0%, #047857 100%) !important;
    border: 1px solid transparent !important;
}

.welcome-title {
    color: #ffffff !important;
}

.welcome-subtitle {
    color: rgba(209, 250, 229, 0.8) !important;
}

.welcome-filters {
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.welcome-filter-btn {
    color: rgba(209, 250, 229, 0.8);
}
.welcome-filter-btn:hover {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.1);
}
.welcome-filter-btn.active {
    background-color: #ffffff;
    color: #064e3b;
}

.welcome-pdf-btn {
    background-color: var(--accent);
    color: var(--text-on-accent);
}
.welcome-pdf-btn:hover {
    background-color: var(--accent-hover);
}

/* Overrides para tema oscuro y colores */
:global(.theme-black) .welcome-card {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
}
:global(.theme-black) .welcome-title {
    color: var(--text-main) !important;
}
:global(.theme-black) .welcome-subtitle {
    color: var(--text-muted) !important;
}
:global(.theme-black) .welcome-filters {
    background-color: var(--bg-card-sec);
    border: 1px solid var(--border);
}
:global(.theme-black) .welcome-filter-btn {
    color: var(--text-muted);
}
:global(.theme-black) .welcome-filter-btn:hover {
    color: var(--text-main);
    background-color: var(--bg-card);
}
:global(.theme-black) .welcome-filter-btn.active {
    background-color: var(--accent);
    color: var(--text-on-accent);
}

:global(.theme-colors) .welcome-card {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
}
:global(.theme-colors) .welcome-title {
    color: var(--text-main) !important;
}
:global(.theme-colors) .welcome-subtitle {
    color: var(--text-muted) !important;
}
:global(.theme-colors) .welcome-filters {
    background-color: var(--bg-card-sec);
    border: 1px solid var(--border);
}
:global(.theme-colors) .welcome-filter-btn {
    color: var(--text-muted);
}
:global(.theme-colors) .welcome-filter-btn:hover {
    color: var(--text-main);
    background-color: var(--bg-card);
}
:global(.theme-colors) .welcome-filter-btn.active {
    background-color: var(--accent);
    color: var(--text-on-accent);
}

@media print {
    /* Ocultar elementos innecesarios */
    .sidebar, .header-bar, .no-print, .html2pdf__ignore, button {
        display: none !important;
    }

    /* Mostrar cabecera institucional en print */
    .print-header-layout {
        display: flex !important;
    }

    /* Ajustes generales del contenedor */
    #dashboard-content {
        padding: 0 !important;
        margin: 0 !important;
        background: white !important;
        color: black !important;
        display: block !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
    }

    /* Mantener las 4 stats cards en una fila */
    .dashboard-stats-grid {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 1rem !important;
        margin-bottom: 1.5rem !important;
    }

    .dashboard-stats-grid > .card {
        margin-bottom: 0 !important;
        padding: 1rem !important;
    }

    /* Forzar que cada card/sección no se rompa a la mitad de una página */
    .card {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        background: white !important;
        color: black !important;
        border: 1px solid #cbd5e1 !important;
        box-shadow: none !important;
        margin-bottom: 1.5rem !important;
    }

    /* Ajustar las grids para que no se amontonen o se corten */
    .grid:not(.dashboard-stats-grid) {
        display: flex !important;
        flex-direction: column !important;
        gap: 1.5rem !important;
    }
    
    .grid:not(.dashboard-stats-grid) > div {
        width: 100% !important;
    }

    /* Asegurar que los canvas de Chart.js tengan un tamaño razonable y no se corten */
    canvas {
        max-width: 100% !important;
        height: auto !important;
        max-height: 250px !important;
    }

    /* Ajustar tablas de la cola de trabajo */
    table {
        page-break-inside: avoid !important;
    }
    
    tr {
        page-break-inside: avoid !important;
    }
}
</style>