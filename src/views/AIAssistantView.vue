<template>
  <div class="ai-assistant-container p-6 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
    
    <!-- Aviso si no está configurada la API Key -->
    <div v-if="isApiKeyMissing" class="m-auto max-w-md p-8 bg-amber-500/10 border border-amber-500/25 rounded-3xl backdrop-blur-md text-center space-y-4 animate-fade-in shadow-lg">
      <div class="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
        <AlertTriangle class="w-8 h-8" />
      </div>
      <h2 class="text-xl font-black text-amber-400">Falta la API Key de Groq</h2>
      <p class="text-xs text-amber-200/70 leading-relaxed font-medium">
        Para activar el asistente inteligente de Arboricultura, debes configurar la variable <code class="bg-black/30 px-2 py-0.5 rounded font-mono text-amber-300">VITE_GROQ_API_KEY</code> en tu archivo <code class="bg-black/30 px-2 py-0.5 rounded font-mono text-amber-300">.env</code> en el servidor local.
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
        <div class="bg-card-main border border-main p-6 rounded-2xl shadow-sm flex flex-col gap-4 text-center">
          <div>
            <h2 class="text-base font-black text-main tracking-tight">ArborGest AI</h2>
            <p class="text-[9px] font-black text-accent uppercase tracking-[0.2em] mt-1.5">Asistente de Voz Activo</p>
          </div>
          
          <div class="border-t border-main"></div>
          
          <!-- Control de Voz Activo (Síntesis) -->
          <div class="flex items-center justify-between w-full px-1 text-xs">
            <span class="text-muted font-bold flex items-center gap-2">
              <Volume2 class="w-4 h-4 text-accent shrink-0" />
              <span>Hablar respuesta</span>
            </span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="voiceEnabled" class="sr-only peer">
              <div class="w-9 h-5 bg-card-sec border border-main peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          <!-- Botón para detener la voz si está hablando -->
          <button v-if="isSpeaking" @click="stopSpeaking" class="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all animate-pulse flex items-center justify-center gap-2 cursor-pointer">
            <Square class="w-3 h-3 fill-current text-current" />
            <span>Detener Voz</span>
          </button>
        </div>

        <!-- Tarjeta de Sugerencias -->
        <div class="flex-1 bg-card-main border border-main p-5 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          <h3 class="text-xs font-black text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
            <Lightbulb class="w-4 h-4 text-accent shrink-0" />
            <span>Sugerencias de consulta</span>
          </h3>
          <div class="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            <button 
              v-for="(suggestion, idx) in suggestions" 
              :key="idx" 
              @click="sendSuggestion(suggestion)"
              class="w-full text-left p-3.5 bg-card-sec hover:bg-accent-soft border border-main rounded-2xl text-xs text-main font-bold transition-all hover:translate-x-1 active:scale-[0.98] cursor-pointer"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- Panel de Mensajes y Entrada Derecho -->
      <div class="flex-1 flex flex-col bg-card-main border border-main rounded-3xl shadow-sm overflow-hidden relative">
        
        <!-- Historial del Chat -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth custom-scrollbar">
          <!-- Mensaje de Bienvenida Inicial -->
          <div class="flex gap-3 max-w-[85%]">
            <div class="w-9 h-9 shrink-0 bg-accent-soft text-accent border border-accent/20 rounded-xl flex items-center justify-center select-none">
              <Bot class="w-5 h-5" />
            </div>
            <div class="p-4 bg-card-sec border border-main text-main rounded-2xl rounded-tl-none shadow-sm space-y-2">
              <p class="text-xs font-bold leading-relaxed">
                ¡Hola! Soy **ArborGest AI**, tu asistente inteligente del área de Arboricultura de Tarija. 
              </p>
              <p class="text-[11px] text-muted leading-relaxed font-semibold">
                Tengo acceso en tiempo real a las solicitudes de poda, tala y los catálogos del sistema. Puedes hacerme preguntas por voz o escribir en el chat. 
              </p>
              <p class="text-[10px] text-accent font-bold uppercase tracking-wider">
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
            <div :class="['w-9 h-9 shrink-0 rounded-xl flex items-center justify-center select-none border', 
              msg.role === 'user' 
                ? 'bg-accent text-on-accent border-accent' 
                : 'bg-accent-soft text-accent border-accent/20'
            ]">
              <component :is="msg.role === 'user' ? User : Bot" class="w-5 h-5" />
            </div>

            <!-- Burbuja de Mensaje -->
            <div :class="['p-4 rounded-2xl shadow-sm text-xs font-medium leading-relaxed whitespace-pre-line',
              msg.role === 'user' 
                ? 'bg-accent text-on-accent rounded-tr-none' 
                : 'bg-card-sec border border-main text-main rounded-tl-none'
            ]">
              {{ msg.content }}
            </div>
          </div>

          <!-- Indicador de Escribiendo / Pensando -->
          <div v-if="loading" class="flex gap-3 max-w-[85%] animate-pulse">
            <div class="w-9 h-9 shrink-0 bg-accent-soft text-accent border border-accent/20 rounded-xl flex items-center justify-center">
              <Bot class="w-5 h-5" />
            </div>
            <div class="p-4 bg-card-sec border border-main rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>

        <!-- Área de Entrada de Voz / Texto -->
        <div class="p-4 bg-card-sec border-t border-main flex items-center gap-3">
          
          <!-- Botón de Micrófono con Reconocimiento de Voz -->
          <button 
            @click="toggleSpeechRecognition"
            :class="[
              'w-12 h-12 rounded-xl shrink-0 flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-md',
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/30 scale-105' 
                : 'bg-accent text-on-accent hover:opacity-90 active:scale-[0.98]'
            ]"
            :title="isListening ? 'Detener micrófono' : 'Preguntar por voz'"
          >
            <!-- Ondas animadas de CSS mientras graba -->
            <span v-if="isListening" class="absolute inset-0 bg-red-500/20 animate-ping"></span>
            <span v-if="isListening" class="pulse-ring"></span>
            
            <Mic class="w-5 h-5 text-current transition-transform group-hover:scale-110" />
          </button>

          <!-- Input de Texto -->
          <div class="flex-1 h-12 relative flex items-center bg-card-main border border-main rounded-xl focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10 transition-all px-4 text-main">
            <input 
              v-model="inputQuery" 
              @keyup.enter="handleSend"
              placeholder="Escribe o habla tu consulta sobre podas..."
              class="flex-1 bg-transparent border-0 outline-none text-xs font-semibold py-1 min-w-0 pr-10 text-main placeholder-muted"
              id="ai-query-input"
            />
            
            <button 
              @click="handleSend" 
              :disabled="!inputQuery.trim() || loading"
              class="absolute right-4 text-accent hover:text-accent-hover transition-colors disabled:opacity-30 disabled:hover:text-accent cursor-pointer flex items-center justify-center"
            >
              <Send class="w-4.5 h-4.5" />
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
import { 
  Bot, User, Lightbulb, Volume2, Square, Mic, Send, AlertTriangle 
} from 'lucide-vue-next'

