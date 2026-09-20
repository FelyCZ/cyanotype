<script setup lang="ts">
import type { PageSettings, PhotoItem } from '~/types'

const props = defineProps<{
  photos: PhotoItem[]
  settings: PageSettings
  isExporting: boolean
  exportProgress: number
  exportStatusText: string
  errorMessage?: string
  successMessage?: string
}>()

const emit = defineEmits<{
  saveAll: []
  clearAll: []
  dismissAlert: []
}>()

const sheetCount = computed(() => {
  if (props.photos.length === 0) return 0
  return Math.ceil(props.photos.length / props.settings.photosPerPage)
})

const summaryText = computed(() => {
  if (props.photos.length === 0) return 'No images selected'
  if (props.settings.outputMode === 'individual') {
    return `${props.photos.length} image${props.photos.length > 1 ? 's' : ''} ready to export as PNG negatives`
  }
  return `${props.photos.length} image${props.photos.length > 1 ? 's' : ''} will be compiled into ${sheetCount.value} ${props.settings.pageSize} page${sheetCount.value > 1 ? 's' : ''} (${props.settings.dpi} DPI)`
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

    <!-- Export Progress Bar -->
    <UCard v-if="isExporting">
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium flex items-center gap-2">
            <UIcon name="i-lucide-loader" class="w-4 h-4 animate-spin text-primary" />
            {{ exportStatusText || 'Exporting negatives...' }}
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

        <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
          <UButton
            label="Clear All"
            color="neutral"
            variant="ghost"
            icon="i-lucide-trash"
            :disabled="isExporting"
            @click="emit('clearAll')"
          />

          <UButton
            label="Save All Negatives"
            color="primary"
            size="lg"
            icon="i-lucide-download"
            :loading="isExporting"
            @click="emit('saveAll')"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>
