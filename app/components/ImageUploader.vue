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
        <UIcon
          name="i-lucide-upload-cloud"
          class="w-8 h-8"
        />
      </div>

      <div class="space-y-1">
        <p class="font-medium text-base">
          Click to choose images or drag and drop here
        </p>
        <p class="text-sm text-neutral-500">
          Supports JPEG, PNG, WebP, TIFF. All processing happens locally in your browser.
        </p>
      </div>

      <UButton
        label="Select Images"
        icon="i-lucide-images"
        color="primary"
        variant="subtle"
        @click.stop="triggerFilePicker"
      />
    </div>
  </UCard>
</template>
