<template>
  <div class="h-screen flex flex-col bg-[#022c22] text-white">
    <!-- Header -->
    <div class="p-6 md:p-8 bg-black/20 border-b border-white/5 flex justify-between items-center z-10">
      <div>
        <h1 class="text-3xl font-black tracking-tight flex items-center gap-3">
          <CalendarIcon class="w-8 h-8 text-accent animate-pulse" />
          Calendario de Mantenimiento Activo
        </h1>
        <p class="text-white/50 text-sm mt-1">Planifica y agenda podas, talas y aniversarios de barrios en tiempo real.</p>
      </div>
      <div class="flex items-center gap-6">
        <!-- Resumen del Mes -->
        <div class="hidden xl:flex items-center gap-5 bg-white/5 border border-white/10 px-6 py-2.5 rounded-2xl shadow-inner">
          <div class="text-right">
            <p class="text-[9px] text-accent font-black uppercase tracking-[0.2em] mb-0.5">{{ estadisticasMes.mesNombre }}</p>
            <p class="text-white/50 font-bold text-[10px] uppercase tracking-wider">Resumen</p>
          </div>
          <div class="w-px h-8 bg-white/10"></div>
          <div class="flex items-center gap-3">
            <div class="text-center min-w-[3rem]">
              <p class="text-blue-400 font-black text-xl leading-none">{{ estadisticasMes.tareas }}</p>
              <p class="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-1">Tareas</p>
            </div>
            <div class="text-center min-w-[3rem]">
              <p class="text-red-400 font-black text-xl leading-none">{{ estadisticasMes.feriados }}</p>
              <p class="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-1">Feriados</p>
            </div>
            <div class="text-center min-w-[3rem]">
              <p class="text-emerald-400 font-black text-xl leading-none">{{ estadisticasMes.aniversarios }}</p>
              <p class="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-1">Anivers.</p>
            </div>
          </div>
        </div>

        <button v-if="uiState.user?.role !== 'USER'" @click="openModal()" class="bg-accent hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-accent/20 cursor-pointer active:scale-95 hover:-translate-y-0.5">
          <Plus class="w-5 h-5" />
          Nuevo Evento
        </button>
      </div>
    </div>

    <!-- Main Workspace (Sidebar + Calendar) -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar de Solicitudes Sin Agendar (Bandeja de Entrada) -->
      <div class="w-80 bg-black/10 border-r border-white/5 p-6 flex flex-col h-full">
        <div class="mb-5 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 class="text-base font-black tracking-tight flex items-center gap-2">
              <Inbox class="w-4 h-4 text-accent" />
              Sin Planificar
            </h2>
            <p class="text-white/40 text-[10px] mt-0.5">Trámites pendientes sin fecha asignada.</p>
          </div>
          <span class="bg-accent/10 border border-accent/20 text-accent font-black text-[10px] px-2 py-0.5 rounded-full">
            {{ solicitudesSinAgendar.length }}
          </span>
        </div>

        <!-- Buscador Premium (Fijo arriba) -->
        <div class="mb-5 flex-shrink-0">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/30">
              <Search class="w-4 h-4" />
            </span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Escribe cualquier referencia" 
              class="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white outline-none focus:border-accent/50 transition-all font-semibold sidebar-search-input"
            />
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''" 
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <!-- Listado de Solicitudes -->
        <div class="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1" id="unscheduled-events-list">
          <div v-if="solicitudesSinAgendar.length === 0" class="h-40 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 text-center text-white/30">
            <CheckCircle class="w-8 h-8 mb-2 text-accent opacity-50" />
            <p class="text-xs font-bold uppercase tracking-wider text-white/50">¡Todo al día!</p>
            <p class="text-[9px] mt-1 leading-relaxed">No hay solicitudes de poda o tala pendientes de agendar.</p>
          </div>
          
          <div v-else v-for="sol in solicitudesSinAgendar" :key="sol.id_solicitud" class="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-accent/40 transition-all shadow-md group draggable-event-card cursor-grab active:cursor-grabbing" :data-solicitud-id="sol.id_solicitud">
            <div class="flex justify-between items-start gap-2 mb-2">
              <span :class="[
                sol.nivel_urgencia === 'Alta' || sol.es_emergencia ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                sol.nivel_urgencia === 'Media' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-blue-500/20 text-blue-400 border-blue-500/30',
                'px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider'
              ]">
                {{ sol.es_emergencia ? 'Emergencia' : sol.nivel_urgencia }}
              </span>
              <span class="text-[9px] font-mono font-bold text-white/40 group-hover:text-accent transition-colors">
                {{ sol.codigo_anual }}
              </span>
            </div>
            
            <h3 class="font-black text-sm text-white leading-snug mb-1 truncate" :title="sol.comunicacion_interna || 'Sin Código Interno'">
              {{ sol.comunicacion_interna || 'Sin Comunicación Interna' }}
            </h3>
            <p class="text-xs text-white/60 mb-2 font-semibold truncate">{{ sol.solicitante_nombre }}</p>
            
            <div class="text-[10px] text-white/40 mb-3 space-y-0.5">
              <p class="truncate"><span class="font-bold">Barrio:</span> {{ getBarrio(sol.id_barrio) }}</p>
              <p><span class="font-bold">Ingreso:</span> {{ formatFecha(sol.fecha_ingreso) }}</p>
              <p class="truncate"><span class="font-bold">Tipo:</span> {{ getTipoTrabajo(sol) }}</p>
            </div>
            
            <div class="flex gap-2">
              <button v-if="uiState.user?.role !== 'USER'" @click="abrirAgendarModalDirecto(sol)" class="w-full bg-accent hover:bg-emerald-600 text-white py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer">
                <CalendarIcon class="w-3.5 h-3.5" />
                Agendar Fecha
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar View -->
      <div class="flex-1 p-6 md:p-8 overflow-y-auto">
        <div class="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl relative">
          <div v-if="uiState.isLoading" class="absolute inset-0 bg-[#022c22]/50 backdrop-blur-xs flex items-center justify-center z-50 rounded-3xl">
            <span class="text-accent font-black animate-pulse">Cargando datos...</span>
          </div>
          <FullCalendar :key="calendarKey" :options="calendarOptions" />
        </div>
      </div>
    </div>

    <!-- Modal Formulario (Aniversario / Feriado) -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/75 backdrop-blur-md p-4">
      <div class="bg-[#022c22] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl scale-in">
        <h2 class="text-2xl font-black mb-6">
          {{ currentEvent.id ? (isFeriado ? 'Editar Feriado / Festivo' : 'Editar Aniversario') : (isFeriado ? 'Nuevo Feriado / Festivo' : 'Nuevo Aniversario') }}
        </h2>
        
        <!-- Selector de Tipo de Evento (Solo al Crear) -->
        <div v-if="!currentEvent.id" class="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-xl mb-6">
          <button type="button" @click="isFeriado = false" :class="[!isFeriado ? 'bg-accent text-white' : 'text-white/50 hover:text-white', 'py-2.5 rounded-lg font-bold text-sm transition-all']">
            Aniversario Barrio
          </button>
          <button type="button" @click="isFeriado = true" :class="[isFeriado ? 'bg-accent text-white' : 'text-white/50 hover:text-white', 'py-2.5 rounded-lg font-bold text-sm transition-all']">
            Feriado / Festivo
          </button>
        </div>

        <form @submit.prevent="saveEvent" class="space-y-4">
          <!-- Campo Barrio (Solo Aniversario) -->
          <div v-if="!isFeriado">
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Barrio</label>
            <select v-model="currentEvent.nombre_barrio" required class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors appearance-none font-bold">
              <option value="" disabled>Seleccione un barrio</option>
              <option v-for="barrio in store.barrios" :key="barrio.id" :value="barrio.nombre">{{ barrio.nombre }}</option>
            </select>
          </div>

          <!-- Campo Nombre del Feriado (Solo Feriado) -->
          <div v-if="isFeriado">
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Nombre del Feriado</label>
            <input type="text" v-model="nombreFeriado" required placeholder="Ej. Corpus Christi" class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors font-bold">
          </div>

          <!-- Campo Fecha (Común) -->
          <div>
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Fecha</label>
            <input type="date" v-model="currentEvent.fecha_aniversario" required class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors [color-scheme:dark] font-bold">
          </div>

          <!-- Campos Presidente y Teléfono (Solo Aniversario) -->
          <div v-if="!isFeriado">
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Presidente del Barrio</label>
            <input type="text" v-model="currentEvent.presidente_barrio" class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors font-bold">
          </div>
          <div v-if="!isFeriado">
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Teléfono</label>
            <input type="text" v-model="currentEvent.telefono_presidente" class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors font-bold">
          </div>

          <!-- Solicitudes de Poda Asociadas (Solo Aniversario) -->
          <div v-if="!isFeriado && currentEvent.nombre_barrio" class="mt-6 pt-4 border-t border-white/10">
            <h3 class="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Solicitudes de Poda ({{ solicitudesDelBarrio.length }})</h3>
            <div v-if="solicitudesDelBarrio.length > 0" class="space-y-2 max-h-40 overflow-y-auto pr-1">
              <div v-for="sol in solicitudesDelBarrio" :key="sol.id_solicitud" 
                   @click="abrirDetalleDesdeAniversario(sol)" 
                   class="bg-black/20 border border-white/5 hover:border-accent/50 hover:bg-accent/5 rounded-xl p-3 flex justify-between items-center text-sm cursor-pointer transition-all active:scale-98 group">
                <div>
                  <p class="font-black text-white text-xs truncate max-w-[200px] group-hover:text-accent transition-colors">
                    {{ sol.comunicacion_interna || sol.codigo_anual || `#${sol.id_solicitud}` }}
                  </p>
                </div>
                <span :class="[
                  sol.estado_tramite === 'Terminado' ? 'bg-emerald-500/20 text-emerald-400' :
                  sol.estado_tramite === 'En proceso' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-blue-500/20 text-blue-400',
                  'px-2 py-0.5 rounded-full text-[10px] font-bold'
                ]">
                  {{ sol.estado_tramite }}
                </span>
              </div>
            </div>
            <p v-else class="text-xs text-white/30 italic">No hay solicitudes de poda registradas para este barrio.</p>
          </div>
          
          <div class="flex gap-3 mt-8 pt-4 border-t border-white/10">
            <button v-if="currentEvent.id" type="button" @click="handleDelete" class="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center gap-1 shadow-lg hover:shadow-red-600/20 cursor-pointer">
              <Trash2 class="w-4 h-4" />
              Eliminar
            </button>
            <button type="button" @click="closeModal" class="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/10 transition-all cursor-pointer">Cancelar</button>
            <button type="submit" class="flex-1 bg-accent hover:bg-emerald-600 text-white rounded-xl py-3 font-bold transition-all shadow-lg hover:shadow-accent/20 cursor-pointer">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: PLANIFICAR TRÁMITE EN FECHA (DATE CLICK) -->
    <div v-if="showUnscheduledModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/75 backdrop-blur-md p-4">
      <div class="bg-[#022c22] border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl scale-in flex flex-col max-h-[85vh]">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-2xl font-black text-white">Agendar para el {{ formatFecha(clickedDate) }}</h2>
            <p class="text-xs text-white/50 mt-1">Selecciona una solicitud pendiente para asignarle esta fecha.</p>
          </div>
          <button @click="showUnscheduledModal = false" class="bg-white/15 hover:bg-white/20 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Listado rápido de solicitudes -->
        <div class="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 my-4">
          <div v-if="solicitudesSinAgendar.length === 0" class="h-40 flex flex-col items-center justify-center text-center text-white/30 italic">
            <CheckCircle class="w-8 h-8 mb-2 text-accent opacity-50" />
            <p class="text-sm font-bold">No hay trámites sin planificar.</p>
          </div>
          <div v-else v-for="sol in solicitudesSinAgendar" :key="sol.id_solicitud" 
               @click="agendarParaFecha(sol)" 
               class="bg-white/5 border border-white/10 hover:border-accent hover:bg-accent/5 rounded-2xl p-4 transition-all cursor-pointer flex justify-between items-center group">
            <div class="space-y-1.5 flex-1 pr-4">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-accent">{{ sol.codigo_anual }}</span>
                <span :class="[
                  sol.nivel_urgencia === 'Alta' || sol.es_emergencia ? 'bg-red-500/20 text-red-400' :
                  sol.nivel_urgencia === 'Media' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400',
                  'px-1.5 py-0.5 rounded text-[8px] font-black uppercase'
                ]">
                  {{ sol.es_emergencia ? 'Emergencia' : sol.nivel_urgencia }}
                </span>
              </div>
              <h4 class="font-black text-sm text-white truncate max-w-[280px]">{{ sol.comunicacion_interna || 'Sin C. Interna' }}</h4>
              <p class="text-xs text-white/60 truncate max-w-[280px]">{{ sol.solicitante_nombre }} ({{ getBarrio(sol.id_barrio) }})</p>
            </div>
            <button class="bg-accent/15 group-hover:bg-accent text-accent group-hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
              <CalendarIcon class="w-3.5 h-3.5" />
              Agendar
            </button>
          </div>
        </div>

        <div class="pt-4 border-t border-white/10 flex justify-end">
          <button @click="showUnscheduledModal = false" class="py-3 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/10 transition-all cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: DETALLE SOLICITUD PROGRAMADA (EVENT CLICK) -->
    <div v-if="showSolicitudModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/75 backdrop-blur-md p-4">
      <div class="bg-[#022c22] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl scale-in">
        <div class="flex justify-between items-start mb-4">
          <div>
            <span class="text-xs font-black text-accent uppercase tracking-widest block mb-1">Detalle de Programación</span>
            <h2 class="text-2xl font-black text-white">{{ selectedSolicitud.comunicacion_interna || selectedSolicitud.codigo_anual }}</h2>
          </div>
          <button @click="showSolicitudModal = false" class="bg-white/15 hover:bg-white/20 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>
        
        <div class="space-y-4 text-sm">
          <div class="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2">
            <p><span class="text-white/40 font-bold text-[10px] uppercase tracking-wider block">Solicitante:</span> <span class="font-bold text-white text-xs">{{ selectedSolicitud.solicitante_nombre }}</span></p>
            <p><span class="text-white/40 font-bold text-[10px] uppercase tracking-wider block">Barrio:</span> <span class="font-bold text-white text-xs">{{ getBarrio(selectedSolicitud.id_barrio) }}</span></p>
            <p><span class="text-white/40 font-bold text-[10px] uppercase tracking-wider block">Urgencia:</span> <span class="font-bold text-white text-xs">{{ selectedSolicitud.nivel_urgencia }}</span></p>
            <p><span class="text-white/40 font-bold text-[10px] uppercase tracking-wider block">Tipo de Trabajo:</span> <span class="font-bold text-white text-xs">{{ getTipoTrabajo(selectedSolicitud) }}</span></p>
            <p><span class="text-white/40 font-bold text-[10px] uppercase tracking-wider block">Estado actual:</span> 
              <span :class="[
                selectedSolicitud.estado_tramite === 'Terminado' ? 'text-emerald-400' :
                selectedSolicitud.estado_tramite === 'En proceso' ? 'text-amber-400' : 'text-blue-400',
                'font-black text-xs uppercase'
              ]">
                {{ selectedSolicitud.estado_tramite }}
              </span>
            </p>
          </div>

          <form @submit.prevent="saveSolicitudFecha" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Fecha Planificada de Trabajo</label>
              <input type="date" v-model="selectedSolicitudFecha" required class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors [color-scheme:dark] font-bold">
            </div>

            <div class="flex gap-2.5 mt-6 pt-4 border-t border-white/10">
              <!-- Botón Des-agendar -->
              <button type="button" @click="desagendarSolicitud" class="px-3 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-xs uppercase tracking-wide">
                <CalendarOff class="w-4 h-4" />
                Des-agendar
              </button>
              
              <!-- Botón Completar -->
              <button v-if="selectedSolicitud.estado_tramite !== 'Terminado'" type="button" @click="completarSolicitudDirecto" class="px-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-xs uppercase tracking-wide">
                <Check class="w-4 h-4" />
                Terminar
              </button>

              <button type="submit" class="flex-1 bg-accent hover:bg-emerald-600 text-white rounded-xl py-3 font-bold transition-all shadow-lg shadow-accent/20 cursor-pointer text-xs uppercase tracking-wide">
                Actualizar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 4: ASIGNAR FECHA DIRECTO DESDE SIDEBAR -->
    <div v-if="showSidebarScheduleModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/75 backdrop-blur-md p-4">
      <div class="bg-[#022c22] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl scale-in">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-xl font-black text-white">Agendar Trámite</h2>
            <p class="text-xs text-white/50 mt-0.5">{{ selectedSolicitudSidebar.comunicacion_interna || selectedSolicitudSidebar.codigo_anual }}</p>
          </div>
          <button @click="showSidebarScheduleModal = false" class="bg-white/15 hover:bg-white/20 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="saveSidebarSchedule" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Selecciona la Fecha de Agenda</label>
            <input type="date" v-model="selectedSidebarScheduleDate" required class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors [color-scheme:dark] font-bold">
          </div>
          
          <div class="pt-4 flex gap-3 border-t border-white/10">
            <button type="button" @click="showSidebarScheduleModal = false" class="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/10 transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" class="flex-1 bg-accent hover:bg-emerald-600 text-white rounded-xl py-3 font-bold transition-all shadow-lg shadow-accent/20 cursor-pointer">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tooltip Custom (Para eventos) -->
    <div v-if="tooltip.visible" class="fixed z-[200] bg-[#022c22] border border-accent/30 rounded-xl p-4 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 w-64" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div v-if="tooltip.data.isSolicitud">
        <div class="flex items-center gap-2 mb-2">
          <span :class="[
            tooltip.data.estado_tramite === 'Terminado' ? 'bg-emerald-500/20 text-emerald-400' :
            tooltip.data.estado_tramite === 'En proceso' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400',
            'w-2 h-2 rounded-full flex-shrink-0'
          ]"></span>
          <h3 class="font-black text-sm truncate flex-1">{{ tooltip.data.comunicacion_interna || tooltip.data.codigo_anual }}</h3>
        </div>
        <p class="text-xs text-white/70 mb-1"><span class="font-bold text-white/95">Solicitante:</span> {{ tooltip.data.solicitante_nombre }}</p>
        <p class="text-xs text-white/70 mb-1"><span class="font-bold text-white/95">Barrio:</span> {{ getBarrio(tooltip.data.id_barrio) }}</p>
        <p class="text-xs text-white/70 mb-1"><span class="font-bold text-white/95">Urgencia:</span> {{ tooltip.data.nivel_urgencia }}</p>
        <p class="text-xs text-white/70"><span class="font-bold text-white/95">Estado:</span> <span class="font-semibold uppercase text-[10px]">{{ tooltip.data.estado_tramite }}</span></p>
      </div>
      
      <div v-else>
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: tooltip.data.color_etiqueta }"></div>
          <h3 class="font-black text-sm truncate flex-1">{{ tooltip.data.nombre_barrio }}</h3>
        </div>
        
        <!-- Si es Feriado -->
        <div v-if="tooltip.data.nombre_barrio && tooltip.data.nombre_barrio.startsWith('Feriado:')" class="mt-1">
          <span class="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Feriado Oficial</span>
        </div>
        
        <!-- Si es Aniversario -->
        <div v-else>
          <p class="text-xs text-white/70 mb-1"><span class="font-bold text-white/95">Presidente:</span> {{ tooltip.data.presidente_barrio || 'N/A' }}</p>
          <p class="text-xs text-white/70 mb-1"><span class="font-bold text-white/95">Teléfono:</span> {{ tooltip.data.telefono_presidente || 'N/A' }}</p>
          <div class="mt-2 space-y-1">
            <p class="text-[10px] font-bold text-accent uppercase tracking-wider">Solicitudes de Poda ({{ getSolicitudesDelBarrio(tooltip.data.nombre_barrio).length }})</p>
            <div v-if="getSolicitudesDelBarrio(tooltip.data.nombre_barrio).length > 0" class="max-h-24 overflow-y-auto space-y-1 pr-0.5">
              <div v-for="sol in getSolicitudesDelBarrio(tooltip.data.nombre_barrio)" :key="sol.id_solicitud" class="text-[11px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex justify-between items-center gap-2">
                <span class="font-bold text-white/90 truncate">{{ sol.comunicacion_interna || sol.codigo_anual }}</span>
                <span class="text-white/50 text-[9px] uppercase font-semibold flex-shrink-0">{{ sol.estado_tramite }}</span>
              </div>
            </div>
            <p v-else class="text-[10px] text-white/30 italic">Sin solicitudes asociadas</p>
          </div>
        </div>
      </div>
      
      <!-- Flecha del tooltip -->
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#022c22] border-b border-r border-accent/30 transform rotate-45"></div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN CUSTOM PREMIUM -->
    <Teleport to="body">
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
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useMainStore } from '../store/mainStore.js'
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Inbox, 
  CheckCircle, 
  X, 
  CalendarOff, 
  Check,
  Search
} from 'lucide-vue-next'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'

