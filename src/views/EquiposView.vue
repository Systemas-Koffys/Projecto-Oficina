<template>
    <div class="equipos-view p-6 h-full flex flex-col gap-6 animate-fade-in overflow-hidden">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark-card p-6 rounded-3xl shadow-sm border border-gray-100">
            <div>
                <h2 class="text-2xl font-black text-gray-800 dark-text">Gestión de Equipos Operativos</h2>
                <p class="text-gray-500 text-sm font-medium">Organiza las cuadrillas, asigna roles y gestiona turnos de rotación</p>
            </div>
            <div class="flex gap-2 bg-gray-100 dark-bg p-1.5 rounded-2xl border border-gray-200">
                <div class="px-4 py-2 bg-white dark-card rounded-xl shadow-sm font-black text-xs text-emerald-600">4 EQUIPOS ACTIVOS</div>
            </div>
        </div>

        <div class="flex-1 flex gap-6 overflow-hidden">
            <!-- Sidebar de Personal Disponible -->
            <div class="w-80 flex flex-col gap-4">
                <div class="bg-white dark-card p-5 rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
                    <h3 class="font-black text-gray-800 dark-text mb-4 flex items-center justify-between">
                        <span>Personal Disponible</span>
                        <span class="text-[10px] bg-gray-100 dark-bg px-2 py-1 rounded-lg text-gray-400">{{ availablePersonnel.length }}</span>
                    </h3>
                    
                    <div class="flex-1 overflow-y-auto space-y-2 pr-2">
                        <div v-for="p in availablePersonnel" :key="p.id" 
                            class="p-3 bg-gray-50 dark-bg rounded-xl border border-transparent hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100 transition-all cursor-pointer group">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-bold text-gray-700 dark-text group-hover:text-emerald-600">{{ p.nombre }}</span>
                                <button @click="assignToAny(p)" class="text-xs bg-emerald-600 text-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Panel de Equipos (Grid 2x2) -->
            <div class="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-6">
                <div v-for="n in 4" :key="n" 
                    class="bg-white dark-card rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col border-t-8"
                    :style="{ borderTopColor: teamColors[n-1] }">
                    
                    <!-- Header Equipo -->
                    <div class="p-6 border-b border-gray-50 dark-border flex justify-between items-start bg-gray-50/30 dark-bg">
                        <div>
                            <h4 class="text-xl font-black text-gray-800 dark-text">Equipo {{ n }}</h4>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turno:</span>
                                <select v-model="teamShifts[n-1]" class="bg-transparent font-black text-xs text-emerald-600 outline-none border-b-2 border-emerald-100 focus:border-emerald-500 cursor-pointer">
                                    <option v-for="s in shifts" :key="s.id" :value="s.id">{{ s.label }} ({{ s.time }})</option>
                                </select>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Integrantes</p>
                            <p class="text-xl font-black text-gray-800 dark-text">{{ getTeamPersonnel(n).length }}/6</p>
                        </div>
                    </div>

                    <!-- Lista de Integrantes -->
                    <div class="p-6 flex-1 space-y-3 min-h-[300px]">
                        <div v-for="p in getTeamPersonnel(n)" :key="p.id" 
                            class="flex items-center justify-between p-4 bg-gray-50 dark-bg rounded-2xl border border-gray-100 dark-border group">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-white dark-card flex items-center justify-center text-xs shadow-sm">👤</div>
                                <div>
                                    <p class="text-sm font-black text-gray-800 dark-text">{{ p.nombre }}</p>
                                    <select v-model="p.rol_equipo" @change="updateRole(p)" 
                                        class="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 rounded-md px-2 py-0.5 outline-none border-none">
                                        <option value="Sin Rol">Elegir Rol</option>
                                        <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
                                    </select>
                                </div>
                            </div>
                            <button @click="removeFromTeam(p)" class="text-gray-300 hover:text-red-500 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                            </button>
                        </div>
                        
                        <div v-if="getTeamPersonnel(n).length === 0" class="h-full flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl py-12">
                            <span class="text-4xl mb-2">📥</span>
                            <p class="text-sm font-bold">Sin personal asignado</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, updateCatalogo, showToast } = mainStore

const teamColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
const roles = ['Chofer', 'Técnico', 'Podador', 'Cargador']
const shifts = [
    { id: 'morning', label: 'Mañana', time: '04:00 - 12:00' },
    { id: 'afternoon', label: 'Tarde', time: '14:00 - 19:00' },
    { id: 'night', label: 'Noche', time: '19:00 - 02:00' }
]

// Estado local para turnos (se podría persistir en una tabla config_equipos si fuera necesario)
const teamShifts = ref(['morning', 'morning', 'afternoon', 'night'])

const availablePersonnel = computed(() => {
    return store.tecnicos.filter(p => !p.id_equipo)
})

const getTeamPersonnel = (teamId) => {
    return store.tecnicos.filter(p => p.id_equipo === teamId)
}

const assignToAny = async (p) => {
    // Buscar primer equipo con espacio
    for (let i = 1; i <= 4; i++) {
        if (getTeamPersonnel(i).length < 6) {
            await assignToTeam(p, i)
            break
        }
    }
}

const assignToTeam = async (p, teamId) => {
    const ok = await updateCatalogo('tecnicos', p.id, { id_equipo: teamId, rol_equipo: 'Sin Rol' })
    if (ok) showToast(`${p.nombre} asignado al Equipo ${teamId}`, 'success')
}

const removeFromTeam = async (p) => {
    const ok = await updateCatalogo('tecnicos', p.id, { id_equipo: null, rol_equipo: null })
    if (ok) showToast(`${p.nombre} liberado del equipo`, 'success')
}

const updateRole = async (p) => {
    await updateCatalogo('tecnicos', p.id, { rol_equipo: p.rol_equipo })
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

/* Scrollbar sutil */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