const mainStore = useMainStore()

const isApiKeyMissing = ref(!import.meta.env.VITE_GROQ_API_KEY)
const voiceEnabled = ref(false)
const isListening = ref(false)
const isSpeaking = ref(false)
const inputQuery = ref('')
const loading = ref(false)
const messages = ref([])
const chatContainer = ref(null)

const stopSpeaking = () => {
  window.speechSynthesis.cancel()
  isSpeaking.value = false
}

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
  
  utterance.onstart = () => {
    isSpeaking.value = true
  }
  utterance.onend = () => {
    isSpeaking.value = false
  }
  utterance.onerror = () => {
    isSpeaking.value = false
  }

  window.speechSynthesis.speak(utterance)
}

const handleSend = async () => {
  const query = inputQuery.value.trim()
  if (!query || loading.value) return

  // Detener la reproducción de voz anterior
  stopSpeaking()

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
      acciones: mainStore.store.acciones || [],
      inventarioItems: mainStore.store.inventarioItems || [],
      inventarioActivos: mainStore.store.inventarioActivos || [],
      inventarioConsumibles: mainStore.store.inventarioConsumibles || [],
      inventarioMovimientos: mainStore.store.inventarioMovimientos || []
    }

    // Consultar a Groq (LLaMA)
    const answer = await askGemini(query, contexto)

    // Agregar mensaje del bot
    messages.value.push({ role: 'assistant', content: answer })

    // Leer respuesta si está habilitada la voz
    speakResponse(answer)

  } catch (err) {
    console.error('Error al consultar al asistente:', err)
    let msg = 'Lo siento, no pude procesar tu consulta. Revisa tu conexión a internet.'
    if (err.message === 'API_KEY_MISSING') {
      msg = 'Falta la API Key en el servidor local. Configura VITE_GROQ_API_KEY en tu archivo .env.'
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