// Formateador de fechas para evitar desfases de zona horaria (UTC vs Local)
const formatIsoDateOnly = (val) => {
  if (!val) return ''
  if (typeof val === 'string') {
    return val.slice(0, 10)
  }
  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return ''
}

const searchQuery = ref('')
const esDesdeAniversario = ref(false)

const currentMonthStart = ref(new Date())

const estadisticasMes = computed(() => {
  const events = calendarOptions.events || []
  const month = currentMonthStart.value.getMonth()
  const year = currentMonthStart.value.getFullYear()
  
  let feriados = 0
  let aniversarios = 0
  let tareas = 0
  
  events.forEach(ev => {
    const evDateStr = ev.date
    if (!evDateStr) return
    const evMonth = parseInt(evDateStr.slice(5, 7)) - 1
    const evYear = parseInt(evDateStr.slice(0, 4))
    
    if (evMonth === month && evYear === year) {
      if (ev.extendedProps?.raw?.isSolicitud) {
        tareas++
      } else if (ev.title && ev.title.startsWith('Feriado:')) {
        feriados++
      } else {
        aniversarios++
      }
    }
  })
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  
  return {
    mesNombre: monthNames[month],
    feriados,
    aniversarios,
    tareas
  }
})

const mainStore = useMainStore()
const { 
  store, 
  uiState, 
  fetchCalendario, 
  fetchSolicitudes, 
  updateSolicitud, 
  addCalendarioEvento, 
  updateCalendarioEvento, 
  deleteCalendarioEvento, 
  showToast 
} = mainStore

