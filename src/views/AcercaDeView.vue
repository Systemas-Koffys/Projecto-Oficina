<template>
  <div class="acerca-view p-6 space-y-8 animate-fade-in">
    <!-- Encabezado Principal -->
    <div class="bg-card-main p-8 rounded-[2rem] shadow-sm border border-main flex flex-col md:flex-row justify-between items-center gap-6">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-black text-main">Sistema de Gestión de Arboricultura</h1>
          <span class="px-3 py-1 bg-accent-soft border border-accent/20 rounded-full font-black text-xs text-accent tracking-wider">v3.25</span>
        </div>
        <p class="text-muted font-semibold mt-1">Plataforma de Control, Planificación y Seguimiento Técnico</p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-xs font-black text-accent uppercase tracking-widest">Gobierno Autónomo Municipal</p>
        <p class="text-xs text-muted font-bold">de Tarija</p>
      </div>
    </div>

    <!-- Estructura de Columnas -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Columna Principal (Izquierda) -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Sobre la Plataforma -->
        <div class="bg-card-main p-8 rounded-[2rem] shadow-sm border border-main">
          <h2 class="text-lg font-black text-main mb-4 flex items-center gap-3">
            <div class="w-8 h-8 bg-accent-soft text-accent rounded-xl flex items-center justify-center">
              <Info size="18" />
            </div>
            Sobre la Plataforma
          </h2>
          <p class="text-muted leading-relaxed text-sm mb-4">
            El <strong>Sistema de Seguimiento de Arboricultura</strong> ha sido desarrollado a medida para digitalizar, organizar y optimizar el flujo de trabajo operativo de podas, talas y mantenimiento de áreas verdes urbanas en la ciudad de Tarija.
          </p>
          <p class="text-muted leading-relaxed text-sm">
            Este ecosistema unifica el control de solicitudes, la ubicación satelital de los trámites, la diagramación de equipos técnicos y el registro histórico, sustituyendo las planillas de datos manuales por una base de datos centralizada que asegura rapidez, transparencia e integridad en la atención ciudadana.
          </p>
        </div>

        <!-- Módulos Clave del Sistema -->
        <div class="space-y-4">
          <h3 class="text-xs font-black text-main uppercase tracking-widest">Módulos Integrados del Sistema</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Módulo 1: Gestión de Trámites -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:border-accent/30 hover:shadow-md">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0">
                <FileText size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Gestión de Trámites</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Control unificado de solicitudes, estados de verificación, detalles técnicos de árboles y reportes listos para imprimir en formato A4 compacto.
                </p>
              </div>
            </div>

            <!-- Módulo 2: Georreferenciación -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:border-accent/30 hover:shadow-md">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0">
                <MapPin size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Georreferenciación Leaflet</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Mapeo satelital en tiempo real con marcadores interactivos, extractor automático de coordenadas desde enlaces de Google Maps y enlace directo a rutas.
                </p>
              </div>
            </div>

            <!-- Módulo 3: Tablero Canvas -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:border-accent/30 hover:shadow-md">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0">
                <Users size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Tablero de Equipos</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Organización ágil de cuadrillas mediante Drag and Drop, asignación automática inteligente a equipos con menor carga de personal y control de roles.
                </p>
              </div>
            </div>

            <!-- Módulo 4: Seguridad y Cuentas -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:border-accent/30 hover:shadow-md">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Control de Acceso</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Base de datos de personal unificada con cuentas de acceso cifradas (Bcrypt + JWT) y roles jerárquicos (Superusuario, Administrador, Técnico).
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Columna Lateral (Derecha) -->
      <div class="space-y-6">
        <!-- Ficha del Desarrollador Premium -->
        <div class="bg-card-main border border-main rounded-[2.5rem] shadow-md overflow-hidden flex flex-col relative group transition-all duration-300 hover:shadow-xl hover:border-accent/20">
          <!-- Banner Superior Premium con Degradado y Brillo -->
          <div class="relative h-32 dev-header-gradient flex items-center px-8 overflow-hidden shrink-0">
            <!-- Capas decorativas de fondo -->
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent)] pointer-events-none"></div>
            <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl"></div>
            <div class="flex flex-col">
              <span class="text-[color:var(--text-on-accent)] font-black text-lg tracking-wider">SYSTEMAS KOFFY'S</span>
              <span class="text-[color:var(--text-on-accent)] opacity-80 text-[10px] font-bold uppercase tracking-widest mt-0.5">Soluciones de Software</span>
            </div>
            
            <!-- Etiqueta de Soporte Activo en el Banner -->
            <span class="absolute top-4 right-4 px-2.5 py-1 bg-[color:var(--text-on-accent)]/10 border border-[color:var(--text-on-accent)]/20 rounded-full text-[9px] font-black text-[color:var(--text-on-accent)] tracking-wider uppercase select-none">
              SOPORTE ACTIVO
            </span>
          </div>
          
          <!-- Contenido de la Ficha -->
          <div class="p-6 pt-0 relative flex-1 flex flex-col">
            <!-- Monograma Medallón con Logo SK y Aro de Brillo -->
            <div class="w-20 h-20 bg-card-main rounded-2xl shadow-lg flex items-center justify-center -mt-10 ml-2 overflow-hidden ring-4 ring-[color:var(--bg-card)] select-none">
              <img :src="logoKoffys" class="w-full h-full object-contain p-2">
            </div>
            
            <!-- Perfil e Identidad -->
            <div class="mt-4">
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-black text-main leading-tight">Kevin Flores Vallejos</h2>
                <!-- Icono de Verificado -->
                <span class="w-4.5 h-4.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold" title="Desarrollador Oficial del Sistema">✓</span>
              </div>
              <p class="text-accent font-black text-xs uppercase tracking-wider mt-1">Técnico en Sistemas & Creador</p>
              
              <!-- Resumen Bio de Alta Calidad -->
              <p class="text-muted text-[11px] leading-relaxed font-semibold mt-3 bg-card-sec p-3.5 rounded-2xl border border-main">
                Desarrollador oficial de la plataforma a través de su firma <strong>Systemas Koffy's</strong>. Esta aplicación fue creada como una iniciativa personal para colaborar y modernizar la unidad operativa donde ejerce sus funciones, tras identificar la necesidad de digitalización.
              </p>
            </div>
            
            <!-- Cuadrícula de Contactos Rápidos -->
            <div class="mt-5 space-y-2.5">
              <a href="https://wa.me/59169309970" target="_blank" 
                class="flex items-center justify-between p-3 bg-card-sec hover:bg-accent-soft border border-main rounded-2xl transition-all group/item">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-accent-soft text-accent rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform">
                    <Phone size="14" />
                  </div>
                  <div class="text-left">
                    <p class="text-[9px] text-muted font-bold uppercase leading-none">WhatsApp / Celular</p>
                    <p class="text-xs font-black text-main mt-0.5">+591 69309970</p>
                  </div>
                </div>
                <span class="text-[10px] font-black text-accent opacity-0 group-hover/item:opacity-100 transition-opacity">WhatsApp →</span>
              </a>

              <a href="mailto:Systemaskoffys@gmail.com" target="_blank" 
                class="flex items-center justify-between p-3 bg-card-sec hover:bg-accent-soft border border-main rounded-2xl transition-all group/item">
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="w-8 h-8 bg-accent-soft text-accent rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform shrink-0">
                    <Mail size="14" />
                  </div>
                  <div class="text-left overflow-hidden">
                    <p class="text-[9px] text-muted font-bold uppercase leading-none">Correo Electrónico</p>
                    <p class="text-xs font-black text-main mt-0.5 truncate" title="Systemaskoffys@gmail.com">Systemaskoffys@gmail.com</p>
                  </div>
                </div>
                <span class="text-[10px] font-black text-accent opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">Redactar →</span>
              </a>
            </div>

            <!-- Botones de Redes Sociales Premium -->
            <div class="mt-6 pt-4 border-t border-main grid grid-cols-2 gap-3">
              <a href="https://www.linkedin.com/in/kevin-flores-631a16189" target="_blank" 
                class="py-2.5 bg-accent hover:bg-accent-hover text-[color:var(--text-on-accent)] text-center rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                <Linkedin size="14" />
                LINKEDIN
              </a>
              <a href="https://github.com/Systemas-Koffys" target="_blank" 
                class="py-2.5 bg-card-sec border border-main hover:border-accent/30 text-center rounded-xl font-black text-xs text-main transition-all flex items-center justify-center gap-1.5 shadow-inner hover:bg-card-sec/80 active:scale-95">
                <Github size="14" />
                GITHUB
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Stack Tecnológico (Ancho Completo) -->
    <div class="bg-card-main p-8 rounded-[2rem] border border-main shadow-sm">
      <h3 class="text-sm font-black text-main uppercase tracking-widest mb-5 flex items-center gap-2">
        <Code size="16" class="text-accent" />
        Stack Tecnológico e Infraestructura Base
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="tech in techs" :key="tech.n" class="bg-card-sec p-4 rounded-xl border border-main flex flex-col gap-2 hover:border-accent/30 transition-colors">
           <div class="flex items-center gap-2">
             <div class="w-2.5 h-2.5 rounded-full shrink-0" :class="tech.c"></div>
             <p class="text-xs font-black text-main uppercase tracking-wider">{{ tech.n }}</p>
           </div>
           <p class="text-[11px] text-muted font-semibold leading-relaxed">{{ tech.d }}</p>
        </div>
      </div>
    </div>

    <!-- Políticas de Privacidad y Términos Expandido -->
    <div class="bg-card-main p-8 rounded-[2rem] border border-main shadow-sm flex flex-col md:flex-row gap-8">
      <div class="md:w-1/3">
        <h2 class="text-lg font-black text-main mb-2 flex items-center gap-3">
          <div class="w-8 h-8 bg-accent-soft text-accent rounded-xl flex items-center justify-center shrink-0">
            <Book size="18" />
          </div>
          Políticas y Términos
        </h2>
        <p class="text-xs text-muted font-semibold leading-relaxed">Lineamientos de uso, confidencialidad de datos y propiedad intelectual de la plataforma.</p>
      </div>
      <div class="md:w-2/3 space-y-6">
         <div class="flex gap-4">
           <div class="w-10 text-right shrink-0 pt-0.5">
             <ShieldCheck size="18" class="text-accent ml-auto" />
           </div>
           <div class="relative pl-4 border-l-2 border-border pb-2">
             <p class="text-xs font-black text-main mb-1">Privacidad y Uso de Datos Operativos</p>
             <p class="text-[11px] text-muted font-semibold leading-relaxed">Toda la información contenida en este sistema, incluyendo la ubicación geográfica de los árboles, registros fotográficos, historiales de trabajo y datos personales de los técnicos y ciudadanos, es de carácter estrictamente confidencial. Su uso está limitado exclusivamente a las operaciones de la institución. Queda terminantemente prohibida la extracción masiva, copia no autorizada o distribución de la base de datos a terceros por cualquier medio sin autorización gubernamental formal y por escrito.</p>
           </div>
         </div>
         
         <div class="flex gap-4">
           <div class="w-10 text-right shrink-0 pt-0.5">
             <Scale size="18" class="text-accent ml-auto" />
           </div>
           <div class="relative pl-4 border-l-2 border-border pb-2">
             <p class="text-xs font-black text-main mb-1">Derechos Reservados y Propiedad Intelectual</p>
             <p class="text-[11px] text-muted font-semibold leading-relaxed">La arquitectura técnica del software, los flujos de diseño (UI/UX) y el código fuente original son propiedad intelectual exclusiva de Kevin Flores Vallejos ("Systemas Koffy's"). Esta licencia de uso fue otorgada como un aporte colaborativo a la institución para la mejora operativa del área. Sin embargo, el autor original retiene todos los derechos patrimoniales sobre el código base. El uso continuo de este sistema por parte de la institución implica la lectura y aceptación total de estas condiciones.</p>
           </div>
         </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useMainStore } from '../store/mainStore.js'
