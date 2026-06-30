<template>
  <div class="ai-assistant-container p-6 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
    
    <!-- Aviso si no está configurada la API Key -->
    <div v-if="isApiKeyMissing" class="m-auto max-w-md p-8 bg-amber-500/10 border border-amber-500/25 rounded-3xl backdrop-blur-md text-center space-y-4 animate-fade-in shadow-lg">
      <div class="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">⚠️</div>
      <h2 class="text-xl font-black text-amber-400">Falta la API Key de Gemini</h2>
      <p class="text-xs text-amber-200/70 leading-relaxed font-medium">
        Para activar el asistente inteligente de Arboricultura, debes configurar la variable <code class="bg-black/30 px-2 py-0.5 rounded font-mono text-amber-300">VITE_GEMINI_API_KEY</code> en tu archivo <code class="bg-black/30 px-2 py-0.5 rounded font-mono text-amber-300">.env</code> en el servidor local.
      </p>
      <div class="pt-2">
        <a href="https://aistudio.google.com" target="_blank" class="inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95">
          Obtener Key Gratis
        </a>
      </div>
    </div>

    <!-- Interfaz del Asistente (Modo Premium Glassmorphism) -->
    <div v-else class="flex-1 flex flex-col md:flex-row gap-6 h-full overflow-hidden">
      
      <!-- Panel de Control y Sugerencias Izquierdo -->
      <div class="w-full md:w-80 flex flex-col gap-4 shrink-0">
        <!-- Tarjeta del Asistente -->
        <div class="bg-emerald-950/40 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl flex flex-col items-center text-center">
          <div class="relative mb-3">
            <div class="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center text-4xl shadow-lg border border-white/10 animate-pulse-slow">
              🌳
            </div>
            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-[#042f24] rounded-full"></div>
          </div>
          <h2 class="text-lg font-black text-white">ArborGest AI</h2>
          <p class="text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-0.5">Asistente por Voz Activo</p>
          
          <div class="w-full border-t border-white/10 my-4"></div>
          
          <!-- Control de Voz Activo (Síntesis) -->
          <div class="flex items-center justify-between w-full px-2 text-xs">
            <span class="text-white/60 font-semibold flex items-center gap-1.5">
              🔊 Hablar respuesta
            </span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="voiceEnabled" class="sr-only peer">
              <div class="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        <!-- Tarjeta de Sugerencias -->
        <div class="flex-1 bg-emerald-950/20 backdrop-blur-lg border border-white/5 p-5 rounded-3xl shadow-xl flex flex-col overflow-hidden">
          <h3 class="text-xs font-black text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
            💡 Sugerencias de consulta
          </h3>
          <div class="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            <button 
              v-for="(suggestion, idx) in suggestions" 
              :key="idx" 
              @click="sendSuggestion(suggestion)"
              class="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/20 rounded-2xl text-xs text-white/80 hover:text-white font-medium transition-all hover:translate-x-1 active:scale-[0.98] cursor-pointer"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- Panel de Mensajes y Entrada Derecho -->
      <div class="flex-1 flex flex-col bg-emerald-950/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
        
        <!-- Historial del Chat -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth custom-scrollbar">
          <!-- Mensaje de Bienvenida Inicial -->
          <div class="flex gap-3 max-w-[85%]">
            <div class="w-9 h-9 shrink-0 bg-emerald-500/20 border border-emerald-500/20 rounded-xl flex items-center justify-center text-lg select-none">🤖</div>
            <div class="p-4 bg-emerald-900/30 border border-white/5 text-white/90 rounded-2xl rounded-tl-none shadow-md space-y-2">
              <p class="text-xs font-bold leading-relaxed">
                ¡Hola! Soy **ArborGest AI**, tu asistente inteligente del área de Arboricultura de Tarija. 
              </p>
              <p class="text-[11px] text-white/70 leading-relaxed font-medium">
                Tengo acceso en tiempo real a las solicitudes de poda, tala y los catálogos del sistema. Puedes hacerme preguntas por voz o escribir en el chat. 
              </p>
              <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Prueba diciendo: "¿Cuántas podas activas hay?" o "¿Quién es el Responsable de Área?"
              </p>
            </div>
          </div>

          <!-- Mensajes Dinámicos -->
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            :class="['flex gap-3 max-w-[85%] animate-fade-in', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '']"
          >
            <!-- Avatar -->
            <div :class="['w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-lg select-none border', 
              msg.role === 'user' 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : 'bg-emerald-500/20 border-emerald-500/20'
            ]">
              {{ msg.role === 'user' ? '👤' : '🤖' }}
            </div>

            <!-- Burbuja de Mensaje -->
            <div :class="['p-4 rounded-2xl shadow-md text-xs font-medium leading-relaxed whitespace-pre-line',
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-emerald-900/30 border border-white/5 text-white/90 rounded-tl-none'
            ]">
              {{ msg.content }}
            </div>
          </div>

          <!-- Indicador de Escribiendo / Pensando -->
          <div v-if="loading" class="flex gap-3 max-w-[85%] animate-pulse">
            <div class="w-9 h-9 shrink-0 bg-emerald-500/20 border border-emerald-500/20 rounded-xl flex items-center justify-center text-lg">🤖</div>
            <div class="p-4 bg-emerald-900/30 border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>

        <!-- Área de Entrada de Voz / Texto -->
        <div class="p-4 bg-[#032119]/80 border-t border-white/10 backdrop-blur-md flex items-center gap-3">
          
          <!-- Botón de Micrófono con Reconocimiento de Voz -->
          <button 
            @click="toggleSpeechRecognition"
            :class="[
              'w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-lg',
              isListening 
                ? 'bg-red-600 hover:bg-red-500 text-white ring-4 ring-red-600/30 scale-105' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-[0.98]'
            ]"
            :title="isListening ? 'Detener micrófono' : 'Preguntar por voz'"
          >
            <!-- Ondas animadas de CSS mientras graba -->
            <span v-if="isListening" class="absolute inset-0 bg-red-500/20 animate-ping"></span>
            <span v-if="isListening" class="pulse-ring"></span>
            
            <svg v-if="isListening" class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
            <svg v-else class="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </button>

          <!-- Input de Texto -->
          <div class="flex-1 relative flex items-center bg-white/5 border border-white/10 rounded-2xl focus-within:border-emerald-500/40 focus-within:bg-white/10 transition-all px-4 py-3 text-white">
            <input 
              v-model="inputQuery" 
              @keyup.enter="handleSend"
              placeholder="Escribe o habla tu consulta sobre podas..."
              class="flex-1 bg-transparent border-0 outline-none text-xs font-semibold py-1 min-w-0 pr-10 text-white placeholder-white/35"
              id="ai-query-input"
            />
            
            <button 
              @click="handleSend" 
              :disabled="!inputQuery.trim() || loading"
              class="absolute right-3 text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30 disabled:hover:text-emerald-400 cursor-pointer flex items-center justify-center"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            </button>
          </div>

        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useMainStore } from '../store/mainStore.js'
