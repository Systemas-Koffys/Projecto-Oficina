<template>
  <div class="relative w-full" ref="elRef">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="open = !open"
      class="w-full bg-card-sec border border-main rounded-xl px-3 py-2 text-xs font-bold focus:border-accent outline-none text-main shadow-sm transition-all cursor-pointer flex items-center justify-between gap-2 select-none active:scale-[0.99]"
      :class="{ 'border-accent shadow-[0_0_8px_rgba(141,212,23,0.2)]': open }"
    >
      <span class="truncate block max-w-[90%]">{{ labelSummary }}</span>
      <ChevronDown class="w-3.5 h-3.5 text-muted transition-transform duration-200 shrink-0" :class="{ 'rotate-180': open }" />
    </button>

    <!-- Dropdown Menu -->
    <Transition name="fade-scale">
      <div
        v-if="open"
        class="absolute z-50 mt-1.5 w-full bg-card border border-main rounded-2xl shadow-xl p-3 flex flex-col gap-2 max-h-[300px] overflow-hidden animate-prime-in"
      >
        <!-- Search and Quick Actions Header -->
        <div class="flex flex-col gap-2 shrink-0">
          <div v-if="searchable" class="relative">
            <input
              type="text"
              v-model="searchQuery"
              class="w-full bg-card-sec border border-main rounded-xl pl-8 pr-3 py-1.5 text-xs focus:border-accent outline-none text-main shadow-inner"
              placeholder="Buscar..."
            />
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted px-1.5">
            <button type="button" @click="selectAll" class="hover:text-accent cursor-pointer transition-colors active:scale-95">Todos</button>
            <button type="button" @click="clearAll" class="hover:text-accent cursor-pointer transition-colors active:scale-95">Ninguno</button>
          </div>
        </div>

        <!-- Options List -->
        <div class="overflow-y-auto pr-1 flex flex-col gap-0.5 custom-scrollbar max-h-[180px]">
          <div
            v-for="opt in filteredOptions"
            :key="opt.id"
            @click="toggleOption(opt.id)"
            class="flex items-center gap-2.5 px-2.5 py-2 hover:bg-accent-soft rounded-xl cursor-pointer select-none text-xs transition-all font-bold text-main"
          >
            <div
              class="w-4 h-4 border border-main rounded flex items-center justify-center transition-all duration-150 shrink-0"
              :class="modelValue.includes(opt.id) ? 'bg-accent border-accent text-on-accent' : 'bg-card-sec border-main'"
            >
              <Check v-if="modelValue.includes(opt.id)" class="w-3.5 h-3.5 stroke-[3px]" />
            </div>
            <span class="truncate">{{ opt.nombre }}</span>
          </div>

          <!-- Empty State -->
          <div v-if="filteredOptions.length === 0" class="text-center py-4 text-xs text-muted font-bold">
            No se encontraron opciones
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Search, Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
    default: () => []
  },
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Seleccionar opciones'
  },
  searchable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const elRef = ref(null)
const searchQuery = ref('')

const labelSummary = computed(() => {
  if (!props.modelValue || props.modelValue.length === 0) return props.placeholder
  if (props.modelValue.length === props.options.length) return 'Todos seleccionados'
  if (props.modelValue.length > 2) return `${props.modelValue.length} seleccionados`
  return props.options
    .filter(opt => props.modelValue.includes(opt.id))
    .map(opt => opt.nombre)
    .join(', ')
})

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) return props.options
  const query = searchQuery.value.toLowerCase().trim()
  return props.options.filter(opt => opt.nombre && opt.nombre.toLowerCase().includes(query))
})

const toggleOption = (id) => {
  const newValue = [...props.modelValue]
  const idx = newValue.indexOf(id)
  if (idx >= 0) {
    newValue.splice(idx, 1)
  } else {
    newValue.push(id)
  }
  emit('update:modelValue', newValue)
}

const selectAll = () => {
  emit('update:modelValue', props.options.map(opt => opt.id))
}

const clearAll = () => {
  emit('update:modelValue', [])
}

const close = () => {
  open.value = false
}

// Click outside detection
const handleClickOutside = (e) => {
  if (elRef.value && !elRef.value.contains(e.target)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #8dd417;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.15s ease-out;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-5px);
}
</style>
