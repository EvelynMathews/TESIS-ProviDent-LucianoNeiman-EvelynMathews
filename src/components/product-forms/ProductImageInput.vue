<script>
/**
 * Campo para elegir la imagen de una publicación (clic o arrastrar).
 * Valida tipo y peso, y emite `select` con el archivo o `invalid` con el motivo.
 */
const MAX_SIZE = 5 * 1024 * 1024

export default {
  name: 'ProductImageInput',
  props: {
    inputId: { type: String, required: true },
    preview: { type: String, default: null },
    required: { type: Boolean, default: false },
    removable: { type: Boolean, default: true }
  },
  emits: ['select', 'remove', 'invalid'],
  computed: {
    showMissing() {
      return this.required && !this.preview
    }
  },
  methods: {
    pick(files) {
      const file = files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        this.$emit('invalid', 'El archivo tiene que ser una imagen (JPG, PNG, WebP o GIF).')
        return
      }
      if (file.size > MAX_SIZE) {
        this.$emit('invalid', 'La imagen pesa más de 5 MB. Probá con una más liviana.')
        return
      }
      this.$emit('select', file)
    },
    onChange(event) {
      this.pick(event.target.files)
      event.target.value = ''
    },
    onDrop(event) {
      this.pick(event.dataTransfer?.files)
    }
  }
}
</script>

<template>
  <div>
    <div @dragover.prevent @drop.prevent="onDrop"
      class="border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:bg-gray-50"
      :class="showMissing ? 'border-red-400' : 'border-gray-300'">
      <input :id="inputId" type="file" accept="image/*" class="hidden" @change="onChange" />
      <label :for="inputId" class="cursor-pointer">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="block text-sm text-gray-600">{{ preview ? 'Hacé clic o arrastrá otra imagen para cambiarla' : 'Hacé clic para subir o arrastrá la imagen aquí' }}</span>
        <span class="block text-xs text-gray-500 mt-1">JPG, PNG o GIF (máx. 5MB)</span>
        <span v-if="showMissing" class="block text-xs text-red-600 mt-2">Subí al menos una imagen</span>
      </label>
    </div>
    <div v-if="preview" class="grid grid-cols-3 gap-4 mt-4">
      <div class="relative">
        <img :src="preview" alt="Imagen de la publicación" class="w-full h-32 object-cover rounded-lg" />
        <button v-if="removable" type="button" aria-label="Quitar imagen" @click="$emit('remove')"
          class="absolute top-2 right-2 bg-gray-900/80 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-red-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.5" d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  </div>
</template>