import { askGemini } from '../services/gemini.js'

const mainStore = useMainStore()

const isApiKeyMissing = ref(!import.meta.env.VITE_GEMINI_API_KEY)
const voiceEnabled = ref(false)
const isListening = ref(false)
const inputQuery = ref('')
const loading = ref(false)
const messages = ref([])
const chatContainer = ref(null)

// Sugerencias de preguntas dinámicas y contextualizadas
const suggestions = [
  '¿Cuántas solicitudes totales hay registradas?',
  '¿Hay algún trámite en espera en barrio Miraflores?',
  '¿Quién es el Responsable de Área?',
  '¿Quién es el Jefe de Unidad?',
  '¿Cuántos técnicos activos hay en la cuadrilla?',
  'Dime las últimas solicitudes del distrito 13'
]

// Reconocimiento de Voz Nativo (Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
let recognition = null

if (SpeechRecognition) {
  recognition = new SpeechRecognition()
  recognition.lang = 'es-BO' // Español boliviano
  recognition.continuous = false
  recognition.interimResults = false

  recognition.onstart = () => {
    isListening.value = true
  }

  recognition.onend = () => {
    isListening.value = false
  }

  recognition.onerror = (e) => {
    console.error('Error reconocimiento de voz:', e)
    isListening.value = false
    mainStore.showToast('No se pudo reconocer la voz. Intente de nuevo.', 'error')
  }

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    if (transcript && transcript.trim() !== '') {
      inputQuery.value = transcript
      handleSend()
    }
  }
}