const showModal = ref(false)
const eventosBase = ref([])
const calendarKey = ref(0)
const isFeriado = ref(false)
const nombreFeriado = ref('')

const showConfirmModal = ref(false)
const confirmTitle = ref('Confirmar Eliminación')
const confirmMessage = ref('¿Estás seguro de eliminar este registro?')
let onConfirmCallback = null

// Modales interactivos de solicitudes
const showSolicitudModal = ref(false)
const selectedSolicitud = ref(null)
const selectedSolicitudFecha = ref('')

const showUnscheduledModal = ref(false)
const clickedDate = ref('')

const showSidebarScheduleModal = ref(false)
const selectedSolicitudSidebar = ref(null)
const selectedSidebarScheduleDate = ref('')

// Helpers para confirmaciones
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

const currentEvent = reactive({
  id: null,
  nombre_barrio: '',
  fecha_aniversario: '',
  presidente_barrio: '',
  telefono_presidente: '',
  color_etiqueta: '#10b981'
})

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  data: null
})

// Mapeo de colores estáticos por distrito para aniversario
const getDistritoColor = (idDistrito) => {
  const colors = {
    1: '#f59e0b',  // Amber
    2: '#3b82f6',  // Blue
    3: '#10b981',  // Emerald
    4: '#8b5cf6',  // Violet
    5: '#ec4899',  // Pink
    6: '#f97316',  // Orange
    7: '#06b6d4',  // Cyan
    8: '#84cc16',  // Lime
    9: '#a855f7',  // Purple
    10: '#64748b', // Slate
    11: '#6366f1', // Indigo
    12: '#f43f5e', // Rose
    13: '#14b8a6'  // Teal
  }
  return colors[idDistrito] || '#10b981'
}

