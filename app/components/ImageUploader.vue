<script setup lang="ts">
const emit = defineEmits<{
  filesSelected: [files: File[]]
}>()

const { t } = useI18n()
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
  <div
    :class="[
      'cursor-pointer transition-colors duration-200 border-2 border-dashed rounded-xl text-center py-6 px-4 bg-elevated/30 hover:bg-elevated/60',
      isDragging ? 'border-primary bg-primary/10' : 'border-neutral-300 dark:border-neutral-700'
    ]"
    role="button"
    tabindex="0"
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
      <div class="rounded-xl bg-primary/10 p-2.5 text-primary flex items-center justify-center">
        <UIcon
          name="i-lucide-image-plus"
          class="size-7"
        />
      </div>

      <div class="space-y-1 max-w-lg">
        <p class="font-medium text-base text-highlighted">
          {{ t('uploader.title') }}
        </p>
        <p class="text-xs sm:text-sm text-neutral-500">
          {{ t('uploader.subtitle') }}
        </p>
      </div>

      <UButton
        :label="t('uploader.selectBtn')"
        icon="i-lucide-images"
        color="primary"
        variant="subtle"
        size="sm"
        @click.stop="triggerFilePicker"
      />
    </div>
  </div>
</template>
