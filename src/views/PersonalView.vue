<template>
    <div class="personal-view p-6 space-y-6 animate-fade-in">
        
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
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Técnicos de Equipo</p>
                    <p class="text-2xl font-black">{{ store.tecnicos.filter(t => t.cargo === 'Técnico de equipo').length }}</p>
                </div>
            </div>
            <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4 border-l-4 border-l-purple-500">
                <div class="w-12 h-12 bg-purple-100/20 text-purple-600 rounded-2xl flex items-center justify-center text-xl">🚐</div>
                <div>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Choferes</p>
                    <p class="text-2xl font-black">{{ store.tecnicos.filter(t => t.cargo === 'Chofer').length }}</p>
                </div>
            </div>
            <div class="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex items-center gap-4 border-l-4 border-l-green-500">
                <div class="w-12 h-12 bg-green-100/20 text-green-700 rounded-2xl flex items-center justify-center text-xl">🌳</div>
                <div>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trepadores</p>
                    <p class="text-2xl font-black">{{ store.tecnicos.filter(t => t.cargo === 'Trepador').length }}</p>
                </div>
            </div>
        </div>

        <!-- Header -->
        <div class="bg-card p-6 rounded-[2.5rem] shadow-sm border border-border no-print space-y-4">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
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

            <!-- Filtros rápidos por cargo -->
            <div class="flex flex-wrap gap-2 pt-2 border-t border-border">
                <span class="text-[10px] font-black text-muted uppercase tracking-widest self-center mr-1">Filtrar:</span>
                <button
                    v-for="f in filtros"
                    :key="f.key"
                    @click="filterCargo = filterCargo === f.key ? '' : f.key"
                    :class="[
                        'px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border flex items-center gap-1.5',
                        filterCargo === f.key
                            ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                            : 'bg-main text-muted border-border hover:border-accent hover:text-accent'
                    ]"
                >
                    {{ f.label }}
                    <span :class="[
                        'text-[9px] font-black px-1.5 py-0.5 rounded-full',
                        filterCargo === f.key ? 'bg-white/20 text-white' : 'bg-border text-muted'
                    ]">{{ contarPorFiltro(f.key) }}</span>
                </button>
            </div>
        </div>

        <!-- TABLA DE PERSONAL -->
        <div class="bg-card rounded-3xl shadow-sm border border-border overflow-hidden no-print">
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
                                    <div class="flex flex-col">
                                        <span class="font-black text-sm text-main leading-tight">{{ p.nombre }}</span>
                                        <span class="text-[10px] text-muted font-bold tracking-tight mt-0.5">CI: {{ p.cedula_id || '---' }}</span>
                                    </div>
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

        <!-- MODAL DE VISTA (DETALLES DE PERSONAL) -->
        <Teleport to="body">
        <div v-if="viewPerson" class="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
            <div class="bg-white rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden flex flex-col border border-white/20 animate-prime-in">
                
                <!-- Header Institucional -->
                <div class="px-8 py-6 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex justify-between items-center shadow-lg">
                    <div>
                        <h3 class="font-black text-xl tracking-tight leading-none">Expediente de Personal</h3>
                        <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em] mt-2">Detalles Completos del Funcionario</p>
                    </div>
                    <button type="button" @click="viewPerson = null" class="hover:bg-white/20 p-2 rounded-xl transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <!-- Cuerpo de Detalles -->
                <div class="p-8 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar bg-slate-50/50">
                    
                    <!-- Fila Superior: Foto y Nombre -->
                    <div class="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div class="w-28 h-28 bg-emerald-50 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-emerald-100 shadow-md">
                            <img v-if="viewPerson.foto" :src="viewPerson.foto" class="w-full h-full object-cover">
                            <span v-else class="text-4xl font-black text-emerald-700">{{ viewPerson.nombre?.[0].toUpperCase() }}</span>
                        </div>
                        <div class="text-center sm:text-left space-y-2">
                            <h4 class="text-xl font-black text-slate-800 leading-tight">{{ viewPerson.nombre }}</h4>
                            <div class="flex flex-wrap justify-center sm:justify-start gap-2">
                                <span class="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                    {{ viewPerson.cargo }}
                                </span>
                                <span class="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                    Contrato: {{ viewPerson.tipo_contrato }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Datos Generales -->
                    <div class="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
                        <h5 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> Información del Funcionario
                        </h5>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <!-- Cédula -->
                            <div class="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cédula de Identidad</p>
                                <p class="text-sm font-bold text-slate-800">{{ viewPerson.cedula_id || '---' }}</p>
                            </div>
                            <!-- Celular -->
                            <div class="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Celular de Contacto</p>
                                <p class="text-sm font-bold text-slate-800">{{ viewPerson.celular || '---' }}</p>
                            </div>
                            <!-- Nacimiento -->
                            <div class="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Nacimiento</p>
                                <p class="text-sm font-bold text-slate-800">{{ formatDate(viewPerson.fecha_nacimiento) }}</p>
                            </div>
                            <!-- Grupo Sanguíneo -->
                            <div class="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Grupo Sanguíneo</p>
                                <p class="text-sm font-bold text-red-600">{{ viewPerson.tipo_sangre || '---' }}</p>
                            </div>
                            <!-- Ingreso -->
                            <div class="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Ingreso</p>
                                <p class="text-sm font-bold text-slate-800">{{ formatDate(viewPerson.fecha_ingreso) }}</p>
                            </div>
                            <!-- Antigüedad -->
                            <div class="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Antigüedad Calculada</p>
                                <p class="text-sm font-bold text-emerald-700">{{ calculateSeniority(viewPerson.fecha_ingreso) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Emergencias -->
                    <div class="p-6 bg-red-50/30 border border-red-100 rounded-2xl shadow-sm space-y-4">
                        <h5 class="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span class="w-2 h-2 bg-red-500 rounded-full"></span> Contacto de Emergencia
                        </h5>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="p-4 bg-white/80 border border-red-100 rounded-xl">
                                <p class="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Contacto Referencia</p>
                                <p class="text-sm font-bold text-slate-800">{{ viewPerson.contacto_emergencia || '---' }}</p>
                            </div>
                            <div class="p-4 bg-white/80 border border-red-100 rounded-xl">
                                <p class="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Celular de Emergencia</p>
                                <p class="text-sm font-bold text-red-700">{{ viewPerson.celular_emergencia || '---' }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer del Modal -->
                <div class="px-8 py-5 bg-white border-t border-slate-100 flex justify-end">
                    <button type="button" @click="viewPerson = null" class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs tracking-wider transition-all">
                        Cerrar Ficha
                    </button>
                </div>

            </div>
        </div>
        </Teleport>

        <!-- MODAL DE EDICIÓN (Teleport al body para centrado correcto) -->
        <Teleport to="body">
        <div v-if="showModal" class="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
            <div class="bg-white rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden flex flex-col border border-white/20 animate-prime-in">
                
                <!-- Header Institucional -->
                <div class="px-8 py-6 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex justify-between items-center shadow-lg">
                    <div>
                        <h3 class="font-black text-xl tracking-tight leading-none">{{ editingPerson ? 'Editar Expediente de Personal' : 'Registrar Nuevo Funcionario' }}</h3>
                        <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em] mt-2">Dirección de Personal y Accesos</p>
                    </div>
                    <button type="button" @click="showModal = false" class="hover:bg-white/20 p-2 rounded-xl transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <!-- Cuerpo del Formulario -->
                <form @submit.prevent="saveData" class="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar bg-slate-50/50">
                    
                    <!-- Foto Upload Section -->
                    <div class="flex items-center gap-8 p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl shadow-sm">
                        <div class="relative group">
                            <div class="w-24 h-24 bg-white rounded-2xl border-2 border-emerald-100 overflow-hidden flex items-center justify-center shadow-lg">
                                <img v-if="formData.foto" :src="formData.foto" class="w-full h-full object-cover">
                                <span v-else class="text-4xl">👤</span>
                            </div>
                            <label class="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all border border-white">
                                📷
                                <input type="file" @change="handleFotoUpload" class="hidden" accept="image/*">
                            </label>
                        </div>
                        <div>
                            <p class="font-black text-slate-800 text-sm">Fotografía del Funcionario</p>
                            <p class="text-xs text-slate-500 font-medium mt-1">Recomendado: Cuadrada, fondo claro. Máx 2MB.</p>
                            <button v-if="formData.foto" type="button" @click="formData.foto = ''" class="text-[10px] font-black text-red-500 uppercase mt-2 tracking-widest hover:underline">Eliminar foto</button>
                        </div>
                    </div>

                    <!-- SECCIÓN 01: DATOS PERSONALES -->
                    <div class="p-6 bg-white border border-slate-100 rounded-xl shadow-sm space-y-6">
                        <h4 class="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> 01. Datos Personales e Identificación
                        </h4>
                        
                        <div class="grid grid-cols-3 gap-6">
                            <div class="col-span-2 flex flex-col">
                                <label class="label-prime">Nombre Completo <span class="text-red-500 font-black">*</span></label>
                                <input v-model="formData.nombre" type="text" required class="form-input-prime" placeholder="Ej: Kevin Flores Vallejos">
                            </div>
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime">Cédula de Identidad <span class="text-red-500 font-black">*</span></label>
                                <input v-model="formData.cedula_id" type="text" required class="form-input-prime" placeholder="Ej: 7200607 Tja.">
                            </div>
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime">Fecha de Nacimiento</label>
                                <input v-model="formData.fecha_nacimiento" type="date" class="form-input-prime">
                            </div>
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime">Grupo Sanguíneo</label>
                                <select v-model="formData.tipo_sangre" class="form-input-prime">
                                    <option v-for="t in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']" :key="t" :value="t">{{ t }}</option>
                                </select>
                            </div>
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime">Celular de Contacto</label>
                                <input v-model="formData.celular" type="text" class="form-input-prime" placeholder="Ej: 777XXXXX">
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 02: DETALLES LABORALES -->
                    <div class="p-6 bg-white border border-slate-100 rounded-xl shadow-sm space-y-6">
                        <h4 class="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> 02. Información Laboral
                        </h4>
                        
                        <div class="grid grid-cols-3 gap-6">
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime">Cargo Institucional <span class="text-red-500 font-black">*</span></label>
                                <select v-model="formData.cargo" required class="form-input-prime">
                                    <option v-for="c in cargos" :key="c" :value="c">{{ c }}</option>
                                </select>
                            </div>
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime">Tipo de Contrato <span class="text-red-500 font-black">*</span></label>
                                <select v-model="formData.tipo_contrato" required class="form-input-prime">
                                    <option v-for="t in ['Permanente (Ítem)', 'Eventual (Consultor)', 'Plazo Fijo', 'Administrativo']" :key="t" :value="t">{{ t }}</option>
                                </select>
                            </div>
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime">Fecha de Ingreso</label>
                                <input v-model="formData.fecha_ingreso" type="date" class="form-input-prime">
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 03: CONTACTO DE EMERGENCIA -->
                    <div class="p-6 bg-red-50/30 border border-red-100 rounded-xl shadow-sm space-y-6">
                        <h4 class="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span class="w-2 h-2 bg-red-500 rounded-full"></span> 03. Contacto de Emergencia
                        </h4>
                        
                        <div class="grid grid-cols-2 gap-6">
                            <div class="flex flex-col">
                                <label class="label-prime text-red-800">Referencia de Emergencia</label>
                                <input v-model="formData.contacto_emergencia" type="text" class="form-input-prime border-red-100 focus:border-red-500" placeholder="Ej: Madre / Esposa (Nombre)">
                            </div>
                            <div class="flex flex-col">
                                <label class="label-prime text-red-800">Celular Emergencia</label>
                                <input v-model="formData.celular_emergencia" type="text" class="form-input-prime border-red-100 focus:border-red-500" placeholder="Número urgente">
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 04: ACCESO AL SISTEMA (CREDENCIALES) -->
                    <div class="p-6 bg-emerald-50/30 border border-emerald-100 rounded-xl shadow-sm space-y-6">
                        <div class="flex items-center justify-between border-b border-emerald-100/60 pb-4">
                            <h4 class="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> 04. Acceso al Sistema
                            </h4>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" v-model="formData.habilitarAcceso" class="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500">
                                <span class="text-xs font-black text-emerald-800 uppercase tracking-wider">Habilitar Cuenta de Usuario</span>
                            </label>
                        </div>
                        
                        <div v-if="formData.habilitarAcceso" class="grid grid-cols-3 gap-6 animate-prime-in">
                            <!-- Nombre de usuario = nombre completo (auto) -->
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime text-emerald-800">Nombre de Usuario
                                    <span class="text-emerald-500 normal-case text-[10px] font-medium ml-1">(automático)</span>
                                </label>
                                <div class="form-input-prime border-emerald-100 bg-emerald-50/60 text-emerald-900 select-none cursor-default truncate">
                                    {{ formData.nombre || 'Ingresa el nombre primero...' }}
                                </div>
                                <p class="text-[10px] text-emerald-600 font-bold mt-1 ml-1">⚡ Se usa el nombre completo para iniciar sesión.</p>
                            </div>
                            <!-- Contraseña -->
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime text-emerald-800">Contraseña
                                    <span v-if="editingPerson" class="text-emerald-500 normal-case text-[10px] font-medium">(vacío = mantener)</span>
                                    <span v-else class="text-red-500 font-black">*</span>
                                </label>
                                <input v-model="formData.password" type="password" :required="formData.habilitarAcceso && !editingPerson" class="form-input-prime border-emerald-100 focus:border-emerald-500" placeholder="••••••••">
                            </div>
                            <!-- Nivel de acceso -->
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime text-emerald-800">Nivel de Acceso <span class="text-red-500 font-black">*</span></label>
                                <select v-model="formData.role" required class="form-input-prime border-emerald-100 focus:border-emerald-500">
                                    <option value="USER">Usuario (Acceso básico)</option>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="ROOT">Superusuario (ROOT)</option>
                                </select>
                            </div>
                            <!-- Correo -->
                            <div class="col-span-2 flex flex-col">
                                <label class="label-prime text-emerald-800">Correo Institucional</label>
                                <input v-model="formData.email" type="email" class="form-input-prime border-emerald-100 focus:border-emerald-500" placeholder="correo@tarija.bo">
                            </div>
                            <!-- Estado -->
                            <div class="col-span-1 flex flex-col">
                                <label class="label-prime text-emerald-800">Estado de Cuenta <span class="text-red-500 font-black">*</span></label>
                                <select v-model="formData.estado" required class="form-input-prime border-emerald-100 focus:border-emerald-500">
                                    <option value="Activo">Activo (Habilitado)</option>
                                    <option value="Inactivo">Inactivo (Suspendido)</option>
                                </select>
                            </div>
                        </div>
                        <div v-else class="text-xs text-slate-500 font-medium italic">
                            Este funcionario no tiene credenciales de acceso al sistema. Activa la casilla superior para asignarle una cuenta.
                        </div>
                    </div>

                    <!-- Botones de Acción -->
                    <div class="flex gap-4 pt-4 border-t border-slate-100 bg-white p-6 rounded-b-[2rem]">
                        <button type="button" @click="showModal = false" class="flex-1 py-4 rounded-xl border-2 border-slate-100 font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                        <button type="submit" class="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
                            {{ editingPerson ? 'Guardar Cambios' : 'Registrar Funcionario' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </Teleport>



    </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useMainStore } from '../store/mainStore.js'
const mainStore = useMainStore()
const { store, uiState, updateCatalogo, deleteCatalogo, addCatalogo, showToast } = mainStore

const search = ref('')
const showModal = ref(false)
const editingPerson = ref(null)
const viewPerson = ref(null)

const cargos = [
    'Responsable de Área',
    'Jefe de Unidad',
    'Técnico de sistemas',
    'Técnico de verificación',
    'Técnico de equipo',
    'Trepador',
    'Chofer',
    'Cargador',
    'Operador',
    'Toconero'
]

const formData = reactive({
    nombre: '',
    cedula_id: '',
    cargo: 'Técnico de sistemas',
    tipo_contrato: 'Permanente (Ítem)',
    fecha_ingreso: '',
    celular: '',
    fecha_nacimiento: '',
    tipo_sangre: 'O+',
    contacto_emergencia: '',
    celular_emergencia: '',
    foto: '',
    habilitarAcceso: false,
    username: '',
    password: '',
    role: 'USER',
    email: '',
    estado: 'Activo'
})

const filterCargo = ref('')

const filtros = [
    { key: 'tecnico', label: 'Técnicos' },
    { key: 'chofer', label: 'Choferes' },
    { key: 'trepador', label: 'Trepadores' },
    { key: 'cargador', label: 'Cargadores' },
    { key: 'operador', label: 'Operadores' },
    { key: 'toconero', label: 'Toconeros' },
    { key: 'jefe', label: 'Jefes / Responsables' },
]

const matchFiltro = (p, key) => {
    const c = p.cargo?.toLowerCase() || ''
    if (key === 'tecnico') return c.startsWith('técnico')
    if (key === 'chofer') return c === 'chofer'
    if (key === 'trepador') return c === 'trepador'
    if (key === 'cargador') return c === 'cargador'
    if (key === 'operador') return c === 'operador'
    if (key === 'toconero') return c === 'toconero'
    if (key === 'jefe') return c === 'responsable de área' || c === 'jefe de unidad'
    return true
}

const contarPorFiltro = (key) => store.tecnicos.filter(p => matchFiltro(p, key)).length

const filteredPersonal = computed(() => {
    let result = store.tecnicos
    if (filterCargo.value) result = result.filter(p => matchFiltro(p, filterCargo.value))
    if (search.value) result = result.filter(p => p.nombre.toLowerCase().includes(search.value.toLowerCase()))
    return result
})

// El username siempre es el nombre completo del funcionario
watch(() => formData.nombre, (newName) => {
    formData.username = newName
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
    formData.nombre = ''
    formData.cedula_id = ''
    formData.cargo = 'Técnico de sistemas'
    formData.tipo_contrato = 'Permanente (Ítem)'
    formData.fecha_ingreso = ''
    formData.celular = ''
    formData.fecha_nacimiento = ''
    formData.tipo_sangre = 'O+'
    formData.contacto_emergencia = ''
    formData.celular_emergencia = ''
    formData.foto = ''
    formData.habilitarAcceso = false
    formData.username = ''
    formData.password = ''
    formData.role = 'USER'
    formData.email = ''
    formData.estado = 'Activo'
    showModal.value = true
}

const openView = (p) => {
    viewPerson.value = p
}

const openEdit = (p) => {
    editingPerson.value = p
    Object.assign(formData, p)
    formData.habilitarAcceso = !!p.username
    formData.username = p.username || p.nombre || ''
    formData.password = ''
    formData.role = p.role || 'USER'
    formData.email = p.email || ''
    formData.estado = p.estado || 'Activo'
    
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
        const payload = { ...formData }
        
        // El username siempre es el nombre completo
        payload.username = payload.nombre
        
        if (!payload.habilitarAcceso) {
            payload.username = null
            payload.password = null
            payload.role = 'TECNICO'
            payload.email = null
            payload.estado = 'Activo'
        }
        
        delete payload.habilitarAcceso
        
        let ok = editingPerson.value 
            ? await updateCatalogo('tecnicos', editingPerson.value.id, payload) 
            : await addCatalogo('tecnicos', payload)
        
        if (ok) {
            showToast('Datos guardados correctamente', 'success')
            showModal.value = false
        } else {
            showToast('Error al guardar: Verifique los datos', 'error')
        }
    } catch (e) {
        console.error(e)
        showToast('Error crítico de conexión', 'error')
    }
}


</script>

<style scoped>
@reference "tailwindcss";
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

.label-prime { @apply text-sm font-semibold text-slate-700 mb-1.5 ml-1 flex items-center gap-1; }
.form-input-prime {
    @apply w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 
           outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-sm;
}
.animate-prime-in {
    animation: primePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes primePop {
    from { opacity: 0; transform: scale(0.98) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