// Obtener barrio por ID
const getBarrio = (id) => {
  if (!id) return 'N/A';
  const b = store.barrios.find(x => x.id == id);
  return b ? b.nombre : 'N/A';
}

// Obtener tipo de trabajo / acción determinada para mostrar
const getTipoTrabajo = (sol) => {
  if (!sol) return 'No Determinado'
  if (sol.id_accion) {
    const acc = store.acciones.find(a => a.id == sol.id_accion)
    if (acc) return acc.nombre
  }
  if (sol.id_accion_solicitada) {
    const acc = store.acciones.find(a => a.id == sol.id_accion_solicitada)
    if (acc) return acc.nombre
  }
  return sol.arbol_seco ? '🪓 Tala (Árbol Seco)' : '🌳 Poda General'
}

// Obtener solicitudes de poda asociadas a un barrio
const getSolicitudesDelBarrio = (nombreBarrio) => {
  if (!nombreBarrio || nombreBarrio.startsWith('Feriado:')) return []
  const barrioObj = store.barrios.find(b => b.nombre === nombreBarrio)
  if (!barrioObj) return []
  return store.solicitudes.filter(s => s.id_barrio === barrioObj.id)
}

const solicitudesDelBarrio = computed(() => {
  return getSolicitudesDelBarrio(currentEvent.nombre_barrio)
})

