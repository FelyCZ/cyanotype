<script setup lang="ts">
import type { PageSettings, PhotoItem } from '~/types'

const props = defineProps<{
  photos: PhotoItem[]
  settings: PageSettings
  isExporting: boolean
  isPreviewing: boolean
  exportProgress: number
  exportStatusText: string
  errorMessage?: string
  successMessage?: string
}>()

const emit = defineEmits<{
  saveAll: []
  previewPages: []
  clearAll: []
  dismissAlert: []
}>()

const sheetCount = computed(() => {
  if (props.photos.length === 0) return 0
  return Math.ceil(props.photos.length / props.settings.photosPerPage)
})

const summaryText = computed(() => {
  if (props.photos.length === 0) return 'No images selected'
  const count = props.photos.length
  const formatLabel = props.settings.imageFormat.toUpperCase()
  return `${count} image${count > 1 ? 's' : ''} ready to save as ${formatLabel} negative${count > 1 ? 's' : ''} or preview as ${sheetCount.value} ${props.settings.pageSize} page${sheetCount.value > 1 ? 's' : ''} at ${props.settings.dpi} DPI`
})
</script>

<template>
  <div class="space-y-4">
    <!-- Success or Error Alerts -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-circle"
      :title="errorMessage"
      close
      @update:open="emit('dismissAlert')"
    />

    <UAlert
      v-if="successMessage"
      color="success"
      variant="subtle"
      icon="i-lucide-check-circle"
      :title="successMessage"
      close
      @update:open="emit('dismissAlert')"
    />

    <!-- Export / Preview Progress Bar -->
    <UCard v-if="isExporting || isPreviewing">
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium flex items-center gap-2">
            <UIcon name="i-lucide-loader" class="w-4 h-4 animate-spin text-primary" />
            {{ exportStatusText || (isPreviewing ? 'Generating preview pages...' : 'Exporting negatives...') }}
          </span>
          <span class="text-neutral-500">{{ Math.round(exportProgress) }}%</span>
        </div>
        <UProgress :model-value="exportProgress" :max="100" />
      </div>
    </UCard>

    <!-- Main Action Card -->
    <UCard v-if="photos.length > 0">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <UIcon name="i-lucide-info" class="w-4 h-4 text-primary shrink-0" />
          <span>{{ summaryText }}</span>
        </div>

        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <UButton
            label="Clear All"
            color="neutral"
            variant="ghost"
            icon="i-lucide-trash"
            :disabled="isExporting || isPreviewing"
            @click="emit('clearAll')"
          />

          <UButton
            label="Preview pages"
            color="neutral"
            variant="subtle"
            size="lg"
            icon="i-lucide-file-text"
            :loading="isPreviewing"
            :disabled="isExporting"
            @click="emit('previewPages')"
          />

          <UButton
            label="Save All Negatives"
            color="primary"
            size="lg"
            icon="i-lucide-download"
            :loading="isExporting"
            :disabled="isPreviewing"
            @click="emit('saveAll')"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>
