<template>
    <div class="equipos-view p-6 h-full flex flex-col gap-6 animate-fade-in overflow-hidden text-main">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-card-main p-6 rounded-[2rem] shadow-sm border border-main">
            <div>
                <h2 class="text-2xl font-black text-main">Gestión de Equipos Operativos</h2>
                <p class="text-muted text-sm font-medium">Organiza las cuadrillas, asigna roles y gestiona turnos de rotación</p>
            </div>
            <div class="flex gap-2 bg-card-sec p-1.5 rounded-2xl border border-main">
                <div class="px-4 py-2 bg-card-main border border-main rounded-xl shadow-sm font-black text-xs text-accent uppercase tracking-wider">
                    3 Equipos Activos
                </div>
            </div>
        </div>

        <div class="flex-1 flex gap-6 overflow-hidden">
            <!-- Sidebar de Personal Disponible (Oculto para rol USER) -->
            <div v-if="uiState.user?.role !== 'USER'" class="w-80 flex flex-col gap-4 shrink-0">
                <div class="bg-card-main p-5 rounded-[2rem] shadow-sm border border-main flex-1 flex flex-col overflow-hidden">
                    <h3 class="font-black text-main mb-3 flex items-center justify-between">
                        <span>Personal Disponible</span>
                        <span class="text-[10px] bg-card-sec border border-main px-2 py-1 rounded-lg text-muted font-black">{{ availablePersonnel.length }}</span>
                    </h3>
                    
                    <!-- Búsqueda en Personal Disponible -->
                    <div class="mb-4 relative">
                        <input v-model="searchDisponible" type="text" placeholder="Buscar por nombre..." 
                            class="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-card-sec border border-main text-main focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-semibold">
                        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs flex items-center justify-center">
                            <Search class="w-3.5 h-3.5" />
                        </span>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar transition-all"
                        @dragover.prevent
                        @dragenter="activeDragOverSidebar = true"
                        @dragleave="activeDragOverSidebar = false"
                        @drop="procesarSoltado($event, null)"
                        :class="{'border-2 border-dashed border-accent/40 bg-accent/5 rounded-2xl p-2': activeDragOverSidebar}">
                        <div v-for="p in filteredAvailablePersonnel" :key="p.id" 
                            :draggable="uiState.user?.role !== 'USER'"
                            @dragstart="iniciarArrastre($event, p.id)"
                            class="p-3 bg-card-sec hover:bg-accent-soft rounded-xl border border-main hover:border-accent hover:shadow-sm transition-all cursor-grab active:cursor-grabbing group">
                            <div class="flex items-center justify-between gap-2">
                                <div class="flex items-center gap-2 overflow-hidden">
                                    <div class="w-7 h-7 rounded-lg overflow-hidden bg-card-main border border-main flex items-center justify-center shrink-0">
                                        <img v-if="p.foto" :src="p.foto" class="w-full h-full object-cover">
                                        <span v-else class="font-black text-accent text-xs">{{ p.nombre?.[0].toUpperCase() }}</span>
                                    </div>
                                    <div class="overflow-hidden">
                                        <p class="text-xs font-black text-main truncate leading-tight">{{ p.nombre }}</p>
                                        <p class="text-[9px] text-muted font-bold truncate">{{ p.cargo || 'Sin Cargo' }}</p>
                                    </div>
                                </div>
                                <button @click="assignToAny(p)" 
                                    class="text-xs bg-accent text-on-accent w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-90 active:scale-95 cursor-pointer" 
                                    title="Asignar a primer equipo disponible">
                                    <Plus class="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div v-if="filteredAvailablePersonnel.length === 0" class="py-8 text-center text-xs text-muted font-semibold">
                            No hay personal disponible.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Panel de Equipos (Grid) -->
            <div class="flex-1 grid gap-6 overflow-y-auto pr-1 pb-6 custom-scrollbar"
                :class="uiState.user?.role === 'USER' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'">
                <div v-for="n in 3" :key="n" 
                    class="bg-card-main rounded-[2rem] shadow-sm border border-main overflow-hidden flex flex-col border-t-8"
                    :style="{ borderTopColor: teamColors[n-1] }">
                    
                    <!-- Header Equipo -->
                    <div class="p-6 border-b border-main flex justify-between items-start bg-card-sec">
                        <div>
                            <h4 class="text-lg font-black text-main">Equipo {{ n }}</h4>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="text-[10px] font-black text-muted uppercase tracking-widest">Turno:</span>
                                <select v-model="teamShifts[n-1]" :disabled="uiState.user?.role === 'USER'"
                                    class="bg-transparent font-black text-xs text-accent outline-none border-b border-main focus:border-accent cursor-pointer disabled:cursor-not-allowed disabled:border-none p-0">
                                    <option v-for="s in shifts" :key="s.id" :value="s.id">{{ s.label }} ({{ s.time }})</option>
                                </select>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-black text-muted uppercase tracking-widest">Integrantes</p>
                            <p class="text-lg font-black text-main">{{ getTeamPersonnel(n).length }}</p>
                        </div>
                    </div>

                    <!-- Lista de Integrantes (Con scroll interno y max-h para solucionar el bug de desbordamiento) -->
                    <div class="p-6 flex-1 space-y-3 min-h-[400px] overflow-y-auto custom-scrollbar max-h-[480px] transition-all"
                        @dragover.prevent
                        @dragenter="activeDragOverTeam = n"
                        @dragleave="activeDragOverTeam === n ? activeDragOverTeam = null : null"
                        @drop="procesarSoltado($event, n)"
                        :class="{'border-2 border-dashed border-accent/40 bg-accent/5 rounded-2xl m-2': activeDragOverTeam === n}">
                        <div v-for="p in getTeamPersonnel(n)" :key="p.id" 
                            :draggable="uiState.user?.role !== 'USER'"
                            @dragstart="iniciarArrastre($event, p.id)"
                            class="flex items-center justify-between p-3.5 bg-card-sec rounded-2xl border border-main group transition-all cursor-grab active:cursor-grabbing hover:bg-accent-soft">
                            <div class="flex items-center gap-3 overflow-hidden">
                                <div class="w-9 h-9 rounded-xl overflow-hidden bg-card-main border border-main flex items-center justify-center shadow-sm shrink-0">
                                    <img v-if="p.foto" :src="p.foto" class="w-full h-full object-cover">
                                    <span v-else class="font-black text-accent text-sm">{{ p.nombre?.[0].toUpperCase() }}</span>
                                </div>
                                <div class="overflow-hidden">
                                    <p class="text-xs font-black text-main truncate leading-tight" :title="p.nombre">{{ p.nombre }}</p>
                                    <div class="mt-1 flex items-center">
                                        <span class="text-[9px] font-black uppercase bg-accent/10 text-accent rounded-md px-1.5 py-0.5">
                                            {{ p.cargo || 'Sin Cargo' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button v-if="uiState.user?.role !== 'USER'" @click="removeFromTeam(p)" 
                                class="text-muted hover:text-red-500 transition-colors shrink-0 p-1 rounded-lg hover:bg-red-55 flex items-center justify-center cursor-pointer"
                                title="Quitar del equipo">
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div v-if="getTeamPersonnel(n).length === 0" class="h-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-main rounded-2xl py-12">
                            <UserMinus class="w-8 h-8 text-muted mb-2 animate-pulse" />
                            <p class="text-xs font-black uppercase tracking-wide">Sin personal asignado</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, updateCatalogo, showToast } = mainStore

import { Search, Plus, Trash2, UserMinus } from 'lucide-vue-next'

const teamColors = ['#10b981', '#3b82f6', '#f59e0b']

const shifts = [
    { id: 'morning', label: 'Mañana', time: '04:00 - 12:00' },
    { id: 'afternoon', label: 'Tarde', time: '14:00 - 19:00' },
    { id: 'night', label: 'Noche', time: '19:00 - 02:00' }
]

// Estado local para turnos (se podría persistir en config_sistema o tabla de la base de datos)
const teamShifts = ref(['morning', 'morning', 'afternoon'])

// Búsqueda en sidebar
const searchDisponible = ref('')

// Control visual del arrastre
const activeDragOverTeam = ref(null)
const activeDragOverSidebar = ref(false)

const iniciarArrastre = (event, personId) => {
    event.dataTransfer.dropEffect = 'move'
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('personId', personId)
}

const procesarSoltado = async (event, targetTeamId) => {
    activeDragOverTeam.value = null
    activeDragOverSidebar.value = false
    
    // Si no tiene permisos, no hacer nada
    if (uiState.user?.role === 'USER') return

    const personId = parseInt(event.dataTransfer.getData('personId'))
    const p = store.tecnicos.find(t => t.id === personId)
    if (!p) return

    // Si se arrastra al sidebar (targetTeamId === null)
    if (targetTeamId === null) {
        if (p.id_equipo) {
            await removeFromTeam(p)
        }
        return
    }

    // Si el equipo destino es el mismo, no hacer nada
    if (p.id_equipo == targetTeamId) return

    await assignToTeam(p, targetTeamId)
}

const availablePersonnel = computed(() => {
    return store.tecnicos.filter(p => !p.id_equipo)
})

const filteredAvailablePersonnel = computed(() => {
    if (!searchDisponible.value) return availablePersonnel.value
    const search = searchDisponible.value.toLowerCase()
    return availablePersonnel.value.filter(p => p.nombre.toLowerCase().includes(search))
})

const getTeamPersonnel = (teamId) => {
    return store.tecnicos.filter(p => p.id_equipo == teamId)
}

const assignToAny = async (p) => {
    // Asignar inteligentemente al equipo con menor cantidad de personal actualmente (de 1 a 3)
    let bestTeam = 1
    let minMembers = getTeamPersonnel(1).length
    for (let i = 2; i <= 3; i++) {
        const count = getTeamPersonnel(i).length
        if (count < minMembers) {
            minMembers = count
            bestTeam = i
        }
    }
    await assignToTeam(p, bestTeam)
}

const assignToTeam = async (p, teamId) => {
    const ok = await updateCatalogo('tecnicos', p.id, { id_equipo: teamId, rol_equipo: p.cargo || 'Sin Rol' })
    if (ok === true) showToast(`${p.nombre} asignado al Equipo ${teamId}`, 'success')
}

const removeFromTeam = async (p) => {
    const ok = await updateCatalogo('tecnicos', p.id, { id_equipo: null, rol_equipo: null })
    if (ok === true) showToast(`${p.nombre} liberado del equipo`, 'success')
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

/* Custom scrollbar matching app style */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
</style>