// Solicitudes sin agendar (filtradas por buscador global y ordenadas por prioridad inteligente)
const solicitudesSinAgendar = computed(() => {
  let list = store.solicitudes.filter(s => !s.fecha_programada && s.estado_tramite !== 'Terminado')

  // Búsqueda global "multicampo" (Busca en todos los campos relevantes de la solicitud)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(s => {
      const codigo = (s.codigo_anual || '').toLowerCase()
      const comunicacion = (s.comunicacion_interna || '').toLowerCase()
      const solicitante = (s.solicitante_nombre || '').toLowerCase()
      const telefono = (s.solicitante_telefono || '').toLowerCase()
      const descripcion = (s.solicitante_descripcion || '').toLowerCase()
      const calle = (s.calle || '').toLowerCase()
      const numeroCasa = (s.numero_casa || '').toLowerCase()
      const referencia = (s.referencia || '').toLowerCase()
      const urgencia = (s.nivel_urgencia || '').toLowerCase()
      const estado = (s.estado_tramite || '').toLowerCase()
      const obsVerif = (s.observacion_verificacion || '').toLowerCase()
      const obsFinales = (s.observaciones_finales || '').toLowerCase()
      const trabajosExtra = (s.trabajos_extra || '').toLowerCase()
      const barrio = getBarrio(s.id_barrio).toLowerCase()
      
      return codigo.includes(q) || 
             comunicacion.includes(q) || 
             solicitante.includes(q) || 
             telefono.includes(q) || 
             descripcion.includes(q) || 
             calle.includes(q) || 
             numeroCasa.includes(q) || 
             referencia.includes(q) || 
             urgencia.includes(q) || 
             estado.includes(q) || 
             obsVerif.includes(q) || 
             obsFinales.includes(q) || 
             trabajosExtra.includes(q) || 
             barrio.includes(q)
    })
  }

  // Ordenamiento inteligente: Emergencias y Alta arriba. Dentro de la misma urgencia, el más antiguo primero.
  return list.sort((a, b) => {
    const getScore = (s) => {
      if (s.es_emergencia) return 4
      if (s.nivel_urgencia === 'Alta') return 3
      if (s.nivel_urgencia === 'Media') return 2
      if (s.nivel_urgencia === 'Baja') return 1
      return 0
    }
    
    const scoreA = getScore(a)
    const scoreB = getScore(b)
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA
    }
    
    const dateA = new Date(a.fecha_ingreso || 0).getTime()
    const dateB = new Date(b.fecha_ingreso || 0).getTime()
    return dateA - dateB
  })
})

const handleDateClick = (info) => {
  if (uiState.user?.role === 'USER') return
  clickedDate.value = info.dateStr
  showUnscheduledModal.value = true
}

