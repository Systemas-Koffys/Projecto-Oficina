<template>
  <div class="acerca-view p-6 space-y-8 animate-fade-in">
    <!-- Encabezado Principal -->
    <div class="bg-card-main p-8 rounded-[2rem] shadow-sm border border-main flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)] pointer-events-none"></div>
      <div class="relative z-10">
        <div class="flex flex-wrap items-baseline gap-3">
          <h1 class="text-3.5xl font-black text-main">ArborGest</h1>
          <span class="text-xs font-black text-accent uppercase tracking-widest">Sistema de Gestión de Arboricultura G.A.M.T.</span>
          <span class="px-2.5 py-0.5 bg-accent-soft border border-accent/20 rounded-full font-black text-[10px] text-accent tracking-wider">v{{ packageInfo.version }}</span>
        </div>
        <p class="text-muted font-semibold mt-1.5">Plataforma de Control, Planificación y Seguimiento Técnico</p>
      </div>
      <div class="text-right shrink-0 relative z-10">
        <p class="text-xs font-black text-accent uppercase tracking-widest">Gobierno Autónomo Municipal</p>
        <p class="text-xs text-muted font-bold">de Tarija</p>
      </div>
    </div>

    <!-- Estructura de Columnas -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Columna Principal (Izquierda) -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Sobre la Plataforma -->
        <div class="bg-card-main p-8 rounded-[2rem] shadow-sm border border-main relative overflow-hidden">
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
            Tras la gran migración a la nube, la plataforma opera de manera serverless con sincronización en tiempo real y soporte para Progressive Web App (PWA). Esto permite a los técnicos registrar trabajos y consultar catálogos en campo directamente desde dispositivos móviles, incluso en zonas sin señal de internet, sincronizando los datos automáticamente al recuperar conexión.
          </p>
        </div>

        <!-- Módulos Clave del Sistema -->
        <div class="space-y-4">
          <h3 class="text-xs font-black text-main uppercase tracking-widest ml-2">Módulos Integrados del Sistema</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Módulo 1: Gestión de Trámites -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/40 group">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FileText size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Gestión de Trámites</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Control unificado de expedientes, estados de verificación, detalles técnicos de árboles y reportes listos para imprimir en formato A4 compacto.
                </p>
              </div>
            </div>

            <!-- Módulo 2: Georreferenciación -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/40 group">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MapPin size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Georreferenciación Satelital</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Mapeo en tiempo real (Leaflet) con clusters interactivos, mapas de calor para identificar solicitudes críticas y enrutamiento directo.
                </p>
              </div>
            </div>

            <!-- Módulo 3: Tablero Canvas -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/40 group">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Users size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Tablero de Cuadrillas</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Organización ágil de equipos técnicos en campo mediante arrastre directo (Drag & Drop) y balance inteligente de cargas operativas.
                </p>
              </div>
            </div>

            <!-- Módulo 4: Seguridad y Cuentas -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/40 group">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShieldCheck size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Autenticación Firebase</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Inicio de sesión unificado con Google Sign-In, gestión segura de perfiles de personal y niveles de roles (Superuser, Admin, Técnico).
                </p>
              </div>
            </div>

            <!-- Módulo 5: Inventario y Activos -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/40 group">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Wrench size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Inventario y Activos Fijos</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Control de stock de repuestos, fichas técnicas de maquinaria (motosierras) con fotos de inspección y flujo de retorno de piezas usadas.
                </p>
              </div>
            </div>

            <!-- Módulo 6: Sincronización Offline -->
            <div class="bg-card-main p-5 rounded-2xl border border-main flex gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/40 group">
              <div class="w-12 h-12 bg-accent-soft text-accent rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <CloudLightning size="22" />
              </div>
              <div>
                <h4 class="text-xs font-black text-main uppercase tracking-wider mb-1">Soporte PWA e IndexedDB</h4>
                <p class="text-[11px] text-muted leading-relaxed font-semibold">
                  Cola de sincronización en localstorage/IndexedDB para formularios ininterrumpidos sin señal de red y descarga local de catálogos base.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Columna Lateral (Derecha) -->
      <div class="space-y-6">
        <!-- Ficha del Desarrollador Premium -->
        <div class="bg-card-main border border-main rounded-[2.5rem] shadow-md overflow-hidden flex flex-col relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-accent/30">
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
            <span class="absolute top-4 right-4 px-2.5 py-1 bg-[color:var(--text-on-accent)]/10 border border-[color:var(--text-on-accent)]/20 rounded-full text-[9px] font-black text-[color:var(--text-on-accent)] tracking-wider uppercase select-none flex items-center gap-1.5 shadow-sm">
              <span class="w-1.5 h-1.5 bg-[color:var(--text-on-accent)] rounded-full animate-ping absolute opacity-75"></span>
              <span class="w-1.5 h-1.5 bg-[color:var(--text-on-accent)] rounded-full"></span>
              SOPORTE ACTIVO
            </span>
          </div>
          
          <!-- Contenido de la Ficha -->
          <div class="p-6 pt-0 relative flex-1 flex flex-col">
            <!-- Monograma Medallón con Logo SK y Borde Luminoso -->
            <div class="relative w-20 h-20 -mt-10 ml-2 rounded-2xl p-[2px] overflow-hidden group/logo transition-transform duration-500 hover:scale-110 cursor-pointer shadow-lg ring-4 ring-[color:var(--bg-card)] select-none">
              <!-- Gradiente giratorio (Línea que recorre el borde) -->
              <div class="absolute -inset-[100%] animate-[spin_3s_linear_infinite]" style="background: conic-gradient(from 0deg, transparent 0 270deg, var(--accent) 360deg);"></div>
              
              <!-- Contenedor Principal (Tapa el centro) -->
              <div class="relative w-full h-full bg-card-main rounded-[14px] flex items-center justify-center overflow-hidden z-10">
                <!-- Brillo en Hover -->
                <div class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/logo:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                <img :src="logoKoffys" class="w-full h-full object-contain p-2 relative z-10">
              </div>
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
                class="py-2.5 bg-accent hover:bg-accent-hover text-[color:var(--text-on-accent)] text-center rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95 duration-300">
                <Linkedin size="14" class="group-hover:animate-bounce" />
                LINKEDIN
              </a>
              <a href="https://github.com/Systemas-Koffys" target="_blank" 
                class="py-2.5 bg-accent hover:bg-accent-hover text-[color:var(--text-on-accent)] text-center rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95 duration-300 group">
                <Github size="14" class="group-hover:animate-pulse" />
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
        Stack Tecnológico Serverless & PWA
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="tech in techs" :key="tech.n" class="bg-card-sec p-4 rounded-xl border border-main flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-accent/40">
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
import { Info, FileText, MapPin, Users, ShieldCheck, Code, Phone, Mail, Linkedin, Github, Book, Scale, Wrench, CloudLightning } from 'lucide-vue-next'
import logoKoffys from '../assets/logo-koffys.png'
import packageInfo from '../../package.json'

