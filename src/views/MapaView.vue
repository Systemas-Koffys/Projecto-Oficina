<template>
  <div class="h-full flex flex-col gap-6">
    <!-- Panel de Filtros Map -->
    <div class="card p-6 flex flex-col gap-5 no-print relative z-10">
      <!-- Fila Superior: Título y Estadísticas Rápidas -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-accent/10 rounded-2xl">
            <MapPin class="text-accent" size="24" />
          </div>
          <div>
            <h3 class="font-black text-lg text-main">Visor Geográfico</h3>
            <p class="text-xs text-muted font-bold uppercase tracking-widest">Monitoreo territorial de solicitudes</p>
          </div>
        </div>
        
        <div class="flex gap-3 items-center">
          <!-- Selector de Capas Premium -->
          <div class="flex bg-card-main p-1 rounded-xl border border-main shadow-sm mr-2 hidden md:flex">
            <button 
              v-for="layer in layers" 
              :key="layer.id"
              @click="setLayer(layer.id)"
              class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all"
              :class="currentLayer === layer.id ? 'bg-accent text-[color:var(--text-on-accent)] shadow-md' : 'text-muted hover:bg-accent/10'"
            >
              {{ layer.name }}
            </button>
          </div>

          <div class="bg-card-main px-4 py-2 rounded-xl border border-main flex items-center gap-3 shadow-sm">
            <span class="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></span>
            <span class="text-xs font-black text-main">{{ stats.pendientes }} Pend.</span>
          </div>
          <div class="bg-card-main px-4 py-2 rounded-xl border border-main flex items-center gap-3 shadow-sm">
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            <span class="text-xs font-black text-main">{{ stats.ejecutadas }} Ejec.</span>
          </div>
          
          <!-- Botón Limpiar (Premium) -->
          <button 
            v-if="mostrarFiltros" 
            @click="limpiarFiltros" 
            class="bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm active:scale-95 hover:-translate-y-0.5"
          >
            <X class="w-4 h-4" /> Limpiar
          </button>

          <button @click="mostrarFiltros = !mostrarFiltros" class="bg-accent hover:bg-accent-hover text-[color:var(--text-on-accent)] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg active:scale-95 ml-2">
            <Filter class="w-4 h-4" /> Filtros
          </button>
        </div>
      </div>

      <!-- Fila Inferior: Filtros (Ocultable) -->
      <div v-if="mostrarFiltros" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-main animate-prime-in">
        <!-- Select: Estado -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Estado del Trámite</label>
          <select v-model="filtros.estado" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
            <option value="todos">Todos los Estados</option>
            <option value="Pendiente">Solo Pendientes</option>
            <option value="Terminado">Solo Ejecutados</option>
          </select>
        </div>
        <!-- Select: Distrito -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Distrito</label>
          <select v-model="filtros.distrito" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
            <option value="todos">Todos los Distritos</option>
            <option v-for="d in store.distritos" :key="d.id" :value="d.id">{{ d.nombre }}</option>
          </select>
        </div>
        <!-- Select: Barrio -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Barrio / Zona</label>
          <select v-model="filtros.barrio" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
            <option value="todos">Todos los Barrios</option>
            <option v-for="b in store.barrios.filter(b => filtros.distrito === 'todos' || b.id_distrito == filtros.distrito)" :key="b.id" :value="b.id">{{ b.nombre }}</option>
          </select>
        </div>
        <!-- Select: Acción Técnica -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Acción Técnica</label>
          <select v-model="filtros.accion" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
            <option value="todos">Cualquier Acción</option>
            <option v-for="a in store.acciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
          </select>
        </div>
        <!-- Select: Condición Especial -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Condición Especial</label>
          <select v-model="filtros.setar" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
            <option value="todos">Sin Filtro Especial</option>
            <option value="setar">⚡ Requiere Corte SETAR</option>
            <option value="plataforma">🏗️ Requiere Grúa/Plataforma</option>
            <option value="ficha_tecnica">📋 Requiere Ficha Técnica</option>
            <option value="arbol_seco">🌵 Es Árbol Seco</option>
            <option value="segunda_nota">✉️ Tiene Segunda Nota</option>
            <option value="procede">✅ Trabajo Procedente</option>
          </select>
        </div>
        <!-- Select: Prioridad -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Nivel de Urgencia</label>
          <select v-model="filtros.prioridad" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer">
            <option value="todos">Todas las Prioridades</option>
            <option value="Alta">🔴 Prioridad Alta / Emergencia</option>
            <option value="Intermedia">🟡 Prioridad Intermedia</option>
            <option value="Baja">🟢 Prioridad Baja (Normal)</option>
          </select>
        </div>
        <!-- Select: Fechas (Rango) -->
        <div class="flex flex-col gap-1.5 col-span-2">
          <label class="text-[9px] font-black uppercase tracking-widest text-muted ml-1">Rango de Fechas (Ingreso)</label>
          <div class="flex items-center gap-2">
            <input type="date" v-model="filtros.fecha_inicio" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer w-full" />
            <span class="text-muted font-bold text-xs">a</span>
            <input type="date" v-model="filtros.fecha_fin" class="bg-card-sec border border-main rounded-xl px-3 py-2.5 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer w-full" />
          </div>
        </div>
      </div>
    </div>

    <!-- Contenedor del Mapa -->
    <div class="flex-1 card overflow-hidden relative border-none shadow-2xl">
      <div id="map" class="absolute inset-0 z-0"></div>
      
      <!-- Overlay de información rápida -->
      <div class="absolute bottom-6 left-6 z-[1000] bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white shadow-2xl max-w-xs">
        <p class="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Consejo Técnico</p>
        <p class="text-xs leading-relaxed opacity-80">
          Haz clic en cualquier marcador para ver los detalles. Cambia la vista del mapa para ver el terreno real.
        </p>
      </div>
    </div>

    <!-- Modal de Detalles (Reporte) -->
    <Teleport to="body">
      <div v-if="solicitudSeleccionada" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] print:absolute print:inset-auto print:block print:bg-white print:p-0 print:m-0 print:overflow-visible">
        <div class="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative print-area print:max-h-none print:overflow-visible print:shadow-none print:rounded-none">

          <!-- ===== CABECERA FORMAL PARA IMPRESIÓN (A4) ===== -->
          <div class="hidden print:block print-header">
            <div class="print-institution flex items-center gap-6 border-b-2 border-black pb-4 mb-4">
              <div class="w-24 h-24 flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                <img v-if="uiState?.logo_institucional" :src="uiState.logo_institucional" class="w-full h-full object-contain">
                <div v-else class="text-[8px] font-black text-center text-gray-400 p-1 uppercase">
                  Logo <br> Municipal
                </div>
              </div>
              <div class="print-institution-text flex-1 text-center">
                <p class="print-gov font-black text-lg">Gobierno Autónomo Municipal de Tarija</p>
                <p class="print-sec font-bold text-sm">DIRECCION DE OBRAS PUBLICAS MUNICIPALES</p>
                <p class="print-unit text-sm font-medium">Unidad de Arboricultura y Espacios Verdes</p>
              </div>
            </div>
            <div class="print-doc-title text-center">
              <h1 class="mb-2">REPORTE TÉCNICO DE SOLICITUD</h1>
              <div class="print-doc-meta flex justify-center items-center gap-3 text-[10px] font-medium text-gray-700">
                <span>Cod: <strong>{{ solicitudSeleccionada.comunicacion_interna || `#${solicitudSeleccionada.id_solicitud}` }}</strong></span>
                <span class="text-gray-300">|</span>
                <span>Estado: <strong>{{ solicitudSeleccionada.estado_tramite || 'En espera' }}</strong></span>
                <span class="text-gray-300">|</span>
                <span>Urgencia: <strong>{{ solicitudSeleccionada.es_emergencia ? 'EMERGENCIA' : (solicitudSeleccionada.nivel_urgencia || 'Normal') }}</strong></span>
                <span class="text-gray-300">|</span>
                <span>Emisión: <strong>{{ new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }) }} ({{ new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }})</strong></span>
              </div>
            </div>
          </div>

          <!-- Header de la tarjeta -->
          <div class="no-print rounded-t-2xl px-6 py-5 flex justify-between items-center" style="background: linear-gradient(135deg, #1a4731, #2d6a4f);">
            <div>
              <p class="text-green-200 text-xs font-semibold uppercase tracking-widest mb-1">Trámite de Arboricultura</p>
              <h2 class="text-white text-xl font-bold">{{ solicitudSeleccionada.comunicacion_interna || `#${solicitudSeleccionada.id_solicitud}` }}</h2>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
                  :class="solicitudSeleccionada.estado_tramite === 'Terminado' ? 'bg-emerald-400 text-emerald-900' : 'bg-yellow-300 text-yellow-900'">
                  {{ solicitudSeleccionada.estado_tramite || 'En espera' }}
                </span>
              </div>
              <!-- Fila de insignias de requerimientos -->
              <div class="flex flex-wrap gap-2 mt-4">
                <!-- 1. BADGE DE PRIORIDAD CONSOLIDADO -->
                <span v-if="solicitudSeleccionada.es_emergencia || solicitudSeleccionada.nivel_urgencia === 'Alta' || solicitudSeleccionada.es_urgencia"
                  class="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black bg-red-600 text-white shadow-lg shadow-red-900/20 border border-white/20 animate-pulse">
                  🚨 PRIORIDAD CRÍTICA / EMERGENCIA
                </span>
                <span v-else-if="solicitudSeleccionada.nivel_urgencia === 'Intermedia'"
                  class="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black bg-amber-500 text-white shadow-lg shadow-amber-900/20 border border-white/20">
                  ⚠️ PRIORIDAD MEDIA
                </span>
                <span v-else
                  class="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 border border-white/20">
                  ✅ PRIORIDAD NORMAL
                </span>

                <!-- 2. OTROS REQUERIMIENTOS LOGÍSTICOS -->
                <span v-if="solicitudSeleccionada.procede"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                  🌲 PROCEDE TRABAJO
                </span>
                <span v-if="solicitudSeleccionada.requiere_plataforma"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                  🏗️ GRÚA/PLATAFORMA
                </span>
                <span v-if="solicitudSeleccionada.requiere_setar"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-orange-100 text-orange-700 border border-orange-200">
                  ⚡ CORTE SETAR
                </span>
                <span v-if="solicitudSeleccionada.requiere_ficha_tecnica"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200">
                  📋 FICHA TÉCNICA
                </span>
                <span v-if="solicitudSeleccionada.arbol_seco"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200">
                  🌵 ÁRBOL SECO
                </span>
                <span v-if="solicitudSeleccionada.segunda_nota"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                  ✉️ SEGUNDA NOTA
                </span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button @click="imprimirReporte" class="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-white/10">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Imprimir
              </button>
              <button @click="solicitudSeleccionada = null" class="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-xl flex items-center justify-center text-2xl leading-none transition-all border border-white/10">&times;</button>
            </div>
          </div>

          <!-- Cuerpo de la tarjeta (5 SECCIONES FORMALES) -->
          <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white overflow-y-auto max-h-[70vh] custom-scrollbar">

            <!-- SECCIÓN 01: Información de Ingreso (AZUL) -->
            <div class="md:col-span-2 bg-blue-50/60 border border-blue-100 rounded-2xl p-6 shadow-sm">
              <h4 class="flex items-center gap-2 text-[11px] font-black text-blue-800 uppercase tracking-[0.2em] mb-4 border-b border-blue-200 pb-2">
                <span class="w-2 h-2 bg-blue-500 rounded-full"></span> 01. Información de Ingreso
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-10 text-sm">
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Fecha de Ingreso</span>
                  <span class="font-bold text-gray-800">{{ formatFecha(solicitudSeleccionada.fecha_ingreso) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Comunicación Interna</span>
                  <span class="font-black text-blue-900 bg-white/80 px-2 py-0.5 rounded border border-blue-100 w-fit">{{ solicitudSeleccionada.comunicacion_interna || 'S/N' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Acción Solicitada</span>
                  <span class="font-bold text-gray-800">{{ getAccion(solicitudSeleccionada.id_accion_solicitada) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Nombre del Solicitante</span>
                  <span class="font-bold text-gray-800">{{ solicitudSeleccionada.solicitante_nombre }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Teléfono</span>
                  <span class="font-bold text-gray-800">{{ solicitudSeleccionada.solicitante_telefono || '—' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Tipo de Institución</span>
                  <span class="font-bold text-gray-800">{{ getTipoInstitucion(solicitudSeleccionada.id_tipo_institucion) }}</span>
                </div>
                <div class="md:col-span-3 flex flex-col border-t border-blue-100/50 pt-2">
                  <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Nombre de Institución</span>
                  <span class="font-bold text-gray-800 uppercase text-xs">{{ getInstitucion(solicitudSeleccionada.id_nombre_institucional) }}</span>
                </div>
                <div class="md:col-span-3 bg-white/80 p-4 rounded-xl border border-blue-100">
                  <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 block">Nota de Solicitud / Descripción</span>
                  <p class="text-gray-700 italic leading-relaxed font-medium">"{{ solicitudSeleccionada.solicitante_descripcion || 'Sin descripción adicional.' }}"</p>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 02: Localización (VERDE) -->
            <div class="md:col-span-2 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-6 shadow-sm">
              <h4 class="flex items-center gap-2 text-[11px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-4 border-b border-emerald-200 pb-2">
                <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> 02. Localización y Referencia
              </h4>
              <div class="space-y-4 text-sm">
                <div class="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                  <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Distrito Municipal</span>
                  <span class="font-bold text-gray-800">{{ getDistritoByBarrio(solicitudSeleccionada.id_barrio) }}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                  <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Barrio / Zona</span>
                  <span class="font-bold text-gray-800 text-right">{{ getBarrio(solicitudSeleccionada.id_barrio) }}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                  <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Calle / Avenida</span>
                  <span class="font-bold text-gray-800 text-right">{{ solicitudSeleccionada.calle }} {{ solicitudSeleccionada.numero_casa ? 'Nº '+solicitudSeleccionada.numero_casa : '' }}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                  <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Coordenadas GPS</span>
                  <span class="text-right">
                    <a v-if="solicitudSeleccionada.lat && solicitudSeleccionada.lng" 
                       :href="`https://www.google.com/maps?q=${solicitudSeleccionada.lat},${solicitudSeleccionada.lng}`" 
                       target="_blank" 
                       class="text-blue-600 underline font-bold hover:text-blue-800 transition-colors">
                      {{ solicitudSeleccionada.lat }}, {{ solicitudSeleccionada.lng }}
                    </a>
                    <span v-else class="text-gray-400 italic font-medium">No registrado</span>
                  </span>
                </div>
                <div class="flex flex-col pt-1">
                  <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Punto de Referencia Exacto</span>
                  <span class="font-bold text-gray-700 bg-white/80 p-3 rounded-lg border border-emerald-100">{{ solicitudSeleccionada.referencia || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 03: Diagnóstico y Lista de Árboles (GRIS) -->
            <div class="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 class="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2">
                <span class="w-2 h-2 bg-slate-600 rounded-full"></span> 03. Diagnóstico Técnico y Detalle de Árboles
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-4">
                <div class="flex justify-between items-center pb-2 border-b border-slate-200/50">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Técnico Evaluador</span>
                  <span class="font-bold text-gray-800">{{ getTecnico(solicitudSeleccionada.id_tecnico_verificacion) }}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-slate-200/50">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Verificación</span>
                  <span class="font-bold text-gray-800">{{ formatFecha(solicitudSeleccionada.fecha_verificacion) }}</span>
                </div>
              </div>

              <!-- Tabla de Árboles Relacionados -->
              <div class="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                      <th class="py-2 px-3">#</th>
                      <th class="py-2 px-3">Especie</th>
                      <th class="py-2 px-3">Acción Solicitada</th>
                      <th class="py-2 px-3">Acción a Realizar (Inspección)</th>
                      <th class="py-2 px-3">Observaciones del Árbol</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(arb, idx) in solicitudSeleccionada.arboles" :key="idx" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td class="py-2.5 px-3 font-bold text-slate-500">{{ idx + 1 }}</td>
                      <td class="py-2.5 px-3 font-black text-emerald-800">{{ getEspecie(arb.id_especie) }}</td>
                      <td class="py-2.5 px-3 text-slate-700">{{ getAccion(arb.id_accion_solicitada) }}</td>
                      <td class="py-2.5 px-3 font-bold text-slate-800">{{ getAccion(arb.id_accion_realizar) }}</td>
                      <td class="py-2.5 px-3 text-slate-500 italic">{{ arb.observaciones_arbol || 'Sin observaciones.' }}</td>
                    </tr>
                    <tr v-if="!solicitudSeleccionada.arboles || solicitudSeleccionada.arboles.length === 0">
                      <td colspan="5" class="py-3 text-center text-slate-400 font-medium">Ningún árbol registrado.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex flex-col pt-1">
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Informe de Verificación General</span>
                <span class="font-medium text-gray-700 italic bg-white/80 p-3 rounded-lg border border-slate-200">"{{ solicitudSeleccionada.observacion_verificacion || 'Sin observaciones técnicas generales registradas.' }}"</span>
              </div>
            </div>

            <!-- SECCIÓN 04: Logística y Requerimientos (ÁMBAR) -->
            <div class="md:col-span-2 bg-amber-50/60 border border-amber-200 rounded-2xl p-6 shadow-sm">
              <h4 class="flex items-center gap-2 text-[11px] font-black text-amber-800 uppercase tracking-[0.2em] mb-4 border-b border-amber-200 pb-2">
                <span class="w-2 h-2 bg-amber-500 rounded-full"></span> 04. Apoyo Logístico y Alertas
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                  <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">🏗️ ¿Requiere Grúa / Plataforma?</span>
                  <span class="font-black" :class="solicitudSeleccionada.requiere_plataforma ? 'text-blue-600' : 'text-gray-400'">{{ solicitudSeleccionada.requiere_plataforma ? 'SÍ' : 'NO' }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                  <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">⚡ ¿Requiere Corte SETAR?</span>
                  <span class="font-black" :class="solicitudSeleccionada.requiere_setar ? 'text-orange-600' : 'text-gray-400'">{{ solicitudSeleccionada.requiere_setar ? 'SÍ' : 'NO' }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                  <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">📄 ¿Requiere Ficha Técnica?</span>
                  <span class="font-black" :class="solicitudSeleccionada.requiere_ficha_tecnica ? 'text-indigo-600' : 'text-gray-400'">{{ solicitudSeleccionada.requiere_ficha_tecnica ? 'SÍ' : 'NO' }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                  <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">🌵 ¿Es Árbol Seco?</span>
                  <span class="font-black" :class="solicitudSeleccionada.arbol_seco ? 'text-amber-700' : 'text-gray-400'">{{ solicitudSeleccionada.arbol_seco ? 'SÍ' : 'NO' }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                  <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">🚨 ¿Es Emergencia / Urgencia?</span>
                  <span class="font-black" :class="solicitudSeleccionada.es_emergencia || solicitudSeleccionada.es_urgencia ? 'text-red-600' : 'text-gray-400'">{{ (solicitudSeleccionada.es_emergencia || solicitudSeleccionada.es_urgencia) ? 'SÍ' : 'NO' }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-amber-100/50">
                  <span class="font-bold text-amber-800 uppercase tracking-tighter flex items-center gap-2">✅ ¿Procede Trabajo?</span>
                  <span class="font-black" :class="solicitudSeleccionada.procede ? 'text-emerald-600' : 'text-gray-400'">{{ solicitudSeleccionada.procede ? 'SÍ' : 'NO' }}</span>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 05: Cierre de Trámite (PÚRPURA) -->
            <div id="print-seccion-5" class="md:col-span-2 bg-purple-50/60 border border-purple-200 rounded-2xl p-6 shadow-sm">
              <h4 class="flex items-center gap-2 text-[11px] font-black text-purple-900 uppercase tracking-[0.2em] mb-4 border-b border-purple-200 pb-2">
                <span class="w-2 h-2 bg-purple-500 rounded-full"></span> 05. Ejecución y Cierre Final
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Estado Administrativo</span>
                  <span class="font-black uppercase text-xl" :class="solicitudSeleccionada.estado_tramite === 'Terminado' ? 'text-emerald-600' : 'text-purple-600'">
                    {{ solicitudSeleccionada.estado_tramite }}
                  </span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Encargado de Ejecución</span>
                  <span class="font-bold text-gray-800 uppercase text-xs">{{ getTecnico(solicitudSeleccionada.id_tecnico_ejecucion) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Fecha de Finalización</span>
                  <span class="font-bold text-gray-800">{{ formatFecha(solicitudSeleccionada.fecha_ejecucion) }}</span>
                </div>
                <div class="md:col-span-3 bg-white/80 p-4 rounded-xl border border-purple-100">
                  <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2 block">Reporte Final de Obra</span>
                  <p class="text-gray-700 font-semibold leading-relaxed">"{{ solicitudSeleccionada.observaciones_finales || 'Expediente sin reporte de cierre final.' }}"</p>
                </div>
              </div>
            </div>

          </div>

          <!-- Firmas para Impresión -->
          <div class="hidden print:block print-firmas">
            <!-- Nota de Descargo Formal -->
            <div class="border-t border-b border-gray-300 py-3 mb-6">
              <p class="text-[9px] text-gray-600 italic text-center leading-tight">
                "<strong>IMPORTANTE:</strong> Este documento es un reporte técnico formal con respaldo íntegro en la base de datos municipal del Sistema de Arboricultura. 
                Se ruega verificar la exactitud de todos los datos y referencias técnicas antes de proceder con la firma de conformidad correspondiente."
              </p>
            </div>

            <!-- Linea de firmas -->
            <div class="print-firmas-row">
              <div class="print-firma">
                <div class="print-firma-linea"></div>
                <p class="print-firma-nombre">{{ getTecnico(solicitudSeleccionada.id_tecnico_ejecucion) || 'Técnico Asignado' }}</p>
                <p class="print-firma-cargo">Responsable de Trabajo</p>
              </div>
              <div class="print-firma">
                <div class="print-firma-linea"></div>
                <p class="print-firma-nombre">Ing. Cimar Farfan</p>
                <p class="print-firma-cargo">Encargado de Arboricultura</p>
              </div>
              <div class="print-firma">
                <div class="print-firma-linea"></div>
                <p class="print-firma-nombre">Ing. Raul Arteaga</p>
                <p class="print-firma-cargo">Jefe de Unidad</p>
              </div>
            </div>

            <!-- Pie de Página (Contador de Hojas) -->
            <div class="no-print mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-[8px] text-gray-400 font-bold uppercase tracking-widest">
              <span>Sistema de Gestión de Arboricultura y Espacios Verdes - G.A.M.T.</span>
              <div class="print-counter">Página <span class="pageNumber"></span></div>
            </div>
          </div>

        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, computed, ref, watch } from 'vue'
import { MapPin, Filter, X } from 'lucide-vue-next'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState } = mainStore

const solicitudSeleccionada = ref(null)

const getTecnico = (id) => {
  if (!id) return 'No asignado'
  const t = store.tecnicos.find(x => x.id == id)
  return t ? t.nombre : 'No asignado'
}

const getInstitucion = (id) => {
  if (!id) return 'No corresponde'
  const i = store.instituciones.find(x => x.id == id)
  return i ? i.nombre : 'Desconocida'
}

const formatFecha = (str) => {
  if (!str) return 'No registrada';
  const fecha = new Date(str);
  if (isNaN(fecha.getTime())) return str;
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diaSemana = dias[fecha.getUTCDay()];
  const d = String(fecha.getUTCDate()).padStart(2, '0');
  const m = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const a = String(fecha.getUTCFullYear()).slice(-2);
  return `${diaSemana} ${d}/${m}/${a}`;
}

const getDistritoByBarrio = (idBarrio) => {
  if (!idBarrio) return '—'
  const b = store.barrios.find(x => x.id == idBarrio)
  if (!b) return '—'
  const d = store.distritos.find(x => x.id == b.id_distrito)
  return d ? d.nombre : '—'
}

const getTipoInstitucion = (idTipo) => {
  if (!idTipo) return 'Particular'
  const t = store.tipos_institucion.find(x => x.id == idTipo)
  return t ? t.nombre : 'Particular'
}

const formatLoDeterminado = (sol) => {
  if (!sol.arboles || sol.arboles.length === 0) {
    const acc = getAccion(sol.id_accion)
    return acc
  }
  const total = sol.arboles.length
  if (total === 1) {
    const acc = getAccion(sol.arboles[0].id_accion_realizar)
    return acc
  }
  const acciones = sol.arboles.map(a => getAccion(a.id_accion_realizar)).filter(n => n !== 'Pendiente')
  const uniqueAcc = [...new Set(acciones)]
  return uniqueAcc.length > 0 ? uniqueAcc.join(', ') : 'Pendiente'
}

const imprimirReporte = () => {
  window.print()
}

const getBarrio = (id) => {
  if (!id) return 'Todos'
  const b = store.barrios.find(x => x.id == id)
  return b ? b.nombre : 'N/A'
}

const getEspecie = (id) => {
  if (!id) return 'No verificada'
  const e = store.especies.find(x => x.id == id)
  return e ? e.nombre : 'No verificada'
}

const getAccion = (id) => {
  if (!id) return 'Todas'
  const a = store.acciones.find(x => x.id == id)
  return a ? a.nombre : 'N/A'
}

const formatLoSolicitado = (sol) => {
  if (!sol.arboles || sol.arboles.length === 0) {
    const esp = getEspecie(sol.id_especie)
    const acc = getAccion(sol.id_accion_solicitada)
    if (esp === 'No verificada') return acc
    return `${esp} (${acc})`
  }
  const total = sol.arboles.length
  if (total === 1) {
    const esp = getEspecie(sol.arboles[0].id_especie)
    const acc = getAccion(sol.arboles[0].id_accion_solicitada)
    return `${esp} (${acc})`
  }
  const especies = sol.arboles.map(a => getEspecie(a.id_especie)).filter(n => n !== 'No verificada')
  const uniqueEsp = [...new Set(especies)]
  const espStr = uniqueEsp.length > 0 ? uniqueEsp.join(', ') : 'Desconocido'
  return `${espStr} (${total} árboles)`
}

const mostrarFiltros = ref(false)
const filtros = reactive({
  estado: 'todos',
  distrito: 'todos',
  barrio: 'todos',
  accion: 'todos',
  setar: 'todos',
  prioridad: 'todos',
  fecha_inicio: '',
  fecha_fin: ''
})

// Al cambiar el distrito, resetear el barrio
watch(() => filtros.distrito, () => {
  filtros.barrio = 'todos'
})

const limpiarFiltros = () => {
  filtros.estado = 'todos'
  filtros.distrito = 'todos'
  filtros.barrio = 'todos'
  filtros.accion = 'todos'
  filtros.setar = 'todos'
  filtros.prioridad = 'todos'
  filtros.fecha_inicio = ''
  filtros.fecha_fin = ''
}

const geolocalizadas = computed(() => {
  return store.solicitudes.filter(s => {
    const lat = parseFloat(s.lat)
    const lng = parseFloat(s.lng)
    if (isNaN(lat) || isNaN(lng)) return false

    // 1. Filtro Estado
    if (filtros.estado !== 'todos') {
      if (filtros.estado === 'Pendiente' && s.estado_tramite === 'Terminado') return false
      if (filtros.estado === 'Terminado' && s.estado_tramite !== 'Terminado') return false
    }

    // 2. Filtro Barrio y Distrito
    if (filtros.barrio !== 'todos') {
      if (s.id_barrio != filtros.barrio) return false
    } else if (filtros.distrito !== 'todos') {
      const barrioObj = store.barrios.find(b => b.id == s.id_barrio)
      if (!barrioObj || barrioObj.id_distrito != filtros.distrito) return false
    }

    // 3. Filtro Acción Técnica
    if (filtros.accion !== 'todos') {
      let matchAccion = false
      if (s.id_accion_solicitada == filtros.accion) matchAccion = true
      if (s.arboles && s.arboles.length > 0) {
        if (s.arboles.some(a => a.id_accion_solicitada == filtros.accion || a.id_accion_realizar == filtros.accion)) {
          matchAccion = true
        }
      }
      if (!matchAccion) return false
    }

    // 4. Filtro Requerimientos Especiales (Etiquetas Booleanas)
    if (filtros.setar !== 'todos') {
      if (filtros.setar === 'setar' && !s.requiere_setar) return false
      if (filtros.setar === 'plataforma' && !s.requiere_plataforma) return false
      if (filtros.setar === 'ficha_tecnica' && !s.requiere_ficha_tecnica) return false
      if (filtros.setar === 'arbol_seco' && !s.arbol_seco) return false
      if (filtros.setar === 'segunda_nota' && !s.segunda_nota) return false
      if (filtros.setar === 'procede' && !s.procede) return false
    }

    // 5. Filtro Prioridad / Urgencia
    if (filtros.prioridad !== 'todos') {
      // Mapear la lógica a Alta, Intermedia, Baja
      let nivel = s.nivel_urgencia;
      if (!nivel) {
        // Fallback si no tiene nivel
        if (s.es_emergencia || s.es_urgencia) nivel = 'Alta';
        else nivel = 'Baja';
      }
      if (nivel !== filtros.prioridad && !(filtros.prioridad === 'Alta' && (s.es_emergencia || s.es_urgencia))) return false;
    }

    // 6. Filtro de Rango de Fechas (Ingreso)
    if (filtros.fecha_inicio || filtros.fecha_fin) {
      const fechaSolStr = s.fecha_creacion || s.fecha_solicitud;
      if (!fechaSolStr) return false; // Si no tiene fecha, lo excluimos si hay filtro
      const fechaSol = new Date(fechaSolStr);
      // Poner fechaSol a inicio del día en hora local para comparación justa
      fechaSol.setHours(0, 0, 0, 0);

      if (filtros.fecha_inicio) {
        const fInicio = new Date(filtros.fecha_inicio + 'T00:00:00');
        if (fechaSol < fInicio) return false;
      }
      
      if (filtros.fecha_fin) {
        const fFin = new Date(filtros.fecha_fin + 'T23:59:59');
        if (fechaSol > fFin) return false;
      }
    }

    return true
  })
})

const stats = computed(() => {
  return {
    pendientes: geolocalizadas.value.filter(s => s.estado_tramite !== 'Terminado').length,
    ejecutadas: geolocalizadas.value.filter(s => s.estado_tramite === 'Terminado').length
  }
})

let map = null
const markers = []
const currentLayer = ref('streets')

const layers = [
  { id: 'streets', name: 'Calles', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 20, maxNativeZoom: 19 },
  { id: 'satellite', name: 'Satélite', url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', maxZoom: 20, maxNativeZoom: 20, subdomains: ['0', '1', '2', '3'] },
  { id: 'dark', name: 'Noche', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', maxZoom: 20, maxNativeZoom: 20 }
]

let activeTileLayer = null

const setLayer = (id) => {
  currentLayer.value = id
  if (activeTileLayer) {
    map.removeLayer(activeTileLayer)
  }
  const layer = layers.find(l => l.id === id)
  activeTileLayer = L.tileLayer(layer.url, {
    attribution: layer.id === 'satellite' ? '&copy; Google' : '&copy; OpenStreetMap / Contributors',
    maxZoom: layer.maxZoom,
    maxNativeZoom: layer.maxNativeZoom,
    subdomains: layer.subdomains || ['a', 'b', 'c']
  }).addTo(map)
}

const initMap = () => {
  if (typeof L === 'undefined') {
    setTimeout(initMap, 500)
    return
  }

  map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: true,
    maxZoom: 20
  }).setView([-21.5355, -64.7327], 14)

  // Iniciar con la capa predeterminada
  setLayer('streets')

  L.control.zoom({ position: 'topright' }).addTo(map)

  renderMarkers()
}

const renderMarkers = () => {
  // Limpiar marcadores previos
  markers.forEach(m => map.removeLayer(m))
  
  geolocalizadas.value.forEach(sol => {
    const lat = parseFloat(sol.lat)
    const lng = parseFloat(sol.lng)
    
    const color = sol.estado_tramite === 'Terminado' ? '#10b981' : '#f59e0b'
    
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <svg viewBox="0 0 24 24" width="30" height="30" fill="${color}" stroke="#ffffff" stroke-width="1.5" class="map-tree-marker">
          <path d="M12 2 L8 8 H10 L6 13 H9 L4 18 H11 V22 H13 V18 H20 L15 13 H18 L14 8 H16 Z" />
        </svg>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    })

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
    
    const popupContent = `
      <div style="font-family: 'Outfit', sans-serif; padding: 5px; min-width: 220px;">
        <p style="margin: 0; font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase;">Trámite: ${sol.comunicacion_interna || 'S/N'}</p>
        <p style="margin: 5px 0; font-size: 14px; font-weight: 900; color: #333;">${formatLoSolicitado(sol)}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 8px 0;">
        <p style="margin: 0; font-size: 11px; color: #444;"><b>📍 Ubicación:</b> ${sol.calle || 'No especificada'}</p>
        <p style="margin: 3px 0; font-size: 11px; color: #444;"><b>📞 Solicitante:</b> ${sol.solicitante_nombre || 'Anónimo'}</p>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 8px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; background: ${color}20; color: ${color}; font-size: 9px; font-weight: 900; text-transform: uppercase;">
            ${sol.estado_tramite}
          </span>
          <button onclick="window.abrirDetalleTramite('${sol.id_solicitud}')" style="background: #1a4731; color: #ffffff; border: none; padding: 5px 10px; border-radius: 6px; font-size: 9.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
            🔍 Ver Trámite
          </button>
        </div>
      </div>
    `
    
    marker.bindPopup(popupContent)
    markers.push(marker)
  })
}

onMounted(() => {
  initMap()
  window.abrirDetalleTramite = (id) => {
    const sol = store.solicitudes.find(s => s.id_solicitud == id)
    if (sol) {
      solicitudSeleccionada.value = sol
    }
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
  delete window.abrirDetalleTramite
})

watch(() => geolocalizadas.value, () => {
  if (map) renderMarkers()
}, { deep: true })
</script>

<style>
.leaflet-container {
  background: #fdfdfb !important;
}

.theme-black .leaflet-container {
  background: #121212 !important;
}

.custom-div-icon {
  background: transparent !important;
  border: none !important;
  overflow: visible !important;
}

.map-tree-marker {
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  transform-origin: bottom center;
  cursor: pointer !important;
}

.map-tree-marker:hover {
  transform: scale(1.3) translateY(-4px);
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.45)) !important;
}

.leaflet-popup-content-wrapper {
  border-radius: 1.5rem !important;
  box-shadow: 0 15px 30px rgba(0,0,0,0.2) !important;
  padding: 8px !important;
}

.leaflet-popup-tip {
  display: none;
}

@media print {
    body {
        background: white !important;
        color: black !important;
    }
    
    #map, .no-print, .bg-black\/50, button, .custom-scrollbar::-webkit-scrollbar {
        display: none !important;
    }

    @page {
        size: A4 portrait;
        margin: 0.6cm 0.8cm 1.2cm 0.8cm; /* Márgenes con espacio inferior para el pie */
    }
    
    @page {
        @bottom-left {
            content: "Sistema de Gestión de Arboricultura y Espacios Verdes - G.A.M.T.";
            font-size: 8px;
            font-family: inherit;
            color: #9ca3af;
            font-weight: bold;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        @bottom-right {
            content: "Página " counter(page);
            font-size: 8px;
            font-family: inherit;
            color: #9ca3af;
            font-weight: bold;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
    }

    .fixed.inset-0 {
        position: static !important;
        display: block !important;
        background: white !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
    }

    .print-area {
        display: block !important;
        width: 100% !important;
        max-width: none !important;
        background: white !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        max-height: none !important;
    }

    .print-area .p-8,
    .print-area .overflow-y-auto {
        display: block !important;
        overflow: visible !important;
        max-height: none !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    .print-area .grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 10pt !important;
        overflow: visible !important;
    }
    
    .md\:col-span-2 {
        grid-column: span 2 / span 2 !important;
    }

    .print-header {
        display: block !important;
        border-bottom: 2pt solid #1a4731;
        margin-bottom: 8pt;
        padding-bottom: 5pt;
    }
    .print-institution img { height: 60pt !important; width: 60pt !important; }
    .print-gov { font-size: 11pt !important; }
    .print-sec, .print-unit { font-size: 8pt !important; }

    .bg-blue-50\/60, .bg-emerald-50\/60, .bg-amber-50\/60, .bg-purple-50\/60, div.bg-slate-50 {
        display: block !important;
        width: 100% !important;
        margin-bottom: 8pt !important;
        padding: 8pt !important;
        border: 0.5pt solid #aaa !important;
        background-color: #fff !important;
        page-break-inside: avoid;
        break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .text-gray-800, .text-gray-700, span, p { color: #000 !important; font-size: 8.5pt !important; }
    h4 { border-bottom: 0.5pt solid #1a4731 !important; color: #1a4731 !important; margin-bottom: 5pt !important; font-size: 9pt !important; padding-bottom: 2pt !important; }

    .print-firmas { display: block !important; margin-top: 15pt; }
    .print-firmas-row { display: flex; justify-content: space-around; margin-top: 15pt; }

    .print-firma { 
        text-align: center; 
        width: 150pt; 
    }
    .print-firma-linea {
        width: 100%;
        border-bottom: 0.8pt solid #000;
        margin: 0 auto 5pt;
        height: 45pt;
    }
    .print-firma-nombre {
        font-size: 8pt;
        font-weight: 800;
        margin: 0;
    }
    .print-firma-cargo {
        font-size: 7.5pt;
        color: #333;
        margin: 1pt 0 0;
        text-transform: uppercase;
    }

    .print-area table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-top: 8pt !important;
        margin-bottom: 8pt !important;
    }
    .print-area th, .print-area td {
        border: 0.5pt solid #ddd !important;
        padding: 5pt 6pt !important;
        font-size: 8pt !important;
        text-align: left !important;
    }
    .print-area th {
        background-color: #f3f4f6 !important;
        color: #000 !important;
        font-weight: bold !important;
    }

    #print-seccion-5 {
        break-before: auto !important;
        margin-top: 8pt !important;
    }

    .print-counter {
        display: block !important;
    }
    .pageNumber::after {
        content: counter(page);
    }
}
</style>