const handleEventDrop = async (info) => {
  if (uiState.user?.role === 'USER') {
    showToast('🛑 No tienes permisos para reprogramar eventos.', 'error')
    info.revert()
    return
  }

  const ev = info.event
  const rawData = ev.extendedProps.raw
  const newDate = ev.startStr ? ev.startStr.slice(0, 10) : formatIsoDateOnly(ev.start)

  if (rawData.isSolicitud) {
    const res = await updateSolicitud(rawData.id_solicitud, {
      ...rawData,
      fecha_programada: newDate
    })
    if (res.success) {
      showToast('Solicitud reprogramada con éxito')
      await loadData()
    } else {
      showToast(`🛑 Error al reprogramar: ${res.error}`, 'error')
      info.revert()
    }
  } else {
    const res = await updateCalendarioEvento(rawData.id, {
      ...rawData,
      fecha_aniversario: newDate
    })
    if (res.success) {
      showToast('Evento de barrio reprogramado')
      await loadData()
    } else {
      showToast(`🛑 Error al reprogramar: ${res.error}`, 'error')
      info.revert()
    }
  }
}

const handleEventReceive = async (info) => {
  if (uiState.user?.role === 'USER') {
    showToast('🛑 No tienes permisos para agendar eventos.', 'error')
    info.revert()
    return
  }

  const ev = info.event
  const rawData = ev.extendedProps.raw
  const newDate = ev.startStr ? ev.startStr.slice(0, 10) : formatIsoDateOnly(ev.start)

  if (rawData && rawData.id_solicitud) {
    const res = await updateSolicitud(rawData.id_solicitud, {
      ...rawData,
      fecha_programada: newDate
    })
    if (res.success) {
      showToast('Solicitud agendada con éxito')
      await loadData()
    } else {
      showToast(`🛑 Error al agendar: ${res.error}`, 'error')
      info.revert()
    }
  } else {
    info.revert()
  }
}

const calendarOptions = reactive({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'es',
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana'
  },
  events: [],
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek'
  },
  editable: true,
  droppable: true,
  eventReceive: handleEventReceive,
  eventDrop: handleEventDrop,
  dateClick: handleDateClick,
  datesSet: (arg) => {
    currentMonthStart.value = arg.view.currentStart;
  },
  dayCellDidMount: (arg) => {
    const dateStr = formatIsoDateOnly(arg.date);
    const tieneFeriado = eventosBase.value.some(ev => {
      if (!ev.fecha_aniversario) return false;
      const evDate = formatIsoDateOnly(ev.fecha_aniversario);
      const esFeriado = ev.nombre_barrio && ev.nombre_barrio.startsWith('Feriado:');
      return evDate === dateStr && esFeriado;
    });

    if (tieneFeriado) {
      arg.el.classList.add('fc-day-feriado');
    }
  },
  eventMouseEnter: (info) => {
    tooltip.data = info.event.extendedProps.raw
    const rect = info.el.getBoundingClientRect()
    tooltip.x = rect.left + (rect.width / 2)
    tooltip.y = rect.top
    tooltip.visible = true
  },
  eventMouseLeave: () => {
    tooltip.visible = false
  },
  eventClick: (info) => {
    const ev = info.event.extendedProps.raw
    if (ev.isSolicitud) {
      if (uiState.user?.role === 'USER') return
      esDesdeAniversario.value = false
      selectedSolicitud.value = ev
      selectedSolicitudFecha.value = formatIsoDateOnly(ev.fecha_programada) || formatIsoDateOnly(new Date())
      showSolicitudModal.value = true
    } else {
      if (uiState.user?.role === 'USER') return
      currentEvent.id = ev.id
      currentEvent.nombre_barrio = ev.nombre_barrio
      currentEvent.fecha_aniversario = formatIsoDateOnly(ev.fecha_aniversario)
      currentEvent.presidente_barrio = ev.presidente_barrio
      currentEvent.telefono_presidente = ev.telefono_presidente
      currentEvent.color_etiqueta = ev.color_etiqueta || '#10b981'
      
      if (ev.nombre_barrio && ev.nombre_barrio.startsWith('Feriado:')) {
        isFeriado.value = true
        nombreFeriado.value = ev.nombre_barrio.replace(/^Feriado:\s*/, '')
      } else {
        isFeriado.value = false
        nombreFeriado.value = ''
      }
      
      showModal.value = true
    }
  }
})

