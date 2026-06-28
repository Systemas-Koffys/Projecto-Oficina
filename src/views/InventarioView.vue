<template>
    <div class="inventario-view p-6 space-y-6 text-main animate-fade-in" :class="{ 'print:hidden': printTarget !== '' }">
        
        <!-- PANELES DE ESTADÍSTICAS SUPERIORES (no-print) -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 no-print">
            <div class="bg-card-main p-6 rounded-[2rem] shadow-sm border border-main flex items-center gap-4 border-l-4 border-l-emerald-500">
                <div class="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <CheckCircle class="w-6 h-6" />
                </div>
                <div>
                    <p class="text-[10px] font-black text-muted uppercase tracking-widest">Motosierras y/o Telescópicas Habilitadas</p>
                    <p class="text-2xl font-black text-main">{{ motosierrasHabilitadasCount }}</p>
                </div>
            </div>
            
            <div class="bg-card-main p-6 rounded-[2rem] shadow-sm border border-main flex items-center gap-4 border-l-4 border-l-red-500">
                <div class="w-12 h-12 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center">
                    <AlertTriangle class="w-6 h-6" />
                </div>
                <div>
                    <p class="text-[10px] font-black text-muted uppercase tracking-widest font-black">Motosierras y/o Telescópicas con Baja Temporal</p>
                    <p class="text-2xl font-black text-main">{{ motosierrasBajaTempCount }}</p>
                </div>
            </div>

            <div class="bg-card-main p-6 rounded-[2rem] shadow-sm border border-main flex items-center gap-4 border-l-4 border-l-amber-500">
                <div class="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
                    <History class="w-6 h-6" />
                </div>
                <div>
                    <p class="text-[10px] font-black text-muted uppercase tracking-widest">Repuestos Pendientes</p>
                    <p class="text-2xl font-black text-amber-600 font-black">{{ devolucionesPendientesCount }}</p>
                </div>
            </div>

            <!-- Si no hay deudas, mostrar tarjeta vacía estándar -->
            <div v-if="deudasPorTecnico.length === 0" class="bg-card-main p-6 rounded-[2rem] shadow-sm border border-main flex items-center gap-4 border-l-4 border-l-blue-500">
                <div class="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center">
                    <User class="w-6 h-6" />
                </div>
                <div>
                    <p class="text-[10px] font-black text-muted uppercase tracking-widest">Técnicos con Deudas</p>
                    <p class="text-sm font-black text-main">Ninguno registra deudas</p>
                </div>
            </div>

            <!-- Si hay deudas, mostrar tarjeta individual dinámica para cada técnico con deudas -->
            <div v-else v-for="t in deudasPorTecnico" :key="t.id" class="bg-card-main p-6 rounded-[2rem] shadow-sm border border-main flex items-center gap-4 border-l-4 border-l-blue-500 animate-fade-in">
                <div class="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center">
                    <User class="w-6 h-6" />
                </div>
                <div>
                    <p class="text-[10px] font-black text-muted uppercase tracking-widest truncate max-w-[150px]" :title="t.cargo || 'Técnico de equipo'">
                        {{ t.cargo || 'Técnico de equipo' }}
                    </p>
                    <p class="text-sm font-black text-main truncate max-w-[150px]" :title="t.nombre">
                        {{ t.nombre }}
                    </p>
                    <p class="text-xs font-bold text-blue-600 mt-1">
                        Debe {{ t.deuda }} repuestos
                    </p>
                </div>
            </div>
        </div>

        <!-- TABS DE NAVEGACIÓN PRINCIPAL (no-print) -->
        <div class="flex border-b border-main no-print gap-4">
            <button 
                v-for="t in [
                    { id: 'stock', label: 'Stock General y Catálogo', icon: Boxes },
                    { id: 'activos', label: 'Fichas Técnicas (Activos)', icon: Wrench },
                    { id: 'entregas', label: 'Control de Cambios y Entregas', icon: ArrowRightLeft }
                ]"
                :key="t.id"
                @click="activeTab = t.id"
                :class="[
                    'px-6 py-4 font-black text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer',
                    activeTab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-main'
                ]"
            >
                <component :is="t.icon" class="w-4 h-4" />
                {{ t.label }}
            </button>
        </div>

        <!-- ========================================== -->
        <!-- TAB 1: STOCK GENERAL Y CATÁLOGO            -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'stock'" class="space-y-6">
            <div class="bg-card-main p-6 rounded-[2.5rem] shadow-sm border border-main flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div>
                    <h2 class="text-xl font-black text-main">Catálogo General de Inventario</h2>
                    <p class="text-xs text-muted font-bold mt-1">Control de consumibles, herramientas manuales y stock por ubicación</p>
                </div>
                
                <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div class="relative flex-1 md:w-64">
                        <input v-model="searchStock" type="text" placeholder="Buscar ítem..." 
                            class="w-full pl-10 pr-4 py-3 rounded-2xl bg-card-sec border border-main text-main focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-bold text-sm">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                            <Search class="w-4 h-4" />
                        </span>
                    </div>

                    <!-- Filtro por Tipo de Ítem -->
                    <div class="relative flex-1 md:w-48 font-bold text-sm">
                        <select v-model="filterStockTipo" class="w-full bg-card-sec border border-main rounded-2xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
                            <option value="">Todos los Tipos</option>
                            <option value="Activo">Activos</option>
                            <option value="Consumible">Consumibles</option>
                            <option value="Repuesto">Repuestos</option>
                        </select>
                    </div>

                    <button @click="openNewItemModal" class="px-5 py-3 bg-card-sec hover:border-accent text-accent border border-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer">
                        <Plus class="w-4 h-4" />
                        <span>Nuevo Ítem</span>
                    </button>
                    
                    <button @click="openBulkImportModal" class="px-5 py-3 bg-card-sec hover:border-accent text-main border border-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer">
                        <ArrowDownToLine class="w-4 h-4" />
                        <span>Carga Masiva</span>
                    </button>

                    <button @click="openTransferModal" class="px-5 py-3 bg-accent text-on-accent rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer">
                        <ArrowRightLeft class="w-4 h-4" />
                        <span>Traslado Stock</span>
                    </button>
                    <button @click="triggerPrintList('stock')" class="px-5 py-3 bg-card-sec hover:border-accent text-accent border border-main rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer" title="Imprimir catálogo">
                        <Printer class="w-4 h-4" />
                        <span>Imprimir Catálogo</span>
                    </button>
                </div>
            </div>

            <!-- Grilla de Inventario -->
            <div class="bg-card-main rounded-3xl shadow-sm border border-main overflow-hidden">
                <div class="overflow-x-auto p-4">
                    <!-- Título de impresión (se muestra solo al imprimir) -->
                    <div class="hidden print-only-block mb-4 text-center border-b pb-2 text-slate-900">
                        <h2 class="text-sm font-black uppercase tracking-widest text-slate-500">Gobierno Autónomo Municipal de Tarija</h2>
                        <h1 class="text-base font-black uppercase text-slate-900">Reporte de Inventario de Herramientas, Consumibles y Repuestos</h1>
                        <p class="text-[9px] font-bold text-slate-500 uppercase">Dirección de Ornato Público - Unidad de Arboricultura</p>
                    </div>

                    <table class="w-full text-left border-separate border-spacing-y-3 print-table text-main">
                        <thead>
                            <tr class="text-[10px] font-black uppercase text-muted tracking-widest">
                                <th class="px-6 py-2">Ítem de Catálogo</th>
                                <th class="px-6 py-2">Tipo</th>
                                <th class="px-6 py-2 text-center">Stock Almacén</th>
                                <th class="px-6 py-2 text-center">Stock Oficina</th>
                                <th class="px-6 py-2 text-center">En Custodia Técnico</th>
                                <th class="px-6 py-2 text-center">Stock Total</th>
                                <th class="px-6 py-2">Unidad</th>
                                <th class="px-6 py-2">Estado Stock</th>
                                <th class="px-6 py-2 text-right no-print">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="filteredStock.length === 0">
                                <td colspan="9" class="p-8 text-center text-muted font-bold">
                                    No se encontraron ítems en el catálogo con los filtros actuales.
                                </td>
                            </tr>
                            <tr v-for="item in filteredStock" :key="item.id_item" class="bg-card-sec hover:bg-accent-soft transition-all">
                                <td class="px-6 py-4 rounded-l-2xl border-y border-l border-main font-black text-sm text-main">
                                    {{ item.nombre }}
                                </td>
                                <td class="px-6 py-4 border-y border-main text-xs font-bold text-muted">
                                    <span :class="[
                                        'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider',
                                        item.tipo === 'Activo' ? 'bg-emerald-500/10 text-emerald-600' :
                                        item.tipo === 'Consumible' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'
                                    ]">{{ item.tipo }}</span>
                                </td>
                                <td class="px-6 py-4 border-y border-main text-center font-bold tabular-nums">
                                    {{ item.tipo === 'Activo' ? countActivosEnUbicacion(item.id_item, 'Almacén') : item.cantidad_almacen }}
                                </td>
                                <td class="px-6 py-4 border-y border-main text-center font-bold tabular-nums">
                                    {{ item.tipo === 'Activo' ? countActivosEnUbicacion(item.id_item, 'Oficina') : item.cantidad_oficina }}
                                </td>
                                <td class="px-6 py-4 border-y border-main text-center font-bold tabular-nums">
                                    {{ item.tipo === 'Activo' ? countActivosEnUbicacion(item.id_item, 'Técnico') : item.cantidad_tecnicos }}
                                </td>
                                <td class="px-6 py-4 border-y border-main text-center font-black tabular-nums text-accent text-sm">
                                    {{ item.tipo === 'Activo' ? countActivosEnUbicacion(item.id_item) : (item.cantidad_almacen + item.cantidad_oficina + item.cantidad_tecnicos) }}
                                </td>
                                <td class="px-6 py-4 border-y border-main text-xs font-bold text-muted">
                                    {{ item.unidad_medida }}
                                </td>
                                <td class="px-6 py-4 border-y border-main">
                                    <span v-if="item.tipo !== 'Activo' && (item.cantidad_almacen + item.cantidad_oficina + item.cantidad_tecnicos) === 0" class="badge bg-red-500/20 text-red-600 text-[9px] font-black border border-red-500/20">Agotado</span>
                                    <span v-else-if="item.tipo !== 'Activo' && (item.cantidad_almacen + item.cantidad_oficina + item.cantidad_tecnicos) < 5" class="badge bg-amber-500/20 text-amber-600 text-[9px] font-black border border-amber-500/20">Stock Bajo</span>
                                    <span v-else class="badge bg-green-500/20 text-green-600 text-[9px] font-black border border-green-500/20">Disponible</span>
                                </td>
                                <td class="px-6 py-4 rounded-r-2xl border-y border-r border-main text-right no-print">
                                    <div class="flex justify-end items-center gap-2">
                                        <button @click="openEditItem(item)" class="p-1.5 hover:bg-amber-500/10 text-amber-600 rounded-lg hover:border-amber-500/30 border border-transparent transition-all cursor-pointer" title="Editar ítem">
                                            <Pencil class="w-3.5 h-3.5" />
                                        </button>
                                        <button @click="deleteItem(item)" class="p-1.5 hover:bg-red-500/10 text-red-600 rounded-lg hover:border-red-500/30 border border-transparent transition-all cursor-pointer" title="Eliminar ítem">
                                            <Trash2 class="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 2: FICHAS TÉCNICAS (ACTIVOS)           -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'activos'" class="space-y-6">
            <div class="bg-card-main p-6 rounded-[2.5rem] shadow-sm border border-main flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div>
                    <h2 class="text-xl font-black text-main">Fichas Técnicas de Activos Codificados</h2>
                    <p class="text-xs text-muted font-bold mt-1">Hoja de vida, mantenimientos anuales, repuestos cambiados y custodios</p>
                </div>
                
                <div class="flex items-center gap-3 w-full md:w-auto">
                    <div class="relative flex-1 md:w-64">
                        <input v-model="searchActivo" type="text" placeholder="Buscar por código/chasis..." 
                            class="w-full pl-10 pr-4 py-3 rounded-2xl bg-card-sec border border-main text-main focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-bold text-sm">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                            <Search class="w-4 h-4" />
                        </span>
                    </div>

                    <button @click="openNewActivoModal" class="px-5 py-3 bg-accent text-on-accent rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer">
                        <Plus class="w-4 h-4" />
                        <span>Registrar Activo</span>
                    </button>
                </div>
            </div>

            <!-- Filtros de Activos (no-print) -->
            <div class="bg-card-main p-6 rounded-[2rem] border border-main grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
                <div class="flex flex-col">
                    <label class="text-[9px] font-black uppercase tracking-widest text-muted mb-1.5 ml-1">Filtrar por Categoría</label>
                    <select v-model="filterActivosItem" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
                        <option value="">Todas las Categorías</option>
                        <option v-for="item in store.inventarioItems.filter(i => i.tipo === 'Activo')" :key="item.id_item" :value="item.id_item">
                            {{ item.nombre }}
                        </option>
                    </select>
                </div>

                <div class="flex flex-col">
                    <label class="text-[9px] font-black uppercase tracking-widest text-muted mb-1.5 ml-1">Filtrar por Responsable (Custodio)</label>
                    <select v-model="filterActivosCustodio" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
                        <option value="">Todos los Responsables</option>
                        <option v-for="t in store.tecnicos" :key="t.id" :value="t.id">
                            {{ t.nombre }} ({{ t.cargo }})
                        </option>
                    </select>
                </div>

                <div class="flex flex-col">
                    <label class="text-[9px] font-black uppercase tracking-widest text-muted mb-1.5 ml-1">Filtrar por Ubicación</label>
                    <select v-model="filterActivosUbicacion" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
                        <option value="">Todas las Ubicaciones</option>
                        <option value="Almacén">Almacén Central</option>
                        <option value="Oficina">Oficina Técnica</option>
                        <option value="Técnico">En Cuadrilla (Técnico)</option>
                    </select>
                </div>

                <div class="flex flex-col justify-end">
                    <div class="flex gap-2">
                        <!-- Toggle de modo de vista -->
                        <div class="flex bg-card-sec border border-main rounded-xl p-1 flex-1">
                            <button @click="viewModeActivos = 'grid'" :class="['flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center', viewModeActivos === 'grid' ? 'bg-accent text-on-accent' : 'text-muted hover:text-main']">
                                Mosaico
                            </button>
                            <button @click="viewModeActivos = 'table'" :class="['flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center', viewModeActivos === 'table' ? 'bg-accent text-on-accent' : 'text-muted hover:text-main']">
                                Tabla
                            </button>
                        </div>
                        
                        <!-- Botón Imprimir Listado (solo si vista es table) -->
                        <button v-if="viewModeActivos === 'table'" @click="triggerPrintList('activos')" class="px-5 py-3 bg-card-sec hover:border-accent text-accent border border-main rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer" title="Imprimir listado filtrado">
                            <Printer class="w-4 h-4" />
                            <span>Imprimir Listado</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Grilla de Activos -->
            <div v-if="viewModeActivos === 'grid' && !selectedActivo" class="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                <div v-if="filteredActivos.length === 0" class="col-span-full bg-card-main p-12 text-center text-muted font-bold rounded-[2rem] border border-main">
                    No se encontraron activos codificados.
                </div>
                <div 
                    v-for="act in filteredActivos" 
                    :key="act.id_activo" 
                    class="bg-card-main border border-main hover:border-accent rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                    <div class="space-y-4">
                        <div class="flex justify-between items-start">
                            <span class="px-3 py-1 bg-accent-soft text-accent border border-accent/20 rounded-xl text-[9px] font-black uppercase tracking-wider">
                                {{ act.item_nombre }}
                            </span>
                            <span :class="[
                                'badge text-[9px]',
                                act.estado === 'Excelente' || act.estado === 'Bueno' ? 'badge-completed' :
                                act.estado === 'Regular' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                            ]">{{ formatEstado(act.estado) }}</span>
                        </div>
                        
                        <div>
                            <h3 class="text-lg font-black text-main group-hover:text-accent transition-colors leading-tight">{{ act.marca }} {{ act.modelo }}</h3>
                            <p class="text-[10px] text-muted font-mono font-bold mt-1">CÓD: {{ act.codigo_activo }} | CHASIS: {{ act.numero_chasis }}</p>
                        </div>

                        <div class="border-t border-main pt-3 grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p class="text-[9px] text-muted font-black uppercase tracking-widest">Ubicación</p>
                                <p class="font-bold text-main mt-0.5">{{ act.ubicacion_actual }}</p>
                            </div>
                            <div>
                                <p class="text-[9px] text-muted font-black uppercase tracking-widest">Uso</p>
                                <p class="font-bold text-main mt-0.5">{{ act.uso }}</p>
                            </div>
                            <div class="col-span-2">
                                <p class="text-[9px] text-muted font-black uppercase tracking-widest">Responsable Legal</p>
                                <p class="font-bold text-main truncate mt-0.5">{{ act.custodio_nombre || 'Sin Custodio' }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="border-t border-main mt-4 pt-4 flex gap-2">
                        <button @click="openFichaTecnica(act)" class="flex-1 px-4 py-2.5 bg-card-sec hover:bg-accent hover:text-on-accent text-main font-black text-[10px] uppercase tracking-widest border border-main hover:border-accent rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                            <Eye class="w-3.5 h-3.5" />
                            <span>Ver Ficha</span>
                        </button>
                        <button @click="openEditActivo(act)" class="px-3 py-2.5 bg-card-sec hover:bg-amber-500/10 text-amber-600 border border-main rounded-xl hover:border-amber-500/30 transition-all cursor-pointer" title="Editar características">
                            <Pencil class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabla Resumida de Activos -->
            <div v-if="viewModeActivos === 'table' && !selectedActivo" class="bg-card-main rounded-3xl shadow-sm border border-main overflow-hidden">
                <div class="overflow-x-auto p-4">
                    <!-- Título de impresión (se muestra solo al imprimir) -->
                    <div class="hidden print-only-block mb-4 text-center border-b pb-2 text-slate-900">
                        <h2 class="text-sm font-black uppercase tracking-widest text-slate-500">Gobierno Autónomo Municipal de Tarija</h2>
                        <h1 class="text-base font-black uppercase text-slate-900">Reporte Resumido de Activos Codificados</h1>
                        <p class="text-[9px] font-bold text-slate-500 uppercase">Dirección de Ornato Público - Unidad de Arboricultura</p>
                    </div>

                    <table class="w-full text-left border-separate border-spacing-y-3 print-table text-main">
                        <thead>
                            <tr class="text-[10px] font-black uppercase text-muted tracking-widest">
                                <th class="px-6 py-2">Código Activo</th>
                                <th class="px-6 py-2">Serie / Chasis</th>
                                <th class="px-6 py-2">Categoría</th>
                                <th class="px-6 py-2">Marca / Modelo</th>
                                <th class="px-6 py-2">Responsable Legal</th>
                                <th class="px-6 py-2">Operador Designado</th>
                                <th class="px-6 py-2">Ubicación</th>
                                <th class="px-6 py-2">Estado</th>
                                <th class="px-6 py-2 text-right no-print">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="filteredActivos.length === 0">
                                <td colspan="9" class="p-8 text-center text-muted font-bold">
                                    No se encontraron activos con los filtros actuales.
                                </td>
                            </tr>
                            <tr v-for="act in filteredActivos" :key="act.id_activo" class="bg-card-sec hover:bg-accent-soft transition-all align-middle text-xs">
                                <td class="px-6 py-4 rounded-l-2xl border-y border-l border-main font-black text-sm text-main font-mono">
                                    {{ act.codigo_activo }}
                                </td>
                                <td class="px-6 py-4 border-y border-main font-semibold text-muted font-mono">
                                    {{ act.numero_chasis }}
                                </td>
                                <td class="px-6 py-4 border-y border-main font-bold text-main">
                                    {{ act.item_nombre }}
                                </td>
                                <td class="px-6 py-4 border-y border-main font-bold text-main">
                                    {{ act.marca }} {{ act.modelo }}
                                </td>
                                <td class="px-6 py-4 border-y border-main font-medium text-main">
                                    {{ act.custodio_nombre || 'Sin Custodio' }}
                                </td>
                                <td class="px-6 py-4 border-y border-main font-medium text-main">
                                    {{ act.operario_nombre || 'Sin Operario' }}
                                </td>
                                <td class="px-6 py-4 border-y border-main font-bold text-main">
                                    {{ act.ubicacion_actual }}
                                </td>
                                <td class="px-6 py-4 border-y border-main">
                                    <span :class="[
                                        'badge text-[9px]',
                                        act.estado === 'Excelente' || act.estado === 'Bueno' ? 'badge-completed' :
                                        act.estado === 'Regular' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                                    ]">{{ formatEstado(act.estado) }}</span>
                                </td>
                                <td class="px-6 py-4 rounded-r-2xl border-y border-r border-main text-right no-print">
                                    <div class="flex justify-end items-center gap-2">
                                        <button @click="openFichaTecnica(act)" class="p-1.5 hover:bg-accent-soft text-accent rounded-lg border border-transparent hover:border-accent/30 transition-all cursor-pointer" title="Ver Ficha">
                                            <Eye class="w-3.5 h-3.5" />
                                        </button>
                                        <button @click="openEditActivo(act)" class="p-1.5 hover:bg-amber-500/10 text-amber-600 rounded-lg border border-transparent hover:border-amber-500/30 transition-all cursor-pointer" title="Editar Ficha">
                                            <Pencil class="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- FICHA TÉCNICA DETALLADA (FORMATO EXCEL PREMUM PARA PANTALLA E IMPRESIÓN) -->
            <div v-if="selectedActivo" class="bg-card-main border-2 border-main rounded-[2.5rem] shadow-xl p-8 relative flex flex-col space-y-8 animate-prime-in" :class="{ 'print-ficha-wrapper': isPrinting }">
                
                <!-- Controles de cabecera en pantalla (no-print) -->
                <div class="flex justify-between items-center pb-4 border-b border-main no-print">
                    <div class="flex items-center gap-2">
                        <button @click="closeFicha" class="p-2 bg-card-sec border border-main rounded-xl hover:bg-accent-soft text-muted hover:text-accent transition-all cursor-pointer">
                            <RotateCcw class="w-5 h-5" />
                        </button>
                        <h3 class="font-black text-base text-main">Visualizando Ficha Técnica</h3>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <button @click="openCustodyTransferModal(selectedActivo)" class="px-4 py-2.5 bg-card-sec hover:border-accent text-accent border border-main rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                            Transferir Custodia
                        </button>
                        
                        <button @click="openMaintenanceModal(selectedActivo)" class="px-4 py-2.5 bg-card-sec hover:border-accent text-main border border-main rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                            Registrar Mantenimiento
                        </button>

                        <button @click="triggerPrint" class="px-5 py-2.5 bg-accent text-on-accent rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer">
                            <Printer class="w-4 h-4" />
                            <span>Imprimir Ficha</span>
                        </button>
                    </div>
                </div>

                <!-- DISEÑO DE FICHA TÉCNICA (EXCEL LAYOUT) -->
                <div class="excel-ficha border-2 border-slate-900 bg-white text-slate-900 p-6 space-y-6">
                    
                    <!-- ENCABEZADO EXCEL -->
                    <div class="grid grid-cols-4 border-b-2 border-slate-900 pb-6 items-center">
                        <div class="col-span-1 flex justify-center">
                            <!-- Logo Institucional Autentico -->
                            <div class="h-24 w-28 flex items-center justify-center overflow-hidden">
                                <img v-if="uiState.logo_app" :src="uiState.logo_app" class="w-full h-full object-contain">
                                <span v-else class="text-2xl font-black text-slate-800">GAMT</span>
                            </div>
                        </div>
                        <div class="col-span-2 text-center space-y-1">
                            <h2 class="text-sm font-black tracking-widest uppercase text-slate-500">Gobierno Autónomo Municipal de Tarija</h2>
                            <h1 class="text-lg font-black uppercase text-slate-900 tracking-tight leading-tight">Ficha Técnica de Control de Activo</h1>
                            <p class="text-[10px] font-bold text-slate-500 uppercase">Dirección de Ornato Público - Unidad de Arboricultura</p>
                        </div>
                        <div class="col-span-1 text-right border-l border-slate-300 pl-4">
                            <p class="text-[9px] font-black text-slate-500 uppercase">Código de Activo</p>
                            <p class="text-sm font-black text-emerald-800 font-mono">{{ selectedActivo.codigo_activo }}</p>
                            <p class="text-[9px] font-black text-slate-500 uppercase mt-2">N° Serie / Chasis</p>
                            <p class="text-xs font-bold text-slate-900 font-mono">{{ selectedActivo.numero_chasis }}</p>
                        </div>
                    </div>

                    <!-- SECCIÓN CARACTERÍSTICAS DEL EQUIPO -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-black uppercase bg-slate-900 text-white px-3 py-1.5 tracking-wider">1. Especificaciones Técnicas del Fabricante</h3>
                        <div class="grid grid-cols-3 border border-slate-900 divide-x divide-y divide-slate-900">
                            <!-- Marca / Modelo -->
                            <div class="p-3 bg-slate-50"><p class="text-[8px] font-black text-slate-500 uppercase">Marca</p><p class="text-xs font-bold">{{ selectedActivo.marca || 'N/A' }}</p></div>
                            <div class="p-3 bg-slate-50"><p class="text-[8px] font-black text-slate-500 uppercase">Modelo</p><p class="text-xs font-bold">{{ selectedActivo.modelo || 'N/A' }}</p></div>
                            <div class="p-3 bg-slate-50"><p class="text-[8px] font-black text-slate-500 uppercase">Procedencia</p><p class="text-xs font-bold">{{ selectedActivo.procedencia || 'N/A' }}</p></div>
                            
                            <!-- Capacidad / Potencia / Cilindrada -->
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Capacidad Estanque</p><p class="text-xs font-bold">{{ selectedActivo.capacidad || 'N/A' }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Potencia HP</p><p class="text-xs font-bold">{{ selectedActivo.potencia_hp || 'N/A' }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Cilindrada cm³</p><p class="text-xs font-bold">{{ selectedActivo.cilindrada_cm3 || 'N/A' }}</p></div>
                            
                            <!-- Motor / Peso / Longitud espada -->
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Motor</p><p class="text-xs font-bold">{{ selectedActivo.motor || 'N/A' }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Peso Neto (KG)</p><p class="text-xs font-bold">{{ selectedActivo.peso_kg || 'N/A' }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Longitud Espada</p><p class="text-xs font-bold">{{ selectedActivo.longitud_espada || 'N/A' }}</p></div>
                            
                            <!-- Cadena / Paso Cadena / Fecha Adq -->
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Cadena</p><p class="text-xs font-bold">{{ selectedActivo.cadena || 'N/A' }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Paso de Cadena</p><p class="text-xs font-bold">{{ selectedActivo.paso_cadena || 'N/A' }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Fecha Adquisición</p><p class="text-xs font-bold">{{ formatDate(selectedActivo.fecha_adquisicion) }}</p></div>
                        </div>
                    </div>

                    <!-- CUSTODIA Y ESTADO OPERATIVO -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-black uppercase bg-slate-900 text-white px-3 py-1.5 tracking-wider">2. Efecto de Custodia y Situación Actual</h3>
                        <div class="grid grid-cols-2 border border-slate-900 divide-x divide-y divide-slate-900">
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Responsable Legal (Custodio)</p><p class="text-xs font-black text-emerald-800">{{ selectedActivo.custodio_nombre || 'NO ASIGNADO' }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Operario Final Designado</p><p class="text-xs font-black text-slate-800">{{ selectedActivo.operario_nombre || 'NO ASIGNADO' }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Ubicación Física Actual</p><p class="text-xs font-bold">{{ selectedActivo.ubicacion_actual }}</p></div>
                            <div class="p-3 bg-slate-50"><p class="text-[8px] font-black text-slate-500 uppercase">Estado Operativo</p><p class="text-xs font-black text-emerald-800">{{ formatEstado(selectedActivo.estado) }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Intensidad de Trabajo</p><p class="text-xs font-bold">{{ selectedActivo.uso }}</p></div>
                            <div class="p-3"><p class="text-[8px] font-black text-slate-500 uppercase">Observaciones Ficha</p><p class="text-xs font-medium italic">{{ selectedActivo.observaciones || 'Sin observaciones registradas.' }}</p></div>
                        </div>
                    </div>

                    <!-- REPUSTOS REEMPLAZADOS HISTÓRICOS -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-black uppercase bg-slate-900 text-white px-3 py-1.5 tracking-wider">3. Registro de Repuestos y Accesorios Reemplazados</h3>
                        <div class="border border-slate-900">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="bg-slate-100 font-bold border-b border-slate-900 text-[9px] uppercase tracking-wider text-slate-700">
                                        <th class="p-2 border-r border-slate-300">Fecha Cambio</th>
                                        <th class="p-2 border-r border-slate-300">Repuesto Entregado</th>
                                        <th class="p-2 border-r border-slate-300 text-center">Cant.</th>
                                        <th class="p-2 border-r border-slate-300">Técnico Receptor</th>
                                        <th class="p-2 border-r border-slate-300">Estado Devolución Pieza Vieja</th>
                                        <th class="p-2">Obs. Entrega</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="selectedActivoRepuestos.length === 0">
                                        <td colspan="6" class="p-3 text-center text-slate-500 italic">
                                            No se registran cambios de repuestos para este equipo.
                                        </td>
                                    </tr>
                                    <tr v-for="rep in selectedActivoRepuestos" :key="rep.id_movimiento" class="border-b border-slate-300">
                                        <td class="p-2 border-r border-slate-300 font-mono">{{ formatDateShort(rep.fecha_movimiento) }}</td>
                                        <td class="p-2 border-r border-slate-300 font-bold">{{ rep.item_nombre }}</td>
                                        <td class="p-2 border-r border-slate-300 text-center tabular-nums">{{ rep.cantidad }}</td>
                                        <td class="p-2 border-r border-slate-300">{{ rep.recibe_nombre || 'N/A' }}</td>
                                        <td class="p-2 border-r border-slate-300 text-xs">
                                            <span :class="[
                                                'px-2 py-0.5 rounded text-[9px] font-black uppercase',
                                                rep.estado_devolucion === 'Pendiente devolución' ? 'bg-amber-100 text-amber-800' :
                                                rep.estado_devolucion === 'Devuelto a Oficina' ? 'bg-blue-100 text-blue-800' :
                                                rep.estado_devolucion === 'Devuelto a Almacén' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                                            ]">{{ rep.estado_devolucion }}</span>
                                        </td>
                                        <td class="p-2 truncate max-w-[200px]" :title="rep.observaciones">{{ rep.observaciones || '---' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- BITÁCORA MANTENIMIENTO ANUAL -->
                    <div class="space-y-4">
                        <h3 class="text-xs font-black uppercase bg-slate-900 text-white px-3 py-1.5 tracking-wider">4. Historial de Mantenimiento Anual Preventivo y Correctivo</h3>
                        
                        <div v-if="selectedActivoMantenimientos.length === 0" class="border border-slate-900 p-4 text-center text-slate-500 italic">
                            No se registran mantenimientos anuales oficiales para este activo.
                        </div>
                        
                        <div v-for="(mant, mIdx) in selectedActivoMantenimientos" :key="mant.id_mantenimiento" class="border border-slate-900 rounded p-4 space-y-3 bg-slate-50">
                            <div class="flex justify-between items-center border-b border-slate-300 pb-2">
                                <span class="text-xs font-black uppercase text-emerald-800">MANTENIMIENTO ANUAL N° {{ mIdx + 1 }}</span>
                                <div class="text-[10px] text-slate-500 space-x-3 font-bold">
                                    <span>FECHA REGISTRO: {{ formatDate(mant.fecha_registro) }}</span>
                                    <span>|</span>
                                    <span>FECHA MANTENIMIENTO: {{ formatDate(mant.fecha_mantenimiento) }}</span>
                                </div>
                            </div>
                            
                            <p class="text-xs text-slate-700 italic"><span class="font-bold not-italic">Observaciones / Diagnóstico:</span> {{ mant.observaciones || 'Ninguna' }}</p>
                            
                            <!-- Detalles de costos y repuestos en el mantenimiento -->
                            <div class="border border-slate-300">
                                <table class="w-full text-[11px] text-left border-collapse bg-white">
                                    <thead>
                                        <tr class="bg-slate-100 border-b border-slate-300 text-[9px] font-black uppercase text-slate-600">
                                            <th class="p-1.5 border-r border-slate-300 text-center">N°</th>
                                            <th class="p-1.5 border-r border-slate-300">Detalle del Repuesto o Servicio</th>
                                            <th class="p-1.5 border-r border-slate-300">Unidad</th>
                                            <th class="p-1.5 border-r border-slate-300 text-center">Cant.</th>
                                            <th class="p-1.5 border-r border-slate-300 text-right">P. Unitario (Bs.)</th>
                                            <th class="p-1.5 text-right">Total (Bs.)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="det in mant.detalles" :key="det.id_detalle" class="border-b border-slate-200">
                                            <td class="p-1.5 border-r border-slate-300 text-center font-mono">{{ det.numero_item }}</td>
                                            <td class="p-1.5 border-r border-slate-300 font-bold">{{ det.detalle }}</td>
                                            <td class="p-1.5 border-r border-slate-300 text-slate-500">{{ det.unidad }}</td>
                                            <td class="p-1.5 border-r border-slate-300 text-center tabular-nums">{{ det.cantidad }}</td>
                                            <td class="p-1.5 border-r border-slate-300 text-right tabular-nums">{{ parseFloat(det.precio_unitario).toFixed(2) }}</td>
                                            <td class="p-1.5 text-right font-bold tabular-nums">{{ parseFloat(det.total_bs).toFixed(2) }}</td>
                                        </tr>
                                        <tr class="bg-slate-100 font-black">
                                            <td colspan="5" class="p-2 text-right uppercase tracking-wider">Costo Total Mantenimiento:</td>
                                            <td class="p-2 text-right text-emerald-800 font-mono text-xs">{{ calculateMantenimientoTotal(mant.detalles) }} Bs.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- REGISTRO FOTOGRÁFICO DE ENTREGA E INSPECCIÓN -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-black uppercase bg-slate-900 text-white px-3 py-1.5 tracking-wider">5. Registro Fotográfico de Entrega e Inspección</h3>
                        <div class="grid grid-cols-2 gap-4 border border-slate-900 p-4 bg-slate-50">
                            <!-- Fila Superior: Foto Lateral Anterior vs. Foto Lateral Actual -->
                            <div class="flex flex-col border border-slate-300 p-2 bg-white rounded">
                                <span class="text-[9px] font-black text-slate-500 uppercase mb-1">Foto Lateral - Estado Entrega (Anterior)</span>
                                <div class="h-40 bg-slate-100 flex items-center justify-center border border-slate-200 rounded overflow-hidden">
                                    <img v-if="selectedActivo.foto_lateral_anterior" :src="selectedActivo.foto_lateral_anterior" class="w-full h-full object-contain">
                                    <span v-else class="text-[10px] text-slate-400 font-bold uppercase">Sin imagen registrada</span>
                                </div>
                            </div>
                            <div class="flex flex-col border border-slate-300 p-2 bg-white rounded">
                                <span class="text-[9px] font-black text-slate-500 uppercase mb-1">Foto Lateral - Estado Actual</span>
                                <div class="h-40 bg-slate-100 flex items-center justify-center border border-slate-200 rounded overflow-hidden">
                                    <img v-if="selectedActivo.foto_lateral_actual" :src="selectedActivo.foto_lateral_actual" class="w-full h-full object-contain">
                                    <span v-else class="text-[10px] text-slate-400 font-bold uppercase">Sin imagen registrada</span>
                                </div>
                            </div>
                            <!-- Fila Inferior: Foto Superior Anterior vs. Foto Superior Actual -->
                            <div class="flex flex-col border border-slate-300 p-2 bg-white rounded">
                                <span class="text-[9px] font-black text-slate-500 uppercase mb-1">Foto Superior - Estado Entrega (Anterior)</span>
                                <div class="h-40 bg-slate-100 flex items-center justify-center border border-slate-200 rounded overflow-hidden">
                                    <img v-if="selectedActivo.foto_superior_anterior" :src="selectedActivo.foto_superior_anterior" class="w-full h-full object-contain">
                                    <span v-else class="text-[10px] text-slate-400 font-bold uppercase">Sin imagen registrada</span>
                                </div>
                            </div>
                            <div class="flex flex-col border border-slate-300 p-2 bg-white rounded">
                                <span class="text-[9px] font-black text-slate-500 uppercase mb-1">Foto Superior - Estado Actual</span>
                                <div class="h-40 bg-slate-100 flex items-center justify-center border border-slate-200 rounded overflow-hidden">
                                    <img v-if="selectedActivo.foto_superior_actual" :src="selectedActivo.foto_superior_actual" class="w-full h-full object-contain">
                                    <span v-else class="text-[10px] text-slate-400 font-bold uppercase">Sin imagen registrada</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- OBSERVACIONES Y ANOTACIONES ESPECIALES -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-black uppercase bg-slate-900 text-white px-3 py-1.5 tracking-wider">6. Observaciones y Notas de Campo</h3>
                        <div class="border border-slate-900 p-4 min-h-[100px] bg-white space-y-4 text-slate-900">
                            <!-- Observaciones del Sistema -->
                            <div class="text-xs">
                                <p class="font-bold text-slate-500 uppercase text-[9px] mb-1">Observaciones Registradas en Sistema:</p>
                                <p class="italic font-medium text-slate-800">
                                    {{ selectedActivo.observaciones || 'No se registraron observaciones especiales en el sistema.' }}
                                </p>
                            </div>
                            
                            <!-- Líneas en blanco para anotaciones físicas a mano en campo (para imprimir) -->
                            <div class="pt-3 border-t border-dashed border-slate-300">
                                <p class="font-bold text-slate-500 uppercase text-[9px] mb-3">Notas de Control Físico en Campo (Llenar a mano):</p>
                                <div class="space-y-4">
                                    <div class="border-b border-dashed border-slate-400 h-4 w-full"></div>
                                    <div class="border-b border-dashed border-slate-400 h-4 w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- FIRMAS DE RESPONSABILIDAD -->
                    <div class="grid grid-cols-3 pt-16 gap-6 text-center text-xs">
                        <div class="space-y-1">
                            <div class="w-40 border-t border-slate-900 mx-auto"></div>
                            <p class="font-bold">Firma Operario Designado</p>
                            <p class="text-[9px] text-slate-500 uppercase">{{ selectedActivo.operario_nombre || 'No asignado' }}</p>
                        </div>
                        <div class="space-y-1">
                            <div class="w-40 border-t border-slate-900 mx-auto"></div>
                            <p class="font-bold">Firma Responsable de Área</p>
                            <p class="text-[9px] text-slate-500 uppercase">{{ responsableArea }}</p>
                        </div>
                        <div class="space-y-1">
                            <div class="w-40 border-t border-slate-900 mx-auto"></div>
                            <p class="font-bold">Firma Jefe de Unidad</p>
                            <p class="text-[9px] text-slate-500 uppercase">{{ jefeUnidad }}</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 3: CONTROL DE ENTREGAS Y PIEZAS VIEJAS  -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'entregas'" class="space-y-6 no-print">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Panel Lateral Formulario Entrega -->
                <div class="lg:col-span-1 bg-card-main p-6 rounded-[2.5rem] border border-main space-y-6 h-fit">
                    <div>
                        <h2 class="text-lg font-black text-main">Asignar / Entregar Ítem</h2>
                        <p class="text-xs text-muted font-bold">Registrar entrega de herramientas o repuestos a personal de cuadrilla</p>
                    </div>

                    <form @submit.prevent="submitMovimiento" class="space-y-4">
                        <div class="flex flex-col">
                            <label class="label-prime">Seleccionar Ítem <span class="text-red-500">*</span></label>
                            <select v-model="movForm.id_item" required class="form-input-prime" @change="onMovItemChange">
                                <option value="" disabled>Seleccione un ítem...</option>
                                <option v-for="item in store.inventarioItems" :key="item.id_item" :value="item.id_item">
                                    {{ item.nombre }} ({{ item.tipo }})
                                </option>
                            </select>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Cantidad a Entregar <span class="text-red-500">*</span></label>
                            <input v-model.number="movForm.cantidad" type="number" min="1" required class="form-input-prime" placeholder="Cantidad">
                            <p v-if="movForm.id_item" class="text-[10px] font-bold text-muted mt-1 ml-1">
                                Stock Disponible Almacén: {{ getAvailableStock(movForm.id_item, 'Almacén') }} | Oficina: {{ getAvailableStock(movForm.id_item, 'Oficina') }}
                            </p>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Ubicación Origen (De donde sale) <span class="text-red-500">*</span></label>
                            <select v-model="movForm.origen" required class="form-input-prime">
                                <option value="Almacén">Almacén</option>
                                <option value="Oficina">Oficina</option>
                            </select>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Recibe Técnico (Responsable) <span class="text-red-500">*</span></label>
                            <select v-model="movForm.id_recibe" required class="form-input-prime">
                                <option value="" disabled>Seleccione funcionario...</option>
                                <option v-for="t in filterOnlyTecnicos" :key="t.id" :value="t.id">
                                    {{ t.nombre }} ({{ t.cargo }})
                                </option>
                            </select>
                        </div>

                        <!-- Si es REPUESTO, habilitar asignación a Motosierra/Activo Destino para flujo de cambio -->
                        <div v-if="selectedItemIsRepuesto" class="flex flex-col border-l-2 border-emerald-500 pl-3 py-1 space-y-2 animate-prime-in">
                            <label class="label-prime text-emerald-800 dark:text-emerald-400">Asignar a Activo Específico (Opcional)</label>
                            <select v-model="movForm.id_activo_destino" class="form-input-prime border-emerald-200">
                                <option value="">No aplica (Solo entrega genérica)</option>
                                <option v-for="act in store.inventarioActivos" :key="act.id_activo" :value="act.id_activo">
                                    {{ act.item_nombre }}: {{ act.marca }} {{ act.modelo }} [{{ act.codigo_activo }}]
                                </option>
                            </select>
                            <p class="text-[9px] text-muted italic">
                                Al vincular a una motosierra se habilitará el flujo de **Devolución Obligatoria de Pieza Vieja**.
                            </p>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Fecha de Movimiento</label>
                            <input v-model="movForm.fecha_movimiento" type="date" class="form-input-prime">
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Observaciones de Entrega</label>
                            <textarea v-model="movForm.observaciones" rows="2" class="form-input-prime" placeholder="Ej: Entrega por desgaste de espada original"></textarea>
                        </div>

                        <button type="submit" class="w-full py-4 bg-accent text-on-accent rounded-xl font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer">
                            Registrar Entrega
                        </button>
                    </form>
                </div>

                <!-- Tarjeta: Deudas por Técnico -->
                <div class="bg-card-main p-6 rounded-[2.5rem] border border-main space-y-4">
                    <div>
                        <h3 class="text-sm font-black text-main uppercase tracking-wider">Deudas por Técnico</h3>
                        <p class="text-[10px] text-muted font-bold">Repuestos pendientes de devolución en campo</p>
                    </div>
                    
                    <div class="space-y-3">
                        <div v-if="deudasPorTecnico.length === 0" class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center text-xs font-bold text-emerald-600">
                            ¡No hay deudas pendientes! Todo al día.
                        </div>
                        <div v-else class="divide-y divide-main">
                            <div v-for="debt in deudasPorTecnico" :key="debt.id" class="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                                <div>
                                    <p class="text-xs font-black text-main">{{ debt.nombre }}</p>
                                    <p class="text-[10px] text-muted font-semibold">{{ debt.cargo }}</p>
                                </div>
                                <span class="px-2.5 py-1 bg-red-500/20 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-500/10">
                                    {{ debt.deuda }} repuestos
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Listado y Flujo de Piezas Viejas / Devoluciones -->
                <div class="lg:col-span-2 space-y-6">
                    
                    <!-- Devoluciones de Piezas Viejas Pendientes -->
                    <div class="bg-card-main p-6 rounded-[2.5rem] border border-main space-y-4">
                        <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                                <h2 class="text-lg font-black text-main">Control y Retorno de Piezas Usadas (Flujo de Devolución)</h2>
                                <p class="text-xs text-muted font-bold">Fiscalizar repuestos cambiados en campo y retorno de piezas viejas a almacén</p>
                            </div>
                            <div class="relative w-full sm:w-64">
                                <input v-model="searchDevolucion" type="text" placeholder="Buscar devoluciones..." 
                                    class="w-full pl-9 pr-3 py-2 rounded-xl bg-card-sec border border-main text-main focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-bold text-xs">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                                    <Search class="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="bg-card-sec text-muted font-black border-b border-main text-[9px] uppercase tracking-wider">
                                        <th class="p-3">Fecha</th>
                                        <th class="p-3">Repuesto</th>
                                        <th class="p-3">Equipo Destino</th>
                                        <th class="p-3">Técnico Custodio</th>
                                        <th class="p-3">Estado Devolución</th>
                                        <th class="p-3 text-center">Acciones Retorno</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="pendienteDevoluciones.length === 0">
                                        <td colspan="6" class="p-8 text-center text-muted font-bold italic">
                                            No hay piezas viejas pendientes de devolución por el momento.
                                        </td>
                                    </tr>
                                    <tr v-for="dev in pendienteDevoluciones" :key="dev.id_movimiento" class="border-b border-main hover:bg-accent-soft/40 transition-all">
                                        <td class="p-3 font-mono font-bold">{{ formatDateShort(dev.fecha_movimiento) }}</td>
                                        <td class="p-3 font-black text-main">{{ dev.item_nombre }}</td>
                                        <td class="p-3 font-bold text-accent">{{ dev.activo_codigo }} ({{ dev.activo_modelo }})</td>
                                        <td class="p-3 font-bold text-main">{{ dev.recibe_nombre }}</td>
                                        <td class="p-3">
                                            <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-600 border border-amber-500/10">
                                                {{ dev.estado_devolucion }}
                                            </span>
                                        </td>
                                        <td class="p-3">
                                            <div class="flex items-center justify-center gap-2">
                                                <button @click="marcarDevolucionPieza(dev.id_movimiento, 'Devuelto a Oficina')" class="px-2.5 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer">
                                                    Recibido Oficina
                                                </button>
                                                <button @click="marcarDevolucionPieza(dev.id_movimiento, 'Devuelto a Almacén')" class="px-2.5 py-1.5 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer">
                                                    Retornado Almacén
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Bitácora general de movimientos históricos -->
                    <div class="bg-card-main p-6 rounded-[2.5rem] border border-main space-y-4">
                        <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <h2 class="text-base font-black text-main">Bitácora Reciente de Movimientos</h2>
                            <div class="flex items-center gap-3 w-full sm:w-auto">
                                <div class="relative flex-1 sm:w-64">
                                    <input v-model="searchMovimiento" type="text" placeholder="Buscar movimientos..." 
                                        class="w-full pl-9 pr-3 py-2 rounded-xl bg-card-sec border border-main text-main focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-bold text-xs">
                                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                                        <Search class="w-3.5 h-3.5" />
                                    </span>
                                </div>
                                <button type="button" @click="triggerPrintList('movimientos')" class="px-4 py-2.5 bg-card-sec hover:border-accent text-accent border border-main rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer" title="Imprimir bitácora">
                                    <Printer class="w-4 h-4" />
                                    <span>Imprimir Bitácora</span>
                                </button>
                            </div>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="bg-card-sec text-muted font-black border-b border-main text-[9px] uppercase tracking-wider">
                                        <th class="p-3">Fecha</th>
                                        <th class="p-3">Ítem</th>
                                        <th class="p-3">Tipo Mov.</th>
                                        <th class="p-3 text-center">Cantidad</th>
                                        <th class="p-3">Origen</th>
                                        <th class="p-3">Destino</th>
                                        <th class="p-3">Responsable</th>
                                        <th class="p-3">Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="filteredMovimientos.length === 0">
                                        <td colspan="8" class="p-6 text-center text-slate-500 italic">No hay registros de movimientos.</td>
                                    </tr>
                                    <tr v-for="m in filteredMovimientos.slice(0, 15)" :key="m.id_movimiento" class="border-b border-main hover:bg-card-sec/55 transition-all text-muted font-semibold">
                                        <td class="p-3 font-mono font-bold text-main">{{ formatDateShort(m.fecha_movimiento) }}</td>
                                        <td class="p-3 font-black text-main">{{ m.item_nombre }}</td>
                                        <td class="p-3">
                                            <span :class="[
                                                'px-2 py-0.5 rounded text-[8px] font-black uppercase',
                                                m.tipo_movimiento === 'Ingreso' ? 'bg-green-500/20 text-green-600' :
                                                m.tipo_movimiento === 'Traslado' ? 'bg-blue-500/20 text-blue-600' : 'bg-purple-500/20 text-purple-600'
                                            ]">{{ m.tipo_movimiento }}</span>
                                        </td>
                                        <td class="p-3 text-center font-bold text-main tabular-nums">{{ m.cantidad }}</td>
                                        <td class="p-3">{{ m.origen }}</td>
                                        <td class="p-3 text-main font-bold">{{ m.destino }}</td>
                                        <td class="p-3 text-main">{{ m.recibe_nombre || '---' }}</td>
                                        <td class="p-3 truncate max-w-[150px] font-medium" :title="m.observaciones">{{ m.observaciones || '---' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- MODALES DE OPERACIONES                    -->
        <!-- ========================================== -->
        <Teleport to="body">
            
            <!-- MODAL 1: REGISTRAR NUEVO ÍTEM EN EL CATÁLOGO -->
            <div v-if="showNewItemModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
                <div class="bg-card-main border border-main rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-prime-in">
                    <div class="px-6 py-5 modal-header-gradient flex justify-between items-center">
                        <h3 class="font-black text-lg text-white">{{ editingItem ? 'Editar Ítem del Catálogo' : 'Agregar Nuevo Ítem al Catálogo' }}</h3>
                        <button @click="showNewItemModal = false" class="text-white/80 hover:text-white cursor-pointer"><X class="w-6 h-6" /></button>
                    </div>
                    
                    <form @submit.prevent="submitNewItem" class="p-6 space-y-4">
                        <div class="flex flex-col">
                            <label class="label-prime">Nombre del Ítem <span class="text-red-500">*</span></label>
                            <input v-model="itemForm.nombre" type="text" required class="form-input-prime" placeholder="Ej: Cadena 18 pulgadas">
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Tipo de Clasificación <span class="text-red-500">*</span></label>
                            <select v-model="itemForm.tipo" required class="form-input-prime">
                                <option value="Consumible">Consumible / Herramienta Manual</option>
                                <option value="Repuesto">Repuesto (Sujeto a retorno de pieza vieja)</option>
                                <option value="Activo">Activo Codificado (Ficha Técnica & Seriales)</option>
                            </select>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Unidad de Medida</label>
                            <input v-model="itemForm.unidad_medida" type="text" class="form-input-prime" placeholder="Ej: Unidad, Par, Metros, Litros">
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Descripción Adicional</label>
                            <textarea v-model="itemForm.descripcion" rows="2" class="form-input-prime" placeholder="Especificaciones generales..."></textarea>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button type="button" @click="showNewItemModal = false" class="flex-1 py-3 border border-main rounded-xl text-xs font-black uppercase tracking-wider text-muted hover:bg-card-sec transition-all cursor-pointer">Cancelar</button>
                            <button type="submit" class="flex-1 py-3 bg-accent text-on-accent rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 transition-all cursor-pointer">{{ editingItem ? 'Guardar Cambios' : 'Crear Ítem' }}</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL 2: CARGA MASIVA / INGRESO DE COMPRAS POR ITEM -->
            <div v-if="showBulkImportModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
                <div class="bg-card-main border border-main rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-prime-in">
                    <div class="px-6 py-5 modal-header-gradient flex justify-between items-center">
                        <div>
                            <h3 class="font-black text-lg text-white">Ingreso Masivo de Stock / Compras</h3>
                            <p class="text-[9px] text-white/80 font-bold uppercase tracking-wider mt-1">Registrar entradas masivas desde proveedor a almacén</p>
                        </div>
                        <button @click="showBulkImportModal = false" class="text-white/80 hover:text-white cursor-pointer"><X class="w-6 h-6" /></button>
                    </div>

                    <form @submit.prevent="submitBulkImport" class="p-6 space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col col-span-2">
                                <label class="label-prime">Seleccionar Ítem a Abastecer <span class="text-red-500">*</span></label>
                                <select v-model="bulkForm.id_item" required class="form-input-prime">
                                    <option value="" disabled>Seleccione un item...</option>
                                    <option v-for="item in store.inventarioItems.filter(i => i.tipo !== 'Activo')" :key="item.id_item" :value="item.id_item">
                                        {{ item.nombre }} ({{ item.tipo }})
                                    </option>
                                </select>
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Cantidad Ingresada <span class="text-red-500">*</span></label>
                                <input v-model.number="bulkForm.cantidad" type="number" min="1" required class="form-input-prime" placeholder="Ej: 75">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Ubicación Destino <span class="text-red-500">*</span></label>
                                <select v-model="bulkForm.destino" required class="form-input-prime">
                                    <option value="Almacén">Almacén Central</option>
                                    <option value="Oficina">Oficina Técnica</option>
                                </select>
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Fecha de Adquisición / Ingreso</label>
                                <input v-model="bulkForm.fecha_movimiento" type="date" class="form-input-prime">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Costo Total Estimado (Bs.)</label>
                                <input v-model.number="bulkForm.costo_total" type="number" step="0.01" class="form-input-prime" placeholder="Ej: 3500.00">
                            </div>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Observaciones de la Compra / Adquisición</label>
                            <textarea v-model="bulkForm.observaciones" rows="3" class="form-input-prime" placeholder="Ej: Adquisición por ítem de 75 repuestos de motosierra - Factura N° 3445. Proveedor: Stihl Tarija."></textarea>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button type="button" @click="showBulkImportModal = false" class="flex-1 py-3 border border-main rounded-xl text-xs font-black uppercase tracking-wider text-muted hover:bg-card-sec transition-all cursor-pointer">Cancelar</button>
                            <button type="submit" class="flex-1 py-3 bg-accent text-on-accent rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 transition-all cursor-pointer">Registrar Compra</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL 3: TRASLADAR STOCK ENTRE ALMACÉN Y OFICINA -->
            <div v-if="showTransferModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
                <div class="bg-card-main border border-main rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-prime-in">
                    <div class="px-6 py-5 modal-header-gradient flex justify-between items-center">
                        <h3 class="font-black text-lg text-white">Trasladar Stock Interno</h3>
                        <button @click="showTransferModal = false" class="text-white/80 hover:text-white cursor-pointer"><X class="w-6 h-6" /></button>
                    </div>

                    <form @submit.prevent="submitTransfer" class="p-6 space-y-4">
                        <div class="flex flex-col">
                            <label class="label-prime">Seleccionar Ítem <span class="text-red-500">*</span></label>
                            <select v-model="transferForm.id_item" required class="form-input-prime">
                                <option value="" disabled>Seleccione un ítem...</option>
                                <option v-for="item in store.inventarioItems.filter(i => i.tipo !== 'Activo')" :key="item.id_item" :value="item.id_item">
                                    {{ item.nombre }} ({{ item.tipo }})
                                </option>
                            </select>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col">
                                <label class="label-prime">Origen <span class="text-red-500">*</span></label>
                                <select v-model="transferForm.origen" required class="form-input-prime">
                                    <option value="Almacén">Almacén</option>
                                    <option value="Oficina">Oficina</option>
                                </select>
                            </div>
                            <div class="flex flex-col">
                                <label class="label-prime">Destino <span class="text-red-500">*</span></label>
                                <select v-model="transferForm.destino" required class="form-input-prime">
                                    <option value="Almacén">Almacén</option>
                                    <option value="Oficina">Oficina</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Cantidad a Trasladar <span class="text-red-500">*</span></label>
                            <input v-model.number="transferForm.cantidad" type="number" min="1" required class="form-input-prime" placeholder="Cantidad">
                            <p v-if="transferForm.id_item" class="text-[10px] font-bold text-muted mt-1 ml-1">
                                Stock actual en origen: {{ getAvailableStock(transferForm.id_item, transferForm.origen) }} unidades.
                            </p>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Observaciones de Traslado</label>
                            <textarea v-model="transferForm.observaciones" rows="2" class="form-input-prime" placeholder="Motivo del traslado..."></textarea>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button type="button" @click="showTransferModal = false" class="flex-1 py-3 border border-main rounded-xl text-xs font-black uppercase tracking-wider text-muted hover:bg-card-sec transition-all cursor-pointer">Cancelar</button>
                            <button type="submit" class="flex-1 py-3 bg-accent text-on-accent rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 transition-all cursor-pointer">Trasladar</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL 4: REGISTRAR/EDITAR ACTIVO CODIFICADO (FICHA TÉCNICA) -->
            <div v-if="showActivoModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
                <div class="bg-card-main border border-main rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-prime-in">
                    <div class="px-6 py-5 modal-header-gradient flex justify-between items-center">
                        <h3 class="font-black text-lg text-white">{{ editingActivo ? 'Editar Ficha Activo' : 'Registrar Nuevo Activo Codificado' }}</h3>
                        <button @click="showActivoModal = false" class="text-white/80 hover:text-white cursor-pointer"><X class="w-6 h-6" /></button>
                    </div>

                    <form @submit.prevent="submitActivo" class="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar text-main bg-card-main">
                        <div class="grid grid-cols-2 gap-4">
                            
                            <div class="flex flex-col col-span-2">
                                <label class="label-prime">Categoría / Catálogo Ítem <span class="text-red-500">*</span></label>
                                <select v-model="activoForm.id_item" required :disabled="!!editingActivo" class="form-input-prime">
                                    <option value="" disabled>Seleccione item del catálogo...</option>
                                    <option v-for="item in store.inventarioItems.filter(i => i.tipo === 'Activo')" :key="item.id_item" :value="item.id_item">
                                        {{ item.nombre }}
                                    </option>
                                </select>
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Código Único Activo <span class="text-red-500">*</span></label>
                                <input v-model="activoForm.codigo_activo" type="text" required class="form-input-prime" placeholder="Ej: GAMT-MS-070-01">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Número de Chasis / Serie <span class="text-red-500">*</span></label>
                                <input v-model="activoForm.numero_chasis" type="text" required class="form-input-prime" placeholder="Serial único del motor">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Marca</label>
                                <input v-model="activoForm.marca" type="text" class="form-input-prime" placeholder="Ej: Stihl, Husqvarna">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Modelo</label>
                                <input v-model="activoForm.modelo" type="text" class="form-input-prime" placeholder="Ej: MS-070">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Procedencia</label>
                                <input v-model="activoForm.procedencia" type="text" class="form-input-prime" placeholder="Ej: Alemania, Brasil">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Capacidad de Estanque</label>
                                <input v-model="activoForm.capacidad" type="text" class="form-input-prime" placeholder="Ej: 1.2 Litros">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Potencia (HP)</label>
                                <input v-model="activoForm.potencia_hp" type="text" class="form-input-prime" placeholder="Ej: 6.5 HP">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Cilindrada (cm³)</label>
                                <input v-model="activoForm.cilindrada_cm3" type="text" class="form-input-prime" placeholder="Ej: 106 cc">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Motor</label>
                                <input v-model="activoForm.motor" type="text" class="form-input-prime" placeholder="Ej: 2 Tiempos Mono">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Peso Neto (KG)</label>
                                <input v-model="activoForm.peso_kg" type="text" class="form-input-prime" placeholder="Ej: 15 KG">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Longitud de Espada (Pulgadas)</label>
                                <input v-model="activoForm.longitud_espada" type="text" class="form-input-prime" placeholder="Ej: 36 pulgadas">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Cadena (Características)</label>
                                <input v-model="activoForm.cadena" type="text" class="form-input-prime" placeholder="Ej: Stihl 0.404' Dientes de cromo">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Paso de Cadena</label>
                                <input v-model="activoForm.paso_cadena" type="text" class="form-input-prime" placeholder="Ej: 0.404 pulgadas">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Fecha de Adquisición</label>
                                <input v-model="activoForm.fecha_adquisicion" type="date" class="form-input-prime">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Responsable Legal (Custodio)</label>
                                <select v-model="activoForm.id_custodio" class="form-input-prime">
                                    <option value="">Ninguno</option>
                                    <option v-for="t in filterOnlyTecnicos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                                </select>
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Operario Designado</label>
                                <select v-model="activoForm.id_usuario_operario" class="form-input-prime">
                                    <option value="">Ninguno</option>
                                    <option v-for="t in filterOnlyTecnicos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                                </select>
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Estado Físico Actual</label>
                                <select v-model="activoForm.estado" class="form-input-prime">
                                    <option value="Bueno">Bueno</option>
                                    <option value="De Baja">Baja Temporal</option>
                                    <option value="Malo">Malo (Inoperativo)</option>
                                </select>
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Intensidad de Uso</label>
                                <select v-model="activoForm.uso" class="form-input-prime">
                                    <option value="Bajo">Bajo</option>
                                    <option value="Moderado">Moderado</option>
                                    <option value="Intensivo">Intensivo</option>
                                </select>
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Ubicación Física Actual</label>
                                <select v-model="activoForm.ubicacion_actual" class="form-input-prime">
                                    <option value="Almacén">Almacén</option>
                                    <option value="Oficina">Oficina</option>
                                    <option value="Técnico">Técnico (Cuadrilla)</option>
                                </select>
                            </div>
                        </div>

                        <!-- REGISTRO DE FOTOGRAFÍAS -->
                        <div class="border-t border-main pt-4 mt-2">
                            <h4 class="font-black text-xs text-main uppercase tracking-wider mb-3">Fotografías del Activo (Ficha Técnica)</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <!-- Foto Lateral Anterior -->
                                <div class="flex flex-col p-3 border border-main rounded-2xl bg-card-sec relative">
                                    <label class="label-prime text-[10px] font-black uppercase tracking-wider mb-2">Foto Lateral - Estado Entrega (Anterior)</label>
                                    <div class="flex flex-col items-center justify-center border-2 border-dashed border-main rounded-xl p-2 min-h-[140px] relative overflow-hidden bg-card-main transition-all hover:border-accent/50">
                                        <template v-if="activoForm.foto_lateral_anterior">
                                            <img :src="activoForm.foto_lateral_anterior" class="max-h-[120px] object-contain rounded-lg">
                                            <button type="button" @click="activoForm.foto_lateral_anterior = null" class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 cursor-pointer transition-all shadow-md z-10">
                                                <Trash2 class="w-4 h-4" />
                                            </button>
                                        </template>
                                        <template v-else>
                                            <Upload class="w-8 h-8 text-muted mb-1" />
                                            <span class="text-[10px] text-muted text-center font-bold">Subir foto lateral</span>
                                            <input type="file" accept="image/*" @change="handlePhotoUpload('foto_lateral_anterior', $event)" class="absolute inset-0 opacity-0 cursor-pointer">
                                        </template>
                                    </div>
                                </div>
                                <!-- Foto Lateral Actual -->
                                <div class="flex flex-col p-3 border border-main rounded-2xl bg-card-sec relative">
                                    <label class="label-prime text-[10px] font-black uppercase tracking-wider mb-2">Foto Lateral - Estado Actual (Inspección)</label>
                                    <div class="flex flex-col items-center justify-center border-2 border-dashed border-main rounded-xl p-2 min-h-[140px] relative overflow-hidden bg-card-main transition-all hover:border-accent/50">
                                        <template v-if="activoForm.foto_lateral_actual">
                                            <img :src="activoForm.foto_lateral_actual" class="max-h-[120px] object-contain rounded-lg">
                                            <button type="button" @click="activoForm.foto_lateral_actual = null" class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 cursor-pointer transition-all shadow-md z-10">
                                                <Trash2 class="w-4 h-4" />
                                            </button>
                                        </template>
                                        <template v-else>
                                            <Upload class="w-8 h-8 text-muted mb-1" />
                                            <span class="text-[10px] text-muted text-center font-bold">Subir foto lateral</span>
                                            <input type="file" accept="image/*" @change="handlePhotoUpload('foto_lateral_actual', $event)" class="absolute inset-0 opacity-0 cursor-pointer">
                                        </template>
                                    </div>
                                </div>
                                <!-- Foto Superior Anterior -->
                                <div class="flex flex-col p-3 border border-main rounded-2xl bg-card-sec relative">
                                    <label class="label-prime text-[10px] font-black uppercase tracking-wider mb-2">Foto Superior - Estado Entrega (Anterior)</label>
                                    <div class="flex flex-col items-center justify-center border-2 border-dashed border-main rounded-xl p-2 min-h-[140px] relative overflow-hidden bg-card-main transition-all hover:border-accent/50">
                                        <template v-if="activoForm.foto_superior_anterior">
                                            <img :src="activoForm.foto_superior_anterior" class="max-h-[120px] object-contain rounded-lg">
                                            <button type="button" @click="activoForm.foto_superior_anterior = null" class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 cursor-pointer transition-all shadow-md z-10">
                                                <Trash2 class="w-4 h-4" />
                                            </button>
                                        </template>
                                        <template v-else>
                                            <Upload class="w-8 h-8 text-muted mb-1" />
                                            <span class="text-[10px] text-muted text-center font-bold">Subir foto superior</span>
                                            <input type="file" accept="image/*" @change="handlePhotoUpload('foto_superior_anterior', $event)" class="absolute inset-0 opacity-0 cursor-pointer">
                                        </template>
                                    </div>
                                </div>
                                <!-- Foto Superior Actual -->
                                <div class="flex flex-col p-3 border border-main rounded-2xl bg-card-sec relative">
                                    <label class="label-prime text-[10px] font-black uppercase tracking-wider mb-2">Foto Superior - Estado Actual (Inspección)</label>
                                    <div class="flex flex-col items-center justify-center border-2 border-dashed border-main rounded-xl p-2 min-h-[140px] relative overflow-hidden bg-card-main transition-all hover:border-accent/50">
                                        <template v-if="activoForm.foto_superior_actual">
                                            <img :src="activoForm.foto_superior_actual" class="max-h-[120px] object-contain rounded-lg">
                                            <button type="button" @click="activoForm.foto_superior_actual = null" class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 cursor-pointer transition-all shadow-md z-10">
                                                <Trash2 class="w-4 h-4" />
                                            </button>
                                        </template>
                                        <template v-else>
                                            <Upload class="w-8 h-8 text-muted mb-1" />
                                            <span class="text-[10px] text-muted text-center font-bold">Subir foto superior</span>
                                            <input type="file" accept="image/*" @change="handlePhotoUpload('foto_superior_actual', $event)" class="absolute inset-0 opacity-0 cursor-pointer">
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Observaciones Adicionales</label>
                            <textarea v-model="activoForm.observaciones" rows="2" class="form-input-prime"></textarea>
                        </div>

                        <div class="flex gap-3 pt-4 bg-card-main">
                            <button type="button" :disabled="isSavingActivo" @click="showActivoModal = false" class="flex-1 py-3 border border-main rounded-xl text-xs font-black uppercase tracking-wider text-muted hover:bg-card-sec transition-all cursor-pointer disabled:opacity-50">Cancelar</button>
                            <button type="submit" :disabled="isSavingActivo" class="flex-1 py-3 bg-accent text-on-accent rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                                <span v-if="isSavingActivo" class="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
                                <span>{{ isSavingActivo ? 'Guardando...' : 'Guardar Activo' }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL 5: TRANSFERIR CUSTODIA DE ACTIVO -->
            <div v-if="showCustodyModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
                <div class="bg-card-main border border-main rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-prime-in">
                    <div class="px-6 py-5 modal-header-gradient flex justify-between items-center">
                        <h3 class="font-black text-lg text-white">Transferir Custodia / Operario</h3>
                        <button @click="showCustodyModal = false" class="text-white/80 hover:text-white cursor-pointer"><X class="w-6 h-6" /></button>
                    </div>

                    <form @submit.prevent="submitCustodyTransfer" class="p-6 space-y-4">
                        <div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                            <p class="text-xs font-bold text-main leading-tight">Activo: {{ custodyForm.activo_nombre }}</p>
                            <p class="text-[10px] font-mono text-muted mt-1">Código: {{ custodyForm.codigo_activo }}</p>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Nuevo Responsable Legal (Custodio)</label>
                            <select v-model="custodyForm.id_custodio" class="form-input-prime">
                                <option value="">Ninguno (En almacén/oficina)</option>
                                <option v-for="t in filterOnlyTecnicos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                            </select>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Nuevo Operario Designado</label>
                            <select v-model="custodyForm.id_usuario_operario" class="form-input-prime">
                                <option value="">Ninguno</option>
                                <option v-for="t in filterOnlyTecnicos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                            </select>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Nueva Ubicación Física</label>
                            <select v-model="custodyForm.ubicacion_actual" required class="form-input-prime">
                                <option value="Almacén">Almacén Central</option>
                                <option value="Oficina">Oficina Técnica</option>
                                <option value="Técnico">En Cuadrilla (Técnico)</option>
                            </select>
                        </div>

                        <div class="flex flex-col">
                            <label class="label-prime">Detalles / Motivo del Traslado</label>
                            <textarea v-model="custodyForm.observaciones" rows="2" class="form-input-prime" placeholder="Ej: Cambio de cuadrilla de poda."></textarea>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button type="button" @click="showCustodyModal = false" class="flex-1 py-3 border border-main rounded-xl text-xs font-black uppercase tracking-wider text-muted hover:bg-card-sec transition-all cursor-pointer">Cancelar</button>
                            <button type="submit" class="flex-1 py-3 bg-accent text-on-accent rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 transition-all cursor-pointer">Confirmar Transferencia</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL 6: REGISTRAR MANTENIMIENTO ANUAL CON GRILLA DINÁMICA -->
            <div v-if="showMaintenanceModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
                <div class="bg-card-main border border-main rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-prime-in">
                    <div class="px-6 py-5 modal-header-gradient flex justify-between items-center">
                        <div>
                            <h3 class="font-black text-lg text-white">Registrar Mantenimiento Oficial</h3>
                            <p class="text-[9px] text-white/80 font-bold uppercase tracking-wider mt-1">Activo: {{ maintForm.activo_nombre }} ({{ maintForm.codigo_activo }})</p>
                        </div>
                        <button @click="showMaintenanceModal = false" class="text-white/80 hover:text-white cursor-pointer"><X class="w-6 h-6" /></button>
                    </div>

                    <form @submit.prevent="submitMaintenance" class="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar bg-card-main text-main">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col">
                                <label class="label-prime">Fecha del Mantenimiento <span class="text-red-500">*</span></label>
                                <input v-model="maintForm.fecha_mantenimiento" type="date" required class="form-input-prime">
                            </div>

                            <div class="flex flex-col">
                                <label class="label-prime">Diagnóstico / Diagnóstico General</label>
                                <input v-model="maintForm.observaciones" type="text" class="form-input-prime" placeholder="Ej: Ajuste de carburador y cambio de filtro de aire">
                            </div>
                        </div>

                        <!-- Grilla de repuestos/mano de obra del mantenimiento -->
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <h4 class="text-xs font-black uppercase text-slate-500 tracking-wider">Repuestos Utilizados & Mano de Obra</h4>
                                <button type="button" @click="addMaintDetailRow" class="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">
                                    + Agregar Fila
                                </button>
                            </div>

                            <div class="border border-main rounded-xl overflow-hidden">
                                <table class="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr class="bg-card-sec border-b border-main text-[9px] font-black uppercase text-muted">
                                            <th class="p-3 text-center w-12">N°</th>
                                            <th class="p-3">Detalle del Ítem / Servicio</th>
                                            <th class="p-3 w-24">Unidad</th>
                                            <th class="p-3 w-20 text-center">Cant.</th>
                                            <th class="p-3 w-28 text-right">Precio Unit (Bs)</th>
                                            <th class="p-3 w-28 text-right">Total (Bs)</th>
                                            <th class="p-3 text-center w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="maintForm.detalles.length === 0">
                                            <td colspan="7" class="p-6 text-center text-muted italic font-bold">
                                                Haz clic en "+ Agregar Fila" para detallar repuestos o servicios prestados.
                                            </td>
                                        </tr>
                                        <tr v-for="(det, index) in maintForm.detalles" :key="index" class="border-b border-main align-middle">
                                            <td class="p-2 text-center font-mono font-bold">{{ index + 1 }}</td>
                                            <td class="p-2">
                                                <input v-model="det.detalle" type="text" required class="w-full px-2 py-1.5 rounded-lg border border-main text-xs" placeholder="Ej: Bujía Champion L82C">
                                            </td>
                                            <td class="p-2">
                                                <input v-model="det.unidad" type="text" class="w-full px-2 py-1.5 rounded-lg border border-main text-xs" placeholder="Unidad">
                                            </td>
                                            <td class="p-2">
                                                <input v-model.number="det.cantidad" type="number" min="1" required class="w-full px-2 py-1.5 rounded-lg border border-main text-xs text-center" @input="updateMaintRowTotal(index)">
                                            </td>
                                            <td class="p-2">
                                                <input v-model.number="det.precio_unitario" type="number" step="0.01" min="0" required class="w-full px-2 py-1.5 rounded-lg border border-main text-xs text-right" @input="updateMaintRowTotal(index)">
                                            </td>
                                            <td class="p-2 text-right font-black font-mono text-xs text-slate-800 dark:text-slate-200">
                                                {{ det.total_bs.toFixed(2) }}
                                            </td>
                                            <td class="p-2 text-center">
                                                <button type="button" @click="removeMaintDetailRow(index)" class="p-1.5 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 rounded-lg transition-all cursor-pointer">
                                                    <X class="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                        <tr class="bg-card-sec font-black border-t border-main">
                                            <td colspan="5" class="p-3 text-right uppercase tracking-wider text-[10px] text-muted">Total Acumulado Mantenimiento:</td>
                                            <td class="p-3 text-right text-accent font-mono text-sm">{{ calculateMaintFormTotal.toFixed(2) }} Bs.</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button type="button" @click="showMaintenanceModal = false" class="flex-1 py-3 border border-main rounded-xl text-xs font-black uppercase tracking-wider text-muted hover:bg-card-sec transition-all cursor-pointer">Cancelar</button>
                            <button type="submit" class="flex-1 py-3 bg-accent text-on-accent rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 transition-all cursor-pointer">Registrar Mantenimiento</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN CUSTOM PREMIUM -->
            <Transition name="fade-confirm">
                <div v-if="showConfirmModal" class="fixed inset-0 bg-gray-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[99999]">
                    <div class="bg-card-main rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-main scale-in">
                        <!-- Cabecera Roja de Peligro -->
                        <div class="modal-header-danger p-8 flex flex-col items-center text-center text-white border-b border-red-900/20">
                            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                                <AlertTriangle class="w-8 h-8 text-white" />
                            </div>
                            <h3 class="font-black text-lg tracking-tight text-white">{{ confirmTitle }}</h3>
                            <p class="text-red-100/80 text-[10px] font-bold uppercase tracking-widest mt-1">Acción Irreversible</p>
                        </div>

                        <!-- Cuerpo del modal -->
                        <div class="p-6 text-center space-y-3 bg-card-main">
                            <p class="text-main text-sm font-bold leading-relaxed">
                                {{ confirmMessage }}
                            </p>
                        </div>

                        <!-- Botones de Acción -->
                        <div class="px-6 pb-6 flex gap-3 bg-card-main">
                            <button @click="showConfirmModal = false"
                                class="flex-1 py-3 rounded-xl border-2 border-main font-black text-muted uppercase text-xs tracking-widest hover:bg-card-sec transition-all cursor-pointer">
                                Cancelar
                            </button>
                            <button @click="ejecutarConfirmacion"
                                class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all cursor-pointer">
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
            
        </Teleport>

    </div>

    <!-- ===== REPORTE FORMAL PARA IMPRESIÓN (A4) ===== -->
    <div v-if="printTarget" class="hidden print:block bulk-print-layout bg-white text-black p-0 m-0">
        <!-- Membrete oficial G.A.M.T. -->
        <div class="print-header border-b-2 border-green-800 pb-4 mb-6">
            <div class="flex items-center gap-6">
                <div class="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-white">
                    <img v-if="uiState.logo_institucional" :src="uiState.logo_institucional" class="w-full h-full object-contain">
                    <div v-else class="text-[8px] font-black text-center text-muted uppercase">Logo Municipal</div>
                </div>
                <div class="flex-1 text-center">
                    <p class="font-black text-base uppercase text-slate-800 leading-tight">Gobierno Autónomo Municipal de Tarija</p>
                    <p class="font-bold text-xs uppercase text-slate-600">Dirección de Obras Públicas Municipales</p>
                    <p class="font-bold text-[10px] uppercase text-slate-500">Unidad de Arboricultura y Espacios Verdes</p>
                </div>
                <div class="w-20 h-20"></div>
            </div>
        </div>

        <!-- Título del Reporte y Metadatos -->
        <div class="text-center mb-6">
            <h1 class="text-lg font-black uppercase text-slate-900 tracking-tight">
                {{ printTarget === 'stock' ? 'Reporte Catálogo General de Inventario' : 
                   printTarget === 'activos' ? 'Reporte General de Activos Codificados' : 
                   'Reporte Histórico - Bitácora de Movimientos' }}
            </h1>
            <div class="flex justify-center items-center gap-4 mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Emisión: <strong>{{ new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }) }} ({{ new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }})</strong></span>
                <span>|</span>
                <span>Emitido por: <strong>{{ uiState.user?.nombre || 'Administrador' }}</strong></span>
            </div>
        </div>

        <!-- Contenido según el printTarget -->
        
        <!-- 1. STOCK GENERAL (CATÁLOGO) -->
        <div v-if="printTarget === 'stock'">
            <table class="w-full text-left text-xs border-collapse print-table">
                <thead>
                    <tr class="bg-gray-100 text-black font-black border border-black uppercase text-[9px]">
                        <th class="border border-black p-2">Nombre del Ítem</th>
                        <th class="border border-black p-2">Tipo</th>
                        <th class="border border-black p-2 text-center">Almacén</th>
                        <th class="border border-black p-2 text-center">Oficina</th>
                        <th class="border border-black p-2 text-center">Técnicos</th>
                        <th class="border border-black p-2 text-center">Total Stock</th>
                        <th class="border border-black p-2">Unidad</th>
                        <th class="border border-black p-2">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in filteredStock" :key="item.id_item" class="text-[10px] border border-black">
                        <td class="border border-black p-2 font-bold">{{ item.nombre }}</td>
                        <td class="border border-black p-2 font-medium">{{ item.tipo }}</td>
                        <td class="border border-black p-2 text-center font-mono font-medium">{{ item.tipo === 'Activo' ? countActivosEnUbicacion(item.id_item, 'Almacén') : item.cantidad_almacen }}</td>
                        <td class="border border-black p-2 text-center font-mono font-medium">{{ item.tipo === 'Activo' ? countActivosEnUbicacion(item.id_item, 'Oficina') : item.cantidad_oficina }}</td>
                        <td class="border border-black p-2 text-center font-mono font-medium">{{ item.tipo === 'Activo' ? countActivosEnUbicacion(item.id_item, 'Técnico') : item.cantidad_tecnicos }}</td>
                        <td class="border border-black p-2 text-center font-mono font-bold text-green-800">{{ item.tipo === 'Activo' ? countActivosEnUbicacion(item.id_item) : (item.cantidad_almacen + item.cantidad_oficina + item.cantidad_tecnicos) }}</td>
                        <td class="border border-black p-2 font-medium">{{ item.unidad_medida }}</td>
                        <td class="border border-black p-2 font-bold">
                            {{ item.tipo !== 'Activo' && (item.cantidad_almacen + item.cantidad_oficina + item.cantidad_tecnicos) === 0 ? 'Agotado' :
                               item.tipo !== 'Activo' && (item.cantidad_almacen + item.cantidad_oficina + item.cantidad_tecnicos) < 5 ? 'Stock Bajo' : 'Disponible' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 2. ACTIVOS CODIFICADOS -->
        <div v-if="printTarget === 'activos'">
            <table class="w-full text-left text-xs border-collapse print-table">
                <thead>
                    <tr class="bg-gray-100 text-black font-black border border-black uppercase text-[9px]">
                        <th class="border border-black p-2">Código Activo</th>
                        <th class="border border-black p-2">Marca / Modelo</th>
                        <th class="border border-black p-2">Ubicación Actual</th>
                        <th class="border border-black p-2">Responsable Legal (Custodio)</th>
                        <th class="border border-black p-2">Operario Designado</th>
                        <th class="border border-black p-2">Serie / Chasis</th>
                        <th class="border border-black p-2 text-center">Estado Físico</th>
                        <th class="border border-black p-2 text-center">Uso</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="act in filteredActivos" :key="act.id_activo" class="text-[10px] border border-black">
                        <td class="border border-black p-2 font-mono font-bold">{{ act.codigo_activo }}</td>
                        <td class="border border-black p-2 font-bold">{{ act.marca }} {{ act.modelo }}</td>
                        <td class="border border-black p-2 font-medium">{{ act.ubicacion_actual }}</td>
                        <td class="border border-black p-2 font-medium">{{ act.custodio_nombre || 'Sin Custodio' }}</td>
                        <td class="border border-black p-2 font-medium">{{ act.operario_nombre || 'Sin Asignar' }}</td>
                        <td class="border border-black p-2 font-mono font-medium">{{ act.numero_chasis }}</td>
                        <td class="border border-black p-2 text-center font-bold">{{ formatEstado(act.estado) }}</td>
                        <td class="border border-black p-2 text-center font-semibold">{{ act.uso }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 3. BITÁCORA DE MOVIMIENTOS -->
        <div v-if="printTarget === 'movimientos'">
            <table class="w-full text-left text-xs border-collapse print-table">
                <thead>
                    <tr class="bg-gray-100 text-black font-black border border-black uppercase text-[9px]">
                        <th class="border border-black p-2">Fecha</th>
                        <th class="border border-black p-2">Ítem Catálogo</th>
                        <th class="border border-black p-2">Tipo Mov.</th>
                        <th class="border border-black p-2 text-center">Cantidad</th>
                        <th class="border border-black p-2">Origen</th>
                        <th class="border border-black p-2">Destino</th>
                        <th class="border border-black p-2">Responsable</th>
                        <th class="border border-black p-2">Observaciones / Detalles</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="m in filteredMovimientos" :key="m.id_movimiento" class="text-[10px] border border-black">
                        <td class="border border-black p-2 font-mono font-medium">{{ formatDateShort(m.fecha_movimiento) }}</td>
                        <td class="border border-black p-2 font-bold">{{ m.item_nombre }}</td>
                        <td class="border border-black p-2 font-semibold">{{ m.tipo_movimiento }}</td>
                        <td class="border border-black p-2 text-center font-mono font-bold">{{ m.cantidad }}</td>
                        <td class="border border-black p-2 font-medium">{{ m.origen }}</td>
                        <td class="border border-black p-2 font-medium">{{ m.destino }}</td>
                        <td class="border border-black p-2 font-medium">{{ m.recibe_nombre || '---' }}</td>
                        <td class="border border-black p-2 text-slate-700 italic">{{ m.observaciones || '---' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Bloque de Firmas Estructuradas -->
        <div class="print-firmas mt-16">
            <div class="border-t border-b border-black py-2 mb-8">
                <p class="text-[8px] text-slate-500 italic text-center leading-tight uppercase font-semibold">
                    IMPORTANTE: Este documento es un reporte técnico formal con respaldo íntegro en la base de datos municipal del Módulo de Inventario y Herramientas.
                    Se ruega verificar los registros antes de proceder con las firmas correspondientes.
                </p>
            </div>

            <div class="print-firmas-row flex justify-around mt-8">
                <div class="print-firma text-center">
                    <div class="print-firma-linea w-40 border-b border-black mx-auto mb-2 h-16"></div>
                    <p class="print-firma-nombre font-black text-[9px] uppercase">
                        {{ printTarget === 'activos' && filterActivosCustodio ? getCustodioName(filterActivosCustodio) : (uiState.user?.nombre || 'Responsable de Inventario') }}
                    </p>
                    <p class="print-firma-cargo text-[8px] text-slate-500 uppercase font-bold">
                        {{ printTarget === 'activos' && filterActivosCustodio ? 'Custodio Designado' : 'Responsable de Registro' }}
                    </p>
                </div>
                <div class="print-firma text-center">
                    <div class="print-firma-linea w-40 border-b border-black mx-auto mb-2 h-16"></div>
                    <p class="print-firma-nombre font-black text-[9px] uppercase">{{ responsableArea }}</p>
                    <p class="print-firma-cargo text-[8px] text-slate-500 uppercase font-bold">Responsable de Área</p>
                </div>
                <div class="print-firma text-center">
                    <div class="print-firma-linea w-40 border-b border-black mx-auto mb-2 h-16"></div>
                    <p class="print-firma-nombre font-black text-[9px] uppercase">{{ jefeUnidad }}</p>
                    <p class="print-firma-cargo text-[8px] text-slate-500 uppercase font-bold">Jefe de Unidad</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useMainStore } from '../store/mainStore.js'
import { 
    Boxes, Wrench, Search, Plus, ArrowRightLeft, ArrowDownToLine, Printer, Eye, Pencil, X, History,
    CheckCircle, Sliders, Trash2, AlertTriangle, Upload, User, RotateCcw
} from 'lucide-vue-next'

const mainStore = useMainStore()
const { store, uiState, showToast, responsableArea, jefeUnidad } = mainStore

// Tabs
const activeTab = ref('stock')

// Búsqueda
const searchStock = ref('')
const searchActivo = ref('')
const searchDevolucion = ref('')
const searchMovimiento = ref('')

// Filtros avanzados
const filterActivosItem = ref('')
const filterActivosCustodio = ref('')
const filterActivosUbicacion = ref('')
const viewModeActivos = ref('grid') // 'grid' | 'table'
const filterStockTipo = ref('')

const printTarget = ref('')
const triggerPrintList = (target) => {
    printTarget.value = target
    setTimeout(() => {
        window.print()
        printTarget.value = ''
    }, 150)
}

const getCustodioName = (id) => {
    if (!id) return ''
    const tecnico = store.tecnicos.find(t => t.id === Number(id) || t.id === id)
    return tecnico ? tecnico.nombre : ''
}

// Ficha Técnica de activo seleccionado
const selectedActivo = ref(null)
const selectedActivoRepuestos = ref([])
const selectedActivoMantenimientos = ref([])
const isPrinting = ref(false)

// Modales states
const showNewItemModal = ref(false)
const showBulkImportModal = ref(false)
const showTransferModal = ref(false)
const showActivoModal = ref(false)
const showCustodyModal = ref(false)
const showMaintenanceModal = ref(false)

const editingActivo = ref(null)
const editingItem = ref(null)
const isSavingActivo = ref(false)

// Confirmación modal custom
const showConfirmModal = ref(false)
const confirmTitle = ref('Confirmar Eliminación')
const confirmMessage = ref('¿Estás seguro de eliminar este registro?')
let onConfirmCallback = null

const mostrarConfirmacion = (titulo, mensaje, callback) => {
    confirmTitle.value = titulo
    confirmMessage.value = mensaje
    onConfirmCallback = callback
    showConfirmModal.value = true
}

const ejecutarConfirmacion = async () => {
    showConfirmModal.value = false
    if (onConfirmCallback) {
        await onConfirmCallback()
    }
}

// Formularios reactivos
const itemForm = reactive({
    nombre: '',
    tipo: 'Consumible',
    unidad_medida: 'Unidad',
    descripcion: ''
})

const bulkForm = reactive({
    id_item: '',
    cantidad: 1,
    destino: 'Almacén',
    fecha_movimiento: new Date().toISOString().split('T')[0],
    costo_total: 0,
    observaciones: ''
})

const transferForm = reactive({
    id_item: '',
    cantidad: 1,
    origen: 'Almacén',
    destino: 'Oficina',
    observaciones: ''
})

const activoForm = reactive({
    id_item: '',
    marca: '',
    modelo: '',
    procedencia: '',
    capacidad: '',
    potencia_hp: '',
    cilindrada_cm3: '',
    motor: '',
    peso_kg: '',
    longitud_espada: '',
    cadena: '',
    paso_cadena: '',
    fecha_adquisicion: '',
    numero_chasis: '',
    codigo_activo: '',
    estado: 'Bueno',
    uso: 'Moderado',
    ubicacion_actual: 'Almacén',
    id_custodio: '',
    id_usuario_operario: '',
    observaciones: '',
    foto_lateral_anterior: null,
    foto_lateral_actual: null,
    foto_superior_anterior: null,
    foto_superior_actual: null
})

const custodyForm = reactive({
    id_activo: '',
    activo_nombre: '',
    codigo_activo: '',
    id_custodio: '',
    id_usuario_operario: '',
    ubicacion_actual: 'Almacén',
    observaciones: ''
})

const maintForm = reactive({
    id_activo: '',
    activo_nombre: '',
    codigo_activo: '',
    fecha_mantenimiento: new Date().toISOString().split('T')[0],
    observaciones: '',
    detalles: []
})

const movForm = reactive({
    id_item: '',
    cantidad: 1,
    tipo_movimiento: 'Entrega',
    origen: 'Almacén',
    destino: 'Técnico',
    id_recibe: '',
    id_activo_destino: '',
    fecha_movimiento: new Date().toISOString().split('T')[0],
    observaciones: ''
})

// Computeds
const totalStockAlmacen = computed(() => {
    return store.inventarioConsumibles.reduce((acc, curr) => acc + (curr.cantidad_almacen || 0), 0)
})

const devolucionesPendientesCount = computed(() => {
    return store.inventarioMovimientos.filter(m => m.estado_devolucion === 'Pendiente devolución').length
})

// KPIs de Motosierras y Técnicos
const motosierrasHabilitadasCount = computed(() => {
    return store.inventarioActivos.filter(a => 
        (a.id_item === 1 || a.id_item === 2) && 
        ['Excelente', 'Bueno', 'Regular'].includes(a.estado)
    ).length
})

const motosierrasBajaTempCount = computed(() => {
    return store.inventarioActivos.filter(a => 
        (a.id_item === 1 || a.id_item === 2) && 
        ['Malo', 'Mantenimiento', 'De Baja'].includes(a.estado)
    ).length
})

const tecnicosConDeudasCount = computed(() => {
    const pending = store.inventarioMovimientos.filter(m => m.estado_devolucion === 'Pendiente devolución')
    const uniqueIds = new Set(pending.map(m => m.id_recibe).filter(Boolean))
    return uniqueIds.size
})

const deudasPorTecnico = computed(() => {
    const pending = store.inventarioMovimientos.filter(m => m.estado_devolucion === 'Pendiente devolución')
    const list = []
    store.tecnicos.forEach(t => {
        const count = pending.filter(m => m.id_recibe === t.id).reduce((sum, m) => sum + m.cantidad, 0)
        if (count > 0) {
            list.push({
                id: t.id,
                nombre: t.nombre,
                cargo: t.cargo,
                deuda: count
            })
        }
    })
    return list.sort((a, b) => b.deuda - a.deuda)
})

const formatEstado = (val) => {
    if (val === 'De Baja') return 'Baja Temporal'
    return val
}

const capitalizeFirstLetter = (val) => {
    if (typeof val !== 'string' || !val) return val
    return val.charAt(0).toUpperCase() + val.slice(1)
}

const filterOnlyTecnicos = computed(() => {
    const allowedCargos = [
        'tecnico de equipo',
        'chofer',
        'tecnico de sistemas',
        'jefe de unidad',
        'responsable de area'
    ]
    return store.tecnicos.filter(t => {
        if (!t.cargo) return false
        const cargoNorm = t.cargo
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        return allowedCargos.includes(cargoNorm)
    })
})

const filteredStock = computed(() => {
    // Merge inventarioItems with consumibles stock data for a unified catalog view
    let list = store.inventarioItems.map(item => {
        const stockRow = store.inventarioConsumibles.find(c => c.id_item === item.id_item)
        return {
            ...item,
            item_nombre: item.nombre,
            cantidad_almacen: stockRow ? stockRow.cantidad_almacen : 0,
            cantidad_oficina: stockRow ? stockRow.cantidad_oficina : 0,
            cantidad_tecnicos: stockRow ? stockRow.cantidad_tecnicos : 0
        }
    })
    if (filterStockTipo.value) {
        list = list.filter(c => c.tipo === filterStockTipo.value)
    }
    if (searchStock.value) {
        const q = searchStock.value.toLowerCase()
        list = list.filter(c => c.nombre.toLowerCase().includes(q))
    }
    return list
})

const filteredActivos = computed(() => {
    let list = store.inventarioActivos
    if (searchActivo.value) {
        const query = searchActivo.value.toLowerCase()
        list = list.filter(a => 
            a.codigo_activo.toLowerCase().includes(query) || 
            a.numero_chasis.toLowerCase().includes(query) || 
            (a.marca && a.marca.toLowerCase().includes(query)) ||
            (a.modelo && a.modelo.toLowerCase().includes(query))
        )
    }
    if (filterActivosItem.value) {
        list = list.filter(a => a.id_item === filterActivosItem.value)
    }
    if (filterActivosCustodio.value) {
        list = list.filter(a => a.id_custodio === filterActivosCustodio.value)
    }
    if (filterActivosUbicacion.value) {
        list = list.filter(a => a.ubicacion_actual === filterActivosUbicacion.value)
    }
    return list
})

const selectedItemIsRepuesto = computed(() => {
    if (!movForm.id_item) return false
    const match = store.inventarioItems.find(i => i.id_item === movForm.id_item)
    return match ? match.tipo === 'Repuesto' : false
})

const pendienteDevoluciones = computed(() => {
    let list = store.inventarioMovimientos.filter(m => m.estado_devolucion === 'Pendiente devolución')
    if (searchDevolucion.value) {
        const q = searchDevolucion.value.toLowerCase()
        list = list.filter(m => 
            m.item_nombre.toLowerCase().includes(q) ||
            m.recibe_nombre.toLowerCase().includes(q) ||
            (m.activo_codigo && m.activo_codigo.toLowerCase().includes(q)) ||
            (m.activo_modelo && m.activo_modelo.toLowerCase().includes(q)) ||
            (m.observaciones && m.observaciones.toLowerCase().includes(q))
        )
    }
    return list
})

const filteredMovimientos = computed(() => {
    let list = store.inventarioMovimientos
    if (searchMovimiento.value) {
        const q = searchMovimiento.value.toLowerCase()
        list = list.filter(m => 
            m.item_nombre.toLowerCase().includes(q) ||
            (m.recibe_nombre && m.recibe_nombre.toLowerCase().includes(q)) ||
            m.tipo_movimiento.toLowerCase().includes(q) ||
            m.origen.toLowerCase().includes(q) ||
            m.destino.toLowerCase().includes(q) ||
            (m.observaciones && m.observaciones.toLowerCase().includes(q))
        )
    }
    return list
})

const calculateMaintFormTotal = computed(() => {
    return maintForm.detalles.reduce((acc, row) => acc + (row.total_bs || 0), 0)
})

// Methods
const countActivosEnUbicacion = (id_item, ubicacion) => {
    let match = store.inventarioActivos.filter(a => a.id_item === id_item)
    if (ubicacion) {
        match = match.filter(a => a.ubicacion_actual === ubicacion)
    }
    return match.length
}

const getAvailableStock = (idItem, ubicacion) => {
    const stockRow = store.inventarioConsumibles.find(c => c.id_item === idItem)
    if (!stockRow) return 0
    if (ubicacion === 'Almacén') return stockRow.cantidad_almacen
    if (ubicacion === 'Oficina') return stockRow.cantidad_oficina
    return 0
}

const onMovItemChange = () => {
    movForm.id_activo_destino = ''
}

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

const formatDateShort = (dateStr) => {
    if (!dateStr) return '---'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const calculateMantenimientoTotal = (detalles) => {
    if (!detalles) return '0.00'
    const total = detalles.reduce((acc, d) => acc + parseFloat(d.total_bs || 0), 0)
    return total.toFixed(2)
}

// Dialog openers
const openNewItemModal = () => {
    editingItem.value = null
    itemForm.nombre = ''
    itemForm.tipo = 'Consumible'
    itemForm.unidad_medida = 'Unidad'
    itemForm.descripcion = ''
    showNewItemModal.value = true
}

const openEditItem = (item) => {
    editingItem.value = item
    itemForm.nombre = item.nombre
    itemForm.tipo = item.tipo
    itemForm.unidad_medida = item.unidad_medida
    itemForm.descripcion = item.descripcion || ''
    showNewItemModal.value = true
}

const deleteItem = async (item) => {
    mostrarConfirmacion(
        'Confirmar Eliminación',
        `¿Estás seguro de que deseas eliminar el ítem "${item.nombre}" del catálogo?\nEsta acción no se puede deshacer y borrará su registro de existencias.`,
        async () => {
            const res = await mainStore.deleteInventarioItem(item.id_item)
            if (res.success) {
                showToast('Ítem del catálogo eliminado con éxito', 'success')
            } else {
                showToast(res.error, 'error')
            }
        }
    )
}

const openBulkImportModal = () => {
    bulkForm.id_item = ''
    bulkForm.cantidad = 1
    bulkForm.destino = 'Almacén'
    bulkForm.fecha_movimiento = new Date().toISOString().split('T')[0]
    bulkForm.costo_total = 0
    bulkForm.observaciones = ''
    showBulkImportModal.value = true
}

const openTransferModal = () => {
    transferForm.id_item = ''
    transferForm.cantidad = 1
    transferForm.origen = 'Almacén'
    transferForm.destino = 'Oficina'
    transferForm.observaciones = ''
    showTransferModal.value = true
}

const handlePhotoUpload = (field, e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
        activoForm[field] = event.target.result
    }
    reader.readAsDataURL(file)
}

const openNewActivoModal = () => {
    editingActivo.value = null
    Object.keys(activoForm).forEach(k => {
        activoForm[k] = ''
    })
    activoForm.estado = 'Bueno'
    activoForm.uso = 'Moderado'
    activoForm.ubicacion_actual = 'Almacén'
    activoForm.fecha_adquisicion = new Date().toISOString().split('T')[0]
    activoForm.foto_lateral_anterior = null
    activoForm.foto_lateral_actual = null
    activoForm.foto_superior_anterior = null
    activoForm.foto_superior_actual = null
    showActivoModal.value = true
}

const openEditActivo = (act) => {
    editingActivo.value = act
    Object.assign(activoForm, act)
    if (act.fecha_adquisicion) {
        activoForm.fecha_adquisicion = new Date(act.fecha_adquisicion).toISOString().split('T')[0]
    }
    showActivoModal.value = true
}

const openFichaTecnica = async (act) => {
    selectedActivo.value = act
    // Cargar repuestos del activo y mantenimientos del activo
    selectedActivoRepuestos.value = await mainStore.fetchRepuestosActivo(act.id_activo)
    selectedActivoMantenimientos.value = await mainStore.fetchMantenimientosActivo(act.id_activo)
}

const closeFicha = () => {
    selectedActivo.value = null
    selectedActivoRepuestos.value = []
    selectedActivoMantenimientos.value = []
}

const openCustodyTransferModal = (act) => {
    custodyForm.id_activo = act.id_activo
    custodyForm.activo_nombre = `${act.marca || ''} ${act.modelo || ''} (${act.item_nombre})`
    custodyForm.codigo_activo = act.codigo_activo
    custodyForm.id_custodio = act.id_custodio || ''
    custodyForm.id_usuario_operario = act.id_usuario_operario || ''
    custodyForm.ubicacion_actual = act.ubicacion_actual
    custodyForm.observaciones = ''
    showCustodyModal.value = true
}

const openMaintenanceModal = (act) => {
    maintForm.id_activo = act.id_activo
    maintForm.activo_nombre = `${act.marca || ''} ${act.modelo || ''} (${act.item_nombre})`
    maintForm.codigo_activo = act.codigo_activo
    maintForm.fecha_mantenimiento = new Date().toISOString().split('T')[0]
    maintForm.observaciones = ''
    maintForm.detalles = []
    showMaintenanceModal.value = true
}

const triggerPrint = () => {
    isPrinting.value = true
    setTimeout(() => {
        window.print()
        isPrinting.value = false
    }, 150)
}

// Mantenimiento dynamic rows
const addMaintDetailRow = () => {
    maintForm.detalles.push({
        numero_item: maintForm.detalles.length + 1,
        detalle: '',
        unidad: 'Unidad',
        cantidad: 1,
        precio_unitario: 0,
        total_bs: 0
    })
}

const removeMaintDetailRow = (index) => {
    maintForm.detalles.splice(index, 1)
    maintForm.detalles.forEach((d, idx) => {
        d.numero_item = idx + 1
    })
}

const updateMaintRowTotal = (index) => {
    const row = maintForm.detalles[index]
    const qty = parseInt(row.cantidad) || 0
    const price = parseFloat(row.precio_unitario) || 0
    row.total_bs = qty * price
}

const submitNewItem = async () => {
    if (itemForm.nombre) itemForm.nombre = capitalizeFirstLetter(itemForm.nombre)
    if (itemForm.unidad_medida) itemForm.unidad_medida = capitalizeFirstLetter(itemForm.unidad_medida)
    if (itemForm.descripcion) itemForm.descripcion = capitalizeFirstLetter(itemForm.descripcion)

    let res
    if (editingItem.value) {
        res = await mainStore.updateInventarioItem(editingItem.value.id_item, itemForm)
    } else {
        res = await mainStore.addInventarioItem(itemForm)
    }
    if (res.success) {
        showToast(editingItem.value ? 'Ítem de catálogo actualizado con éxito' : 'Ítem de catálogo registrado con éxito', 'success')
        showNewItemModal.value = false
    } else {
        showToast(res.error, 'error')
    }
}

const submitBulkImport = async () => {
    if (bulkForm.observaciones) bulkForm.observaciones = capitalizeFirstLetter(bulkForm.observaciones)
    const mov = {
        id_item: bulkForm.id_item,
        cantidad: bulkForm.cantidad,
        tipo_movimiento: 'Ingreso',
        origen: 'Proveedor',
        destino: bulkForm.destino,
        fecha_movimiento: bulkForm.fecha_movimiento,
        observaciones: `Carga Lote Compra (Costo: ${bulkForm.costo_total} Bs). ${bulkForm.observaciones}`
    }
    
    const res = await mainStore.addInventarioMovimiento(mov)
    if (res.success) {
        showToast('Lote de compra ingresado correctamente', 'success')
        showBulkImportModal.value = false
    } else {
        showToast(res.error, 'error')
    }
}

const submitTransfer = async () => {
    if (transferForm.origen === transferForm.destino) {
        showToast('El origen y el destino no pueden ser los mismos', 'error')
        return
    }
    const avail = getAvailableStock(transferForm.id_item, transferForm.origen)
    if (avail < transferForm.cantidad) {
        showToast(`Stock insuficiente en ${transferForm.origen}. Disponible: ${avail}`, 'error')
        return
    }

    if (transferForm.observaciones) transferForm.observaciones = capitalizeFirstLetter(transferForm.observaciones)
    const mov = {
        id_item: transferForm.id_item,
        cantidad: transferForm.cantidad,
        tipo_movimiento: 'Traslado',
        origen: transferForm.origen,
        destino: transferForm.destino,
        fecha_movimiento: new Date().toISOString().split('T')[0],
        observaciones: transferForm.observaciones || 'Traslado de stock interno'
    }

    const res = await mainStore.addInventarioMovimiento(mov)
    if (res.success) {
        showToast('Traslado de stock completado', 'success')
        showTransferModal.value = false
    } else {
        showToast(res.error, 'error')
    }
}

const submitActivo = async () => {
    if (isSavingActivo.value) return
    isSavingActivo.value = true
    try {
        const stringFields = [
            'marca', 'modelo', 'procedencia', 'capacidad', 'potencia_hp',
            'cilindrada_cm3', 'motor', 'peso_kg', 'longitud_espada', 'cadena',
            'paso_cadena', 'observaciones', 'codigo_activo', 'numero_chasis'
        ]
        stringFields.forEach(field => {
            if (activoForm[field]) {
                activoForm[field] = capitalizeFirstLetter(activoForm[field])
            }
        })

        let res
        if (editingActivo.value) {
            res = await mainStore.updateInventarioActivo(editingActivo.value.id_activo, activoForm)
        } else {
            res = await mainStore.addInventarioActivo(activoForm)
        }

        if (res.success) {
            showToast('Ficha técnica de activo guardada', 'success')
            showActivoModal.value = false
            if (selectedActivo.value && selectedActivo.value.id_activo === editingActivo.value?.id_activo) {
                // Recargar ficha activa
                const updated = store.inventarioActivos.find(a => a.id_activo === selectedActivo.value.id_activo)
                if (updated) selectedActivo.value = updated
            }
        } else {
            showToast(res.error, 'error')
        }
    } finally {
        isSavingActivo.value = false
    }
}

const submitCustodyTransfer = async () => {
    if (custodyForm.observaciones) {
        custodyForm.observaciones = capitalizeFirstLetter(custodyForm.observaciones)
    }
    // 1. Modificar ubicacion y custodios del activo
    const act = store.inventarioActivos.find(a => a.id_activo === custodyForm.id_activo)
    if (!act) return

    const updatePayload = {
        ...act,
        id_custodio: custodyForm.id_custodio || null,
        id_usuario_operario: custodyForm.id_usuario_operario || null,
        ubicacion_actual: custodyForm.ubicacion_actual
    }

    const resAct = await mainStore.updateInventarioActivo(custodyForm.id_activo, updatePayload)
    if (resAct.success) {
        // 2. Registrar movimiento en bitacora
        const mov = {
            id_item: act.id_item,
            cantidad: 1,
            tipo_movimiento: 'Traslado',
            origen: act.ubicacion_actual,
            destino: custodyForm.ubicacion_actual,
            id_recibe: custodyForm.id_custodio || null,
            id_activo_destino: act.id_activo,
            fecha_movimiento: new Date().toISOString().split('T')[0],
            observaciones: `Transferencia de Custodia/Traslado. Motivo: ${custodyForm.observaciones || 'Reasignación ordinaria'}`
        }
        await mainStore.addInventarioMovimiento(mov)
        
        showToast('Custodia de activo reasignada con éxito', 'success')
        showCustodyModal.value = false
        // Recargar ficha activa
        const updated = store.inventarioActivos.find(a => a.id_activo === selectedActivo.value.id_activo)
        if (updated) {
            selectedActivo.value = updated
            selectedActivoRepuestos.value = await mainStore.fetchRepuestosActivo(updated.id_activo)
        }
    } else {
        showToast(resAct.error, 'error')
    }
}

const submitMaintenance = async () => {
    if (maintForm.observaciones) maintForm.observaciones = capitalizeFirstLetter(maintForm.observaciones)
    if (maintForm.detalles) {
        maintForm.detalles.forEach(d => {
            if (d.detalle) d.detalle = capitalizeFirstLetter(d.detalle)
        })
    }
    const res = await mainStore.addMantenimientoActivo(maintForm)
    if (res.success) {
        showToast('Mantenimiento anual oficial registrado con éxito', 'success')
        showMaintenanceModal.value = false
        if (selectedActivo.value) {
            selectedActivoMantenimientos.value = await mainStore.fetchMantenimientosActivo(selectedActivo.value.id_activo)
        }
    } else {
        showToast(res.error, 'error')
    }
}

const submitMovimiento = async () => {
    if (!movForm.id_item) return
    if (movForm.observaciones) movForm.observaciones = capitalizeFirstLetter(movForm.observaciones)
    
    const avail = getAvailableStock(movForm.id_item, movForm.origen)
    if (avail < movForm.cantidad) {
        showToast(`Stock insuficiente en ${movForm.origen}. Disponible: ${avail}`, 'error')
        return
    }

    const res = await mainStore.addInventarioMovimiento(movForm)
    if (res.success) {
        showToast('Entrega a personal registrada con éxito', 'success')
        // Reset form
        movForm.id_item = ''
        movForm.cantidad = 1
        movForm.id_recibe = ''
        movForm.id_activo_destino = ''
        movForm.observaciones = ''
    } else {
        showToast(res.error, 'error')
    }
}

const marcarDevolucionPieza = async (idMovimiento, nuevoEstado) => {
    const res = await mainStore.updateEstadoDevolucion(idMovimiento, {
        estado_devolucion: nuevoEstado,
        fecha_devolucion: new Date().toISOString().split('T')[0]
    })
    if (res.success) {
        showToast(`Estado de devolución actualizado a: ${nuevoEstado}`, 'success')
        if (selectedActivo.value) {
            selectedActivoRepuestos.value = await mainStore.fetchRepuestosActivo(selectedActivo.value.id_activo)
        }
    } else {
        showToast('Error al actualizar devolución', 'error')
    }
}

// Watchers
watch(() => bulkForm.id_item, (newItemId) => {
    if (newItemId) {
        const item = store.inventarioItems.find(i => i.id_item === newItemId)
        if (item) {
            bulkForm.observaciones = `Abastecimiento de lote de ${item.nombre}.`
        }
    }
})

watch(() => transferForm.id_item, (newItemId) => {
    if (newItemId) {
        const item = store.inventarioItems.find(i => i.id_item === newItemId)
        if (item) {
            transferForm.observaciones = `Traslado de ${item.nombre} por reajuste de stock.`
        }
    }
})

// Auxiliar para capitalizar el primer carácter de campos reactivos de texto en tiempo real sin perder foco de escritura
const watchCapitalize = (reactiveObj, key) => {
    watch(() => reactiveObj[key], (val) => {
        if (val && typeof val === 'string' && val.length > 0) {
            const firstChar = val.charAt(0);
            if (firstChar !== firstChar.toUpperCase()) {
                reactiveObj[key] = firstChar.toUpperCase() + val.slice(1);
            }
        }
    });
};

// Watchers para itemForm (Crear/Editar Ítem Catálogo)
watchCapitalize(itemForm, 'nombre');
watchCapitalize(itemForm, 'unidad_medida');
watchCapitalize(itemForm, 'descripcion');

// Watchers para bulkForm (Lotes de Compra/Ingresos)
watchCapitalize(bulkForm, 'observaciones');

// Watchers para transferForm (Traslado de Stock Interno)
watchCapitalize(transferForm, 'observaciones');

// Watchers para movForm (Asignar / Entregar Ítem)
watchCapitalize(movForm, 'observaciones');

// Watchers para custodyForm (Transferir Custodia / Operario)
watchCapitalize(custodyForm, 'observaciones');

// Watchers para maintForm (Mantenimiento Oficial)
watchCapitalize(maintForm, 'observaciones');

// Watcher profundo para grilla de detalles de mantenimiento (repuestos/servicios dinámicos)
watch(() => maintForm.detalles, (detalles) => {
    if (detalles && Array.isArray(detalles)) {
        detalles.forEach((det) => {
            if (det.detalle && typeof det.detalle === 'string' && det.detalle.length > 0) {
                const firstChar = det.detalle.charAt(0);
                if (firstChar !== firstChar.toUpperCase()) {
                    det.detalle = firstChar.toUpperCase() + det.detalle.slice(1);
                }
            }
            if (det.unidad && typeof det.unidad === 'string' && det.unidad.length > 0) {
                const firstChar = det.unidad.charAt(0);
                if (firstChar !== firstChar.toUpperCase()) {
                    det.unidad = firstChar.toUpperCase() + det.unidad.slice(1);
                }
            }
        });
    }
}, { deep: true });

// Watchers para activoForm (Registrar/Editar Ficha Técnica de Activo)
watchCapitalize(activoForm, 'marca');
watchCapitalize(activoForm, 'modelo');
watchCapitalize(activoForm, 'procedencia');
watchCapitalize(activoForm, 'capacidad');
watchCapitalize(activoForm, 'potencia_hp');
watchCapitalize(activoForm, 'cilindrada_cm3');
watchCapitalize(activoForm, 'motor');
watchCapitalize(activoForm, 'peso_kg');
watchCapitalize(activoForm, 'longitud_espada');
watchCapitalize(activoForm, 'cadena');
watchCapitalize(activoForm, 'paso_cadena');
watchCapitalize(activoForm, 'numero_chasis');
watchCapitalize(activoForm, 'codigo_activo');
watchCapitalize(activoForm, 'observaciones');

</script>

<style scoped>
@reference "tailwindcss";

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-prime-in {
    animation: primePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes primePop {
    from { opacity: 0; transform: scale(0.98) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.label-prime {
    @apply text-xs font-black mb-1.5 ml-1 flex items-center gap-1 uppercase tracking-wider;
    color: var(--text-main);
}

.form-input-prime {
    @apply w-full px-4 py-2.5 rounded-xl text-xs font-bold 
           outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-sm;
    background-color: var(--input-bg) !important;
    border: 2px solid var(--border) !important;
    color: var(--text-main) !important;
}

.excel-ficha {
    font-family: Arial, Helvetica, sans-serif;
    background-color: #ffffff !important;
    color: #0f172a !important;
}

.excel-ficha th {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
    border-color: #0f172a !important;
}

.excel-ficha td {
    color: #0f172a !important;
    border-color: #0f172a !important;
}

.excel-ficha tr {
    background-color: #ffffff !important;
}

.excel-ficha tr:nth-child(even) {
    background-color: #f8fafc !important;
}

.excel-ficha tr:hover td {
    background-color: #e2e8f0 !important;
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

.fade-confirm-enter-active, .fade-confirm-leave-active { transition: opacity 0.2s ease; }
.fade-confirm-enter-from, .fade-confirm-leave-to { opacity: 0; }

.print-only-block { display: none; }

/* Impresion */
@media print {
    .no-print { display: none !important; }
    .print-only-block { display: block !important; }

    .print-table {
        color: #000000 !important;
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 0 !important;
    }
    .print-table th, .print-table td {
        border: 1px solid #000000 !important;
        padding: 8px !important;
        color: #000000 !important;
        background: transparent !important;
    }
    .print-table .badge {
        border: none !important;
        background: transparent !important;
        color: #000000 !important;
        padding: 0 !important;
        font-weight: bold !important;
    }
    
    .inventario-view {
        padding: 0 !important;
        margin: 0 !important;
    }

    .print-ficha-wrapper {
        border: none !important;
        box-shadow: none !important;
        background: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        z-index: 9999999 !important;
    }
    
    .excel-ficha {
        border: 2px solid #000000 !important;
        padding: 10px !important;
        color: #000000 !important;
    }
    
    .excel-ficha h1, .excel-ficha h2, .excel-ficha h3 {
        color: #000000 !important;
    }
    
    .excel-ficha th {
        background-color: #f1f5f9 !important;
        color: #000000 !important;
        border: 1px solid #000000 !important;
        padding: 6px !important;
    }
    
    .excel-ficha td {
        border: 1px solid #000000 !important;
        padding: 6px !important;
        color: #000000 !important;
    }
    
    .excel-ficha .bg-slate-50 {
        background-color: #fafafa !important;
    }
    
    .excel-ficha .bg-slate-100 {
        background-color: #f1f5f9 !important;
    }

    .excel-ficha .divide-slate-900 > * {
        border-color: #000000 !important;
    }
}
</style>

<style>
@media print {
    /* Estilos específicos para la impresión masiva de inventarios */
    .bulk-print-layout {
        display: block !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif !important;
        font-size: 8.5pt !important;
    }

    .bulk-print-layout table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-top: 10pt !important;
        margin-bottom: 15pt !important;
        background: #ffffff !important;
        color: #000000 !important;
    }

    .bulk-print-layout th, .bulk-print-layout td {
        border: 1px solid #000000 !important;
        padding: 6pt 8pt !important;
        font-size: 8pt !important;
        color: #000000 !important;
        background: #ffffff !important;
    }

    .bulk-print-layout th {
        background-color: #f3f4f6 !important;
        color: #000000 !important;
        font-weight: bold !important;
    }

    .bulk-print-layout .print-header {
        border-bottom: 2pt solid #15803d !important; /* verde-800 */
        margin-bottom: 12pt !important;
        padding-bottom: 8pt !important;
    }

    .bulk-print-layout .print-header img {
        height: 55pt !important;
        width: 55pt !important;
    }

    .bulk-print-layout .print-firmas {
        display: block !important;
        margin-top: 30pt !important;
        page-break-inside: avoid !important;
    }

    .bulk-print-layout .print-firmas-row {
        display: flex !important;
        justify-content: space-around !important;
        margin-top: 20pt !important;
    }

    .bulk-print-layout .print-firma {
        text-align: center !important;
        width: 150pt !important;
    }

    .bulk-print-layout .print-firma-linea {
        width: 100% !important;
        border-bottom: 0.8pt solid #000000 !important;
        margin: 0 auto 5pt !important;
        height: 40pt !important;
    }

    .bulk-print-layout .print-firma-nombre {
        font-size: 8pt !important;
        font-weight: 800 !important;
        margin: 0 !important;
        color: #000000 !important;
    }

    .bulk-print-layout .print-firma-cargo {
        font-size: 7.5pt !important;
        color: #374151 !important; /* gray-700 */
        margin: 1pt 0 0 !important;
        text-transform: uppercase !important;
    }
}
</style>
