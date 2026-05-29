<template>
    <div class="personal-view p-6 h-full flex flex-col space-y-6 animate-fade-in overflow-y-auto">
        
        <!-- ESTADÍSTICAS SUPERIORES -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
            <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4">
                <div class="w-12 h-12 bg-accent/20 text-accent rounded-2xl flex items-center justify-center text-xl">👥</div>
                <div>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Total</p>
                    <p class="text-2xl font-black">{{ store.tecnicos.length }}</p>
                </div>
            </div>
            <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4 border-l-4 border-l-blue-500">
                <div class="w-12 h-12 bg-blue-100/20 text-blue-600 rounded-2xl flex items-center justify-center text-xl">👷</div>
                <div>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Técnicos</p>
                    <p class="text-2xl font-black">{{ store.tecnicos.filter(t => t.cargo?.includes('Técnico')).length }}</p>
                </div>
            </div>
            <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4 border-l-4 border-l-purple-500">
                <div class="w-12 h-12 bg-purple-100/20 text-purple-600 rounded-2xl flex items-center justify-center text-xl">🚐</div>
                <div>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logística/Chofer</p>
                    <p class="text-2xl font-black">{{ store.tecnicos.filter(t => t.cargo?.includes('Chofer')).length }}</p>
                </div>
            </div>
            <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4 border-l-4 border-l-orange-500">
                <div class="w-12 h-12 bg-orange-100/20 text-orange-600 rounded-2xl flex items-center justify-center text-xl">🛡️</div>
                <div>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Permanentes</p>
                    <p class="text-2xl font-black">{{ store.tecnicos.filter(t => t.tipo_contrato?.includes('Permanente')).length }}</p>
                </div>
            </div>
        </div>

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-6 rounded-[2.5rem] shadow-sm border border-border no-print">
            <h2 class="text-2xl font-black">Directorio General de Personal</h2>
            
            <div class="flex items-center gap-4 w-full md:w-auto">
                <div class="relative flex-1 md:w-64">
                    <input v-model="search" type="text" placeholder="Buscar por nombre..." 
                        class="w-full pl-10 pr-4 py-3 rounded-2xl border border-border focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-bold text-sm">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
                </div>
                <button @click="openNew" class="px-6 py-4 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all">
                    + Registrar Personal
                </button>
            </div>
        </div>

        <!-- TABLA DE PERSONAL -->
        <div class="flex-1 bg-card rounded-3xl shadow-sm border border-border overflow-hidden no-print">
            <div class="overflow-x-auto p-4">
                <table class="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr class="text-[10px] font-black uppercase text-muted tracking-widest">
                            <th class="px-6 py-2 text-center">#</th>
                            <th class="px-6 py-2">Funcionario</th>
                            <th class="px-6 py-2">Cargo Institucional</th>
                            <th class="px-6 py-2">Contrato</th>
                            <th class="px-6 py-2 text-center">Nacimiento</th>
                            <th class="px-6 py-2 text-center">Antigüedad</th>
                            <th class="px-6 py-2 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(p, index) in filteredPersonal" :key="p.id" class="bg-main hover:bg-accent/5 transition-all group">
                            <td class="px-6 py-4 rounded-l-2xl border-y border-l border-border text-center font-black text-muted text-sm">
                                {{ index + 1 }}
                            </td>
                            <td class="px-6 py-4 border-y border-border">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-xl bg-card overflow-hidden shadow-sm border border-border flex items-center justify-center">
                                        <img v-if="p.foto" :src="p.foto" class="w-full h-full object-cover">
                                        <span v-else class="font-black text-accent text-lg">{{ p.nombre?.[0].toUpperCase() }}</span>
                                    </div>
                                    <span class="font-black text-sm text-main">{{ p.nombre }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 border-y border-border text-main">
                                <span class="font-bold text-xs">{{ p.cargo || '---' }}</span>
                            </td>
                            <td class="px-6 py-4 border-y border-border">
                                <span class="px-2 py-1 bg-card border border-border rounded-lg text-[9px] font-black text-muted uppercase">{{ p.tipo_contrato }}</span>
                            </td>
                            <td class="px-6 py-4 border-y border-border text-center text-[10px] font-bold text-muted">
                                {{ formatDate(p.fecha_nacimiento) }}
                            </td>
                            <td class="px-6 py-4 border-y border-border text-center font-black text-accent text-[10px]">
                                {{ calculateSeniority(p.fecha_ingreso) }}
                            </td>
                            <td class="px-6 py-4 rounded-r-2xl border-y border-r border-border">
                                <div class="flex items-center justify-center gap-2">
                                    <button @click="openView(p)" class="w-10 h-10 flex items-center justify-center bg-card text-accent border border-border rounded-xl shadow-sm hover:bg-accent hover:text-white transition-all" title="Ver Credencial">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                    </button>
                                    <button @click="openEdit(p)" class="w-10 h-10 flex items-center justify-center bg-card text-blue-600 border border-border rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all" title="Editar">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                    <button v-if="uiState.user?.role === 'ROOT'" @click="handleDelete(p)" class="w-10 h-10 flex items-center justify-center bg-card text-red-500 border border-border rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition-all" title="Eliminar">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- MODAL DE VISTA (CREDENCIAL PROFESIONAL) -->
        <div v-if="viewPerson" class="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-[100] no-print">
            <div class="bg-card rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border-8 border-border">
                
                <!-- Cabecera Institucional -->
                <div class="bg-accent p-8 text-white flex justify-between items-center relative overflow-hidden">
                    <div class="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                        <svg class="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l8.15 14.55H3.85L12 5.45z"/></svg>
                    </div>
                    <div class="relative z-10">
                        <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Gobierno Autónomo Municipal</p>
                        <h4 class="text-xl font-black tracking-tighter">FICHA DE PERSONAL</h4>
                    </div>
                    <button @click="viewPerson = null" class="relative z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-2xl font-light transition-all">&times;</button>
                </div>

                <div class="p-10 -mt-8 relative z-10">
                    <!-- Foto / Inicial -->
                    <div class="flex justify-center mb-8">
                        <div class="w-40 h-40 bg-card rounded-[3rem] p-2 shadow-2xl relative">
                            <div class="w-full h-full bg-accent text-white rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-inner overflow-hidden">
                                <img v-if="viewPerson.foto" :src="viewPerson.foto" class="w-full h-full object-cover">
                                <span v-else>{{ viewPerson.nombre?.[0] }}</span>
                            </div>
                            <div class="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 border-4 border-card rounded-2xl flex items-center justify-center shadow-lg">
                                <span class="text-white text-lg">✓</span>
                            </div>
                        </div>
                    </div>

                    <!-- Datos Personales -->
                    <div class="text-center mb-8">
                        <h3 class="text-2xl font-black uppercase tracking-tighter text-main leading-none">{{ viewPerson.nombre }}</h3>
                        <div class="flex items-center justify-center gap-2 mt-4">
                            <span class="px-4 py-1.5 bg-accent/20 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest border border-accent/10">{{ viewPerson.cargo }}</span>
                            <span class="px-4 py-1.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-600/20">{{ viewPerson.tipo_sangre }}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-main/50 p-5 rounded-3xl border border-border">
                            <p class="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Contrato</p>
                            <p class="text-xs font-black text-main">{{ viewPerson.tipo_contrato }}</p>
                        </div>
                        <div class="bg-main/50 p-5 rounded-3xl border border-border">
                            <p class="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Antigüedad</p>
                            <p class="text-xs font-black text-accent">{{ calculateSeniority(viewPerson.fecha_ingreso) }}</p>
                        </div>
                        <div class="bg-main/50 p-5 rounded-3xl border border-border">
                            <p class="text-[9px] font-black text-muted uppercase tracking-widest mb-1">F. Nacimiento</p>
                            <p class="text-xs font-black text-main">{{ formatDate(viewPerson.fecha_nacimiento) }}</p>
                        </div>
                        <div class="bg-red-500/5 p-5 rounded-3xl border border-red-500/10">
                            <p class="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Emergencia</p>
                            <p class="text-xs font-black text-red-600 leading-tight">{{ viewPerson.celular_emergencia }}</p>
                            <p class="text-[8px] text-red-400 font-bold truncate">{{ viewPerson.contacto_emergencia }}</p>
                        </div>
                    </div>

                    <!-- Botón Imprimir -->
                    <div class="mt-10 flex gap-4">
                        <button @click="handlePrint" class="flex-1 py-4 bg-accent text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-accent/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Imprimir Credencial
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL DE EDICIÓN -->
        <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] no-print">
            <div class="bg-card rounded-[3.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in-up border border-white/10">
                <div class="p-10 bg-accent text-white flex justify-between items-center relative">
                    <div class="relative z-10">
                        <h4 class="text-3xl font-black uppercase tracking-tighter">{{ editingPerson ? 'Editar Perfil' : 'Nuevo Funcionario' }}</h4>
                        <p class="text-xs opacity-80 font-black uppercase tracking-[0.2em] mt-1">{{ formData.nombre || 'Completa los datos técnicos' }}</p>
                    </div>
                    <button @click="showModal = false" class="relative z-10 text-4xl font-light hover:rotate-90 transition-all">&times;</button>
                </div>
                
                <form @submit.prevent="saveData" class="p-10 grid grid-cols-3 gap-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <!-- Foto Upload Section -->
                    <div class="col-span-3 flex items-center gap-8 p-6 bg-app rounded-[2.5rem] border-2 border-dashed border-border mb-4">
                        <div class="relative group">
                            <div class="w-24 h-24 bg-card rounded-2xl border-2 border-border overflow-hidden flex items-center justify-center shadow-lg">
                                <img v-if="formData.foto" :src="formData.foto" class="w-full h-full object-cover">
                                <span v-else class="text-4xl">👤</span>
                            </div>
                            <label class="absolute -bottom-2 -right-2 w-8 h-8 bg-accent text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all">
                                📷
                                <input type="file" @change="handleFotoUpload" class="hidden" accept="image/*">
                            </label>
                        </div>
                        <div>
                            <p class="font-black text-main text-sm">Fotografía del Funcionario</p>
                            <p class="text-xs text-muted font-medium mt-1">Recomendado: Cuadrada, fondo claro. Máx 2MB.</p>
                            <button v-if="formData.foto" type="button" @click="formData.foto = ''" class="text-[10px] font-black text-red-500 uppercase mt-2 tracking-widest hover:underline">Eliminar foto</button>
                        </div>
                    </div>

                    <div class="col-span-3">
                        <label class="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-2">Nombre Completo del Personal</label>
                        <input v-model="formData.nombre" type="text" required class="w-full px-6 py-4 rounded-2xl bg-app border-2 border-border focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all font-black text-main" placeholder="Ej: Kevin Flores">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-2">Cargo Institucional</label>
                        <select v-model="formData.cargo" required class="w-full px-6 py-4 rounded-2xl bg-app border-2 border-border focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all font-black text-main">
                            <option v-for="c in cargos" :key="c" :value="c">{{ c }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-2">Tipo de Contrato</label>
                        <select v-model="formData.tipo_contrato" required class="w-full px-6 py-4 rounded-2xl bg-app border-2 border-border focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all font-black text-main">
                            <option v-for="t in ['Permanente (Ítem)', 'Eventual (Consultor)', 'Pasante/Práctica', 'Contrato Externo']" :key="t" :value="t">{{ t }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-2">G. Sanguíneo</label>
                        <select v-model="formData.tipo_sangre" class="w-full px-6 py-4 rounded-2xl bg-app border-2 border-border focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all font-black text-main">
                            <option v-for="t in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']" :key="t" :value="t">{{ t }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-2">Fecha de Ingreso</label>
                        <input v-model="formData.fecha_ingreso" type="date" class="w-full px-6 py-4 rounded-2xl bg-app border-2 border-border focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all font-black text-main">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-2">F. Nacimiento</label>
                        <input v-model="formData.fecha_nacimiento" type="date" class="w-full px-6 py-4 rounded-2xl bg-app border-2 border-border focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all font-black text-main">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-2">Celular de Contacto</label>
                        <input v-model="formData.celular" type="text" class="w-full px-6 py-4 rounded-2xl bg-app border-2 border-border focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all font-black text-main" placeholder="777XXXXX">
                    </div>

                    <div class="col-span-3 grid grid-cols-2 gap-6 pt-6 border-t border-border bg-red-500/5 p-6 rounded-[2rem] border-dashed">
                        <div>
                            <label class="block text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 ml-2">Referencia de Emergencia</label>
                            <input v-model="formData.contacto_emergencia" type="text" class="w-full px-6 py-4 rounded-2xl bg-white border-2 border-red-500/10 focus:border-red-500 outline-none transition-all font-black text-main" placeholder="Ej: Madre / Esposa">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 ml-2">Celular Emergencia</label>
                            <input v-model="formData.celular_emergencia" type="text" class="w-full px-6 py-4 rounded-2xl bg-white border-2 border-red-500/10 focus:border-red-500 outline-none transition-all font-black text-main" placeholder="Número urgente">
                        </div>
                    </div>

                    <div class="col-span-3 flex gap-4 pt-4">
                        <button type="button" @click="showModal = false" class="flex-1 py-5 rounded-2xl bg-app border-2 border-border font-black text-muted uppercase text-xs tracking-widest hover:bg-main/5 transition-all">Cancelar</button>
                        <button type="submit" class="flex-[2] py-5 bg-accent text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.01] active:scale-95 transition-all">
                            {{ editingPerson ? 'Actualizar Funcionario' : 'Finalizar Registro' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- AREA DE IMPRESIÓN (CREDENCIAL) -->
        <div v-if="viewPerson" class="hidden print:block print:p-0">
            <div class="w-[350px] mx-auto bg-white border-[3px] border-black rounded-[2.5rem] overflow-hidden shadow-none">
                <div class="bg-black p-6 text-white text-center">
                    <p class="text-[8px] font-black uppercase tracking-[0.3em] mb-1">Gobierno Autónomo Municipal</p>
                    <h2 class="text-xl font-black tracking-tighter">CREDENCIAL DE PERSONAL</h2>
                </div>
                <div class="p-10">
                    <div class="flex justify-center mb-8">
                        <div class="w-32 h-32 border-[3px] border-black rounded-[2rem] overflow-hidden flex items-center justify-center">
                            <img v-if="viewPerson.foto" :src="viewPerson.foto" class="w-full h-full object-cover">
                            <span v-else class="text-5xl font-black text-black">{{ viewPerson.nombre?.[0] }}</span>
                        </div>
                    </div>
                    <div class="text-center mb-8">
                        <h3 class="text-2xl font-black text-gray-900 uppercase leading-tight">{{ viewPerson.nombre }}</h3>
                        <p class="text-sm font-black text-gray-600 uppercase mt-2">{{ viewPerson.cargo }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-6 border-t-2 border-gray-100 pt-6">
                        <div>
                            <p class="text-[7px] font-black text-gray-400 uppercase tracking-widest">Grupo Sanguíneo</p>
                            <p class="text-xs font-black">{{ viewPerson.tipo_sangre }}</p>
                        </div>
                        <div>
                            <p class="text-[7px] font-black text-gray-400 uppercase tracking-widest">Tipo de Contrato</p>
                            <p class="text-xs font-black">{{ viewPerson.tipo_contrato }}</p>
                        </div>
                        <div class="col-span-2 bg-red-50 p-4 rounded-2xl border border-red-100">
                            <p class="text-[8px] font-black text-red-500 uppercase tracking-widest">En Caso de Emergencia</p>
                            <p class="text-[11px] font-black text-red-700 mt-1">{{ viewPerson.celular_emergencia }}</p>
                            <p class="text-[9px] text-red-400 font-bold uppercase">{{ viewPerson.contacto_emergencia }}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 p-6 text-[8px] text-center text-gray-400 italic leading-relaxed">
                    Este documento es personal e intransferible. <br> Válido solo para fines institucionales y de seguridad.
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, updateCatalogo, deleteCatalogo, addCatalogo, showToast } = mainStore

const search = ref('')
const showModal = ref(false)
const editingPerson = ref(null)
const viewPerson = ref(null)

const cargos = [
    'Jefe de Unidad',
    'Encargado de área',
    'Técnico de sistemas',
    'Técnico de verificación',
    'Técnico de equipo',
    'Chofer',
    'Podador',
    'Cargador'
]

const formData = reactive({
    nombre: '',
    cargo: 'Técnico de sistemas',
    tipo_contrato: 'Permanente (Ítem)',
    fecha_ingreso: '',
    celular: '',
    fecha_nacimiento: '',
    tipo_sangre: 'O+',
    contacto_emergencia: '',
    celular_emergencia: '',
    foto: ''
})

const filteredPersonal = computed(() => {
    if (!search.value) return store.tecnicos
    return store.tecnicos.filter(p => p.nombre.toLowerCase().includes(search.value.toLowerCase()))
})

const formatDate = (dateStr) => {
    if (!dateStr) return '---'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

const calculateSeniority = (date) => {
    if (!date) return '---'
    const today = new Date()
    const entryDate = new Date(date)
    const diffTime = Math.abs(today - entryDate)
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25))
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44))
    return diffYears > 0 ? `${diffYears}a ${diffMonths}m` : `${diffMonths} meses`
}

const handleFotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
        formData.foto = event.target.result
    }
    reader.readAsDataURL(file)
}