const loadData = async () => {
  uiState.isLoading = true
  try {
    eventosBase.value = await fetchCalendario()
    
    // Mapear aniversarios y feriados
    // IMPORTANTE: el año en el DB es referencial — los eventos son anuales.
    // Siempre se usa el año actual del sistema para que aparezcan cada año.
    const thisYear = new Date().getFullYear()
    const calendarEvents = eventosBase.value.map(ev => {
      let finalColor = ev.color_etiqueta || '#10b981'
      if (ev.nombre_barrio && ev.nombre_barrio.startsWith('Feriado:')) {
        finalColor = '#ef4444' // Rojo
      } else {
        const barrioObj = store.barrios.find(b => b.nombre === ev.nombre_barrio)
        if (barrioObj) {
          finalColor = getDistritoColor(barrioObj.id_distrito)
        }
      }

      // Extraer solo MM-DD del DB y asignar el año actual
      const rawDate = formatIsoDateOnly(ev.fecha_aniversario) // 'YYYY-MM-DD'
      const monthDay = rawDate ? rawDate.slice(5) : null      // 'MM-DD'
      const eventDate = monthDay ? `${thisYear}-${monthDay}` : rawDate

      return {
        id: `event-${ev.id}`,
        title: ev.nombre_barrio,
        date: eventDate,
        backgroundColor: finalColor,
        borderColor: 'transparent',
        editable: !ev.nombre_barrio.startsWith('Feriado:'),
        extendedProps: { raw: { ...ev, color_etiqueta: finalColor } }
      }
    })

    // Mapear solicitudes de poda programadas
    const solicitudesEventos = store.solicitudes
      .filter(s => s.fecha_programada || (s.estado_tramite === 'Terminado' && s.fecha_ejecucion))
      .map(s => {
        let finalColor = '#3b82f6'; // Azul
        if (s.estado_tramite === 'En proceso') {
          finalColor = '#f59e0b'; // Naranja/Ámbar
        } else if (s.estado_tramite === 'Terminado') {
          finalColor = '#10b981'; // Verde
        }

        const fechaBase = s.estado_tramite === 'Terminado' ? s.fecha_ejecucion : s.fecha_programada;
        
        return {
          id: `sol-${s.id_solicitud}`,
          title: s.comunicacion_interna || s.codigo_anual,
          date: formatIsoDateOnly(fechaBase),
          backgroundColor: finalColor,
          borderColor: 'transparent',
          classNames: s.estado_tramite === 'Terminado' ? ['opacity-50', 'line-through'] : [],
          editable: s.estado_tramite !== 'Terminado',
          extendedProps: { raw: { ...s, isSolicitud: true } }
        }
      })

    calendarOptions.events = [...calendarEvents, ...solicitudesEventos]
    calendarKey.value++
  } catch (error) {
    showToast('Error al cargar datos del calendario', 'error')
  } finally {
    uiState.isLoading = false
  }
}

let draggableInstance = null

onMounted(async () => {
  uiState.isLoading = true
  try {
    if (!store.solicitudes.length) {
      await fetchSolicitudes()
    }
    if (!store.barrios.length && typeof window.fetchCatalogos === 'function') {
      await window.fetchCatalogos()
    }
    await loadData()

    // Inicializar arrastre externo de la barra lateral
    const containerEl = document.getElementById('unscheduled-events-list')
    if (containerEl) {
      draggableInstance = new Draggable(containerEl, {
        itemSelector: '.draggable-event-card',
        eventData: (eventEl) => {
          const solId = eventEl.getAttribute('data-solicitud-id')
          const solData = store.solicitudes.find(s => String(s.id_solicitud) === String(solId))
          
          let finalColor = '#3b82f6'
          if (solData?.estado_tramite === 'En proceso') {
            finalColor = '#f59e0b'
          }

          return {
            id: `sol-${solId}`,
            title: solData?.comunicacion_interna || solData?.codigo_anual,
            backgroundColor: finalColor,
            borderColor: 'transparent',
            editable: true,
            extendedProps: { raw: { ...solData, isSolicitud: true } }
          }
        }
      })
    }
  } catch (err) {
    showToast('Error de inicialización', 'error')
  } finally {
    uiState.isLoading = false
  }
})

