<script setup lang="ts">
const emit = defineEmits<{
  filesSelected: [files: File[]]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function triggerFilePicker() {
  fileInputRef.value?.click()
}

function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    emit('filesSelected', Array.from(target.files))
    target.value = ''
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const validFiles = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (validFiles.length > 0) {
      emit('filesSelected', validFiles)
    }
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

const isDev = import.meta.dev

function loadSampleImages() {
  const canvas1 = document.createElement('canvas')
  canvas1.width = 600
  canvas1.height = 400
  const ctx1 = canvas1.getContext('2d')
  if (ctx1) {
    ctx1.fillStyle = '#1e3a8a'
    ctx1.fillRect(0, 0, 600, 400)
    ctx1.fillStyle = '#ffffff'
    ctx1.font = 'bold 36px sans-serif'
    ctx1.fillText('Sample Photo 1', 50, 150)
  }

  const canvas2 = document.createElement('canvas')
  canvas2.width = 400
  canvas2.height = 600
  const ctx2 = canvas2.getContext('2d')
  if (ctx2) {
    ctx2.fillStyle = '#065f46'
    ctx2.fillRect(0, 0, 400, 600)
    ctx2.fillStyle = '#ffffff'
    ctx2.font = 'bold 36px sans-serif'
    ctx2.fillText('Sample Photo 2', 50, 150)
  }

  canvas1.toBlob((blob1) => {
    canvas2.toBlob((blob2) => {
      if (blob1 && blob2) {
        const file1 = new File([blob1], 'sample-1.jpg', { type: 'image/jpeg' })
        const file2 = new File([blob2], 'sample-2.jpg', { type: 'image/jpeg' })
        emit('filesSelected', [file1, file2])
      }
    }, 'image/jpeg', 0.9)
  }, 'image/jpeg', 0.9)
}
</script>

<template>
  <UCard
    :class="[
      'cursor-pointer transition-colors duration-200 border-2 border-dashed text-center p-6',
      isDragging ? 'border-primary bg-primary/5' : 'border-neutral-300 dark:border-neutral-700'
    ]"
    @click="triggerFilePicker"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      @change="handleFileInput"
    >

    <div class="flex flex-col items-center justify-center gap-3">
      <div class="rounded-full bg-primary/10 p-3 text-primary">
        <UIcon name="i-lucide-upload-cloud" class="w-8 h-8" />
      </div>

      <div class="space-y-1">
        <p class="font-medium text-base">
          Click to choose images or drag and drop here
        </p>
        <p class="text-sm text-neutral-500">
          Supports JPEG, PNG, WebP, TIFF. All processing happens locally in your browser.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          label="Select Images"
          icon="i-lucide-images"
          color="primary"
          variant="subtle"
          @click.stop="triggerFilePicker"
        />

        <UButton
          v-if="isDev"
          label="Load Sample Images"
          icon="i-lucide-sparkles"
          color="neutral"
          variant="outline"
          size="sm"
          @click.stop="loadSampleImages"
        />
      </div>
    </div>
  </UCard>
</template>