import { Info, FileText, MapPin, Users, ShieldCheck, Code, Phone, Mail, Linkedin, Github, CheckCircle, Book, Scale } from 'lucide-vue-next'
import logoKoffys from '../assets/logo-koffys.png'

const mainStore = useMainStore()
const { uiState } = mainStore

const techs = [
    { n: 'Vue.js 3 + Composition API', d: 'Framework web reactivo para interfaces ultra rápidas sin recargar página.', c: 'bg-emerald-500' },
    { n: 'Tailwind CSS v4', d: 'Motor de diseño utility-first para lograr acabados estéticos premium.', c: 'bg-cyan-500' },
    { n: 'Pinia Store', d: 'Gestor de estado global y memoria caché local (Arquitectura SPA).', c: 'bg-indigo-500' },
    { n: 'Node.js + Express', d: 'Motor de servidor backend rápido, ligero y altamente escalable.', c: 'bg-green-600' },
    { n: 'MySQL 8.0', d: 'Motor de base de datos relacional para integridad financiera e histórica.', c: 'bg-slate-700' },
    { n: 'Docker Compose', d: 'Virtualización y orquestación para garantizar despliegues a prueba de fallos.', c: 'bg-sky-500' },
    { n: 'Leaflet.js', d: 'Georreferenciación matemática y visualización satelital de coordenadas.', c: 'bg-emerald-400' },
    { n: 'Bcrypt + JWT', d: 'Cifrado de grado militar para proteger las contraseñas y sesiones.', c: 'bg-yellow-500' }
]
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.dev-header-gradient {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%) !important;
}
</style>