const openModal = () => {
  currentEvent.id = null
  currentEvent.nombre_barrio = ''
  currentEvent.fecha_aniversario = ''
  currentEvent.presidente_barrio = ''
  currentEvent.telefono_presidente = ''
  currentEvent.color_etiqueta = '#10b981'
  nombreFeriado.value = ''
  isFeriado.value = false
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

// Abrir el detalle de una solicitud directamente desde el modal de aniversario
const abrirDetalleDesdeAniversario = (sol) => {
  closeModal()
  esDesdeAniversario.value = true
  selectedSolicitud.value = sol
  selectedSolicitudFecha.value = formatIsoDateOnly(sol.fecha_programada) || formatIsoDateOnly(new Date())
  showSolicitudModal.value = true
}

const saveEvent = async () => {
  if (isFeriado.value) {
    if (!nombreFeriado.value || nombreFeriado.value.trim() === '') {
      showToast('🛑 Ingrese el nombre del feriado.', 'error')
      return
    }
    currentEvent.nombre_barrio = `Feriado: ${nombreFeriado.value.trim()}`
    currentEvent.color_etiqueta = '#ef4444'
    currentEvent.presidente_barrio = ''
    currentEvent.telefono_presidente = ''
  } else {
    if (!currentEvent.nombre_barrio) {
      showToast('🛑 Seleccione un barrio.', 'error')
      return
    }
    const barrioObj = store.barrios.find(b => b.nombre === currentEvent.nombre_barrio)
    if (barrioObj) {
      currentEvent.color_etiqueta = getDistritoColor(barrioObj.id_distrito)
    } else {
      currentEvent.color_etiqueta = '#10b981'
    }
  }

  if (!isFeriado.value && currentEvent.nombre_barrio) {
    const dup = eventosBase.value.find(ev => 
      ev.nombre_barrio && 
      ev.nombre_barrio.toLowerCase() === currentEvent.nombre_barrio.toLowerCase() && 
      ev.id != currentEvent.id
    );
    if (dup) {
      showToast(`🛑 El barrio "${currentEvent.nombre_barrio}" ya tiene un aniversario registrado.`, 'error', 5000);
      return;
    }
  }

  let res;
  if (currentEvent.id) {
    res = await updateCalendarioEvento(currentEvent.id, currentEvent)
    if (res.success) {
      showToast('Aniversario guardado con éxito')
      closeModal()
      await loadData()
    } else {
      showToast(`🛑 Error al actualizar: ${res.error}`, 'error', 5000)
    }
  } else {
    res = await addCalendarioEvento(currentEvent)
    if (res.success) {
      showToast('Aniversario guardado con éxito')
      closeModal()
      await loadData()
    } else {
      showToast(`🛑 Error al guardar: ${res.error}`, 'error', 5000)
    }
  }
}

const handleDelete = async () => {
  mostrarConfirmacion(
    'Confirmar Eliminación',
    '¿Está seguro que desea eliminar este evento?',
    async () => {
      const ok = await deleteCalendarioEvento(currentEvent.id)
      if (ok) {
        showToast('Evento eliminado correctamente')
        closeModal()
        await loadData()
      } else {
        showToast('Error al eliminar el evento', 'error')
      }
    }
  )
}

// Agendar desde Modal DateClick
const agendarParaFecha = async (solicitud) => {
  const res = await updateSolicitud(solicitud.id_solicitud, {
    ...solicitud,
    fecha_programada: clickedDate.value
  })
  if (res.success) {
    showToast('Solicitud agendada con éxito')
    showUnscheduledModal.value = false
    await loadData()
  } else {
    showToast(`🛑 Error al agendar: ${res.error}`, 'error')
  }
}

// Abrir Modal de agendamiento directo desde el Sidebar
const abrirAgendarModalDirecto = (sol) => {
  selectedSolicitudSidebar.value = sol
  selectedSidebarScheduleDate.value = formatIsoDateOnly(new Date())
  showSidebarScheduleModal.value = true
}

const saveSidebarSchedule = async () => {
  const res = await updateSolicitud(selectedSolicitudSidebar.value.id_solicitud, {
    ...selectedSolicitudSidebar.value,
    fecha_programada: selectedSidebarScheduleDate.value
  })
  if (res.success) {
    showToast('Solicitud agendada con éxito')
    showSidebarScheduleModal.value = false
    await loadData()
  } else {
    showToast(`🛑 Error al agendar: ${res.error}`, 'error')
  }
}

// Guardar fecha reprogramada de Solicitud en Calendario
const saveSolicitudFecha = async () => {
  const res = await updateSolicitud(selectedSolicitud.value.id_solicitud, {
    ...selectedSolicitud.value,
    fecha_programada: selectedSolicitudFecha.value
  })
  if (res.success) {
    showToast('Programación de solicitud actualizada')
    showSolicitudModal.value = false
    await loadData()
  } else {
    showToast(`🛑 Error al actualizar: ${res.error}`, 'error')
  }
}

// Des-agendar solicitud (volver a dejar fecha_programada en null)
const desagendarSolicitud = async () => {
  if (esDesdeAniversario.value) {
    showToast('🛑 No se puede des-agendar porque este barrio está de aniversario y esta solicitud pertenece a este barrio.', 'error', 6000)
    return
  }

  if (!selectedSolicitud.value.fecha_programada) {
    showToast('🛑 Esta solicitud ya se encuentra sin fecha programada en el calendario.', 'warning')
    return
  }

  const res = await updateSolicitud(selectedSolicitud.value.id_solicitud, {
    ...selectedSolicitud.value,
    fecha_programada: null
  })
  if (res.success) {
    showToast('Solicitud removida del calendario')
    showSolicitudModal.value = false
    await loadData()
  } else {
    showToast(`🛑 Error al des-agendar: ${res.error}`, 'error')
  }
}

// Completar solicitud directamente desde el calendario
const completarSolicitudDirecto = async () => {
  const today = formatIsoDateOnly(new Date())
  const res = await updateSolicitud(selectedSolicitud.value.id_solicitud, {
    ...selectedSolicitud.value,
    estado_tramite: 'Terminado',
    fecha_ejecucion: today
  })
  if (res.success) {
    showToast('Solicitud completada con éxito')
    showSolicitudModal.value = false
    await loadData()
  } else {
    showToast(`🛑 Error al completar: ${res.error}`, 'error')
  }
}

// Formateador simple de fecha
const formatFecha = (str) => {
  if (!str) return '—'
  const f = new Date(str)
  // Formatear localmente para evitar desfases de zona horaria
  const utcDate = new Date(f.getTime() + f.getTimezoneOffset() * 60000)
  return utcDate.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
}
</script>

<style>
.sidebar-search-input::placeholder {
  color: var(--text-muted) !important;
  opacity: 0.65 !important;
}

/* Personalización de FullCalendar para que encaje con el tema Dark/Forest */
.fc-theme-standard .fc-scrollgrid { border-color: rgba(255,255,255,0.1); border-radius: 1rem; overflow: hidden; }
.fc-theme-standard td, .fc-theme-standard th { border-color: rgba(255,255,255,0.1); }
.fc .fc-toolbar-title { font-weight: 900; color: white; font-size: 1.5rem; }
.fc .fc-button-primary { background-color: rgba(255,255,255,0.1); border: none; font-weight: bold; border-radius: 0.5rem; text-transform: capitalize; }
.fc .fc-button-primary:hover { background-color: var(--accent); }
.fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: var(--accent); border-color: transparent; }
.fc-daygrid-day-number { color: rgba(255,255,255,0.8); font-weight: bold; padding: 8px !important; }
.fc-col-header-cell-cushion { color: rgba(255,255,255,0.8) !important; font-weight: 800; text-transform: uppercase; padding: 12px 0 !important; font-size: 0.75rem; }
.fc-event { cursor: pointer; border-radius: 4px; padding: 2px 4px; font-weight: bold; font-size: 0.75rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

/* Forzar fondos oscuros en celdas de días y cabeceras */
.fc-col-header-cell { background-color: #013b2e !important; }
.fc-daygrid-day { background-color: #02362b !important; }
.fc-daygrid-day.fc-day-sat, .fc-daygrid-day.fc-day-sun { background-color: #043e2f !important; }
.fc-daygrid-day.fc-day-feriado { background-color: #065f46 !important; }
.fc-daygrid-day.fc-day-today { background-color: #10b981 !important; }
.fc-daygrid-day.fc-day-today .fc-daygrid-day-number { color: #022c22 !important; }

/* Scrollbar personalizado */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

.scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}
.fade-confirm-enter-active, .fade-confirm-leave-active { transition: opacity 0.2s ease; }
.fade-confirm-enter-from, .fade-confirm-leave-to { opacity: 0; }
</style>