onMounted(() => {
  document.title = 'AI Arboricultura | ArborGest'
})

// Auto-scroll al final del chat ante nuevos mensajes
const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

const toggleSpeechRecognition = () => {
  if (!recognition) {
    mainStore.showToast('Tu navegador no soporta control por voz.', 'error')
    return
  }

  if (isListening.value) {
    recognition.stop()
  } else {
    recognition.start()
  }
}

const sendSuggestion = (text) => {
  inputQuery.value = text
  handleSend()
}

// Síntesis de voz (Text-to-Speech)
const speakResponse = (text) => {
  if (!voiceEnabled.value) return

  // Limpiar markdown del texto para que no lea asteriscos o guiones
  const cleanText = text.replace(/[*#_\-`]/g, '').trim()

  window.speechSynthesis.cancel() // Cancelar lecturas anteriores
  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.lang = 'es-ES' // Español
  utterance.rate = 1.05 // Velocidad un poquito más ágil
  window.speechSynthesis.speak(utterance)
}

const handleSend = async () => {
  const query = inputQuery.value.trim()
  if (!query || loading.value) return

  // Agregar mensaje de usuario al chat
  messages.value.push({ role: 'user', content: query })
  inputQuery.value = ''
  loading.value = true

  // Detener el micrófono por si seguía escuchando
  if (isListening.value && recognition) {
    recognition.stop()
  }

  try {
    // Formatear el contexto del store de Pinia de forma estructurada para el modelo
    const contexto = {
      solicitudes: mainStore.store.solicitudes || [],
      tecnicos: mainStore.store.tecnicos || [],
      barrios: mainStore.store.barrios || [],
      distritos: mainStore.store.distritos || [],
      especies: mainStore.store.especies || [],
      acciones: mainStore.store.acciones || []
    }

    // Consultar a Gemini
    const answer = await askGemini(query, contexto)

    // Agregar mensaje del bot
    messages.value.push({ role: 'assistant', content: answer })

    // Leer respuesta si está habilitada la voz
    speakResponse(answer)

  } catch (err) {
    console.error('Error al consultar al asistente:', err)
    let msg = 'Lo siento, no pude procesar tu consulta. Revisa tu conexión a internet.'
    if (err.message === 'API_KEY_MISSING') {
      msg = 'Falta la API Key en el servidor local. Configura VITE_GEMINI_API_KEY en tu archivo .env.'
    }
    messages.value.push({ role: 'assistant', content: msg })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ai-assistant-container {
  font-family: 'Outfit', 'Inter', sans-serif;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.15);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.35);
}

.animate-pulse-slow {
  animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.93; transform: scale(0.98); }
}

.pulse-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4px solid rgba(220, 38, 38, 0.4);
  border-radius: 1rem;
  animation: pulse-ring-animation 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite;
  pointer-events: none;
}

@keyframes pulse-ring-animation {
  0% { transform: scale(0.95); opacity: 0.9; }
  100% { transform: scale(1.4); opacity: 0; }
}

#ai-query-input::placeholder {
  font-weight: 600;
  opacity: 0.4;
}
</style>