const mainStore = useMainStore()
const { uiState } = mainStore

const techs = [
    { n: 'Vue.js 3 + Composition API', d: 'Framework web reactivo para interfaces dinámicas de alto rendimiento en SPA.', c: 'bg-emerald-500' },
    { n: 'Tailwind CSS v4', d: 'Motor de diseño utility-first para lograr interfaces premium, responsivas y consistentes.', c: 'bg-cyan-500' },
    { n: 'Pinia Store', d: 'Gestión de estados globales reactivos del sistema y comunicación con la nube.', c: 'bg-indigo-500' },
    { n: 'Firebase Firestore', d: 'Base de datos NoSQL ultra rápida en la nube con sincronización reactiva en tiempo real.', c: 'bg-amber-500' },
    { n: 'Firebase Authentication', d: 'Gestión segura de cuentas de usuario con soporte de login Google Sign-In integrado.', c: 'bg-amber-600' },
    { n: 'Cloudinary CDN', d: 'Servidor y CDN de imágenes optimizadas con compresión local en Canvas client-side.', c: 'bg-sky-500' },
    { n: 'PWA (vite-plugin-pwa)', d: 'Transformación en Web App instalable offline con service worker y persistencia en IndexedDB.', c: 'bg-purple-500' },
    { n: 'Leaflet.js Mapas', d: 'Cartografía interactiva para distritos, geolocalización por marcadores y mapas térmicos.', c: 'bg-emerald-400' }
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