const openNew = () => {
    editingPerson.value = null
    Object.keys(formData).forEach(key => {
        if (key === 'cargo') formData[key] = 'Técnico de sistemas'
        else if (key === 'tipo_contrato') formData[key] = 'Permanente (Ítem)'
        else if (key === 'tipo_sangre') formData[key] = 'O+'
        else formData[key] = ''
    })
    showModal.value = true
}

const openView = (p) => {
    viewPerson.value = p
}

const openEdit = (p) => {
    editingPerson.value = p
    Object.assign(formData, p)
    if (p.fecha_nacimiento) formData.fecha_nacimiento = new Date(p.fecha_nacimiento).toISOString().split('T')[0]
    if (p.fecha_ingreso) formData.fecha_ingreso = new Date(p.fecha_ingreso).toISOString().split('T')[0]
    showModal.value = true
}

const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar permanentemente a ${p.nombre}?`)) return
    const ok = await deleteCatalogo('tecnicos', p.id)
    if (ok) showToast('Personal eliminado', 'success')
}

const saveData = async () => {
    try {
        let ok = editingPerson.value 
            ? await updateCatalogo('tecnicos', editingPerson.value.id, formData) 
            : await addCatalogo('tecnicos', formData)
        
        if (ok) {
            showToast('Datos guardados correctamente', 'success')
            showModal.value = false
        } else {
            showToast('Error al guardar: Verifique el tamaño de la imagen', 'error')
        }
    } catch (e) {
        console.error(e)
        showToast('Error crítico de conexión', 'error')
    }
}

const handlePrint = () => {
    window.print()
}
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-fade-in-up {
    animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(40px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

@media print {
    .no-print { display: none !important; }
    body, .personal-view { background: white !important; margin: 0; padding: 0; }
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
</style>
