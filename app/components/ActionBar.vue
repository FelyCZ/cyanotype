<script setup lang="ts">
import type { PageSettings, PhotoItem } from '~/types'

const props = withDefaults(
  defineProps<{
    photos: PhotoItem[]
    settings: PageSettings
    isExporting: boolean
    isPreviewing: boolean
    exportProgress: number
    exportStatusText: string
    previewMode?: 'negative' | 'cyanotype'
    errorMessage?: string
    successMessage?: string
  }>(),
  {
    previewMode: 'negative',
    errorMessage: '',
    successMessage: ''
  }
)

const emit = defineEmits<{
  'update:previewMode': [value: 'negative' | 'cyanotype']
  'saveAll': []
  'previewPages': []
  'clearAll': []
  'dismissAlert': []
}>()

const summaryText = computed(() => {
  if (props.photos.length === 0) return 'No images selected'
  const count = props.photos.length
  return `${count} image${count > 1 ? 's' : ''} loaded!`
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
            <UIcon
              name="i-lucide-loader"
              class="w-4 h-4 animate-spin text-primary"
            />
            {{ exportStatusText || (isPreviewing ? 'Generating preview pages...' : 'Exporting negatives...') }}
          </span>
          <span class="text-neutral-500">{{ Math.round(exportProgress) }}%</span>
        </div>
        <UProgress
          :model-value="exportProgress"
          :max="100"
        />
      </div>
    </UCard>

    <!-- Main Action Card -->
    <UCard v-if="photos.length > 0">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <!-- Summary Info -->
        <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <UIcon
            name="i-lucide-info"
            class="w-4 h-4 text-primary shrink-0"
          />
          <span>{{ summaryText }}</span>
        </div>

        <!-- Action Buttons (wrapping onto multiple lines on mobile when space is limited) -->
        <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
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

    <!-- Global Preview Mode Switch: Negatives / Cyanotype (Centered under the card) -->
    <div
      v-if="photos.length > 0"
      class="flex justify-center items-center pt-1 pb-1"
    >
      <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/70 shadow-xs select-none text-xs sm:text-sm font-medium">
        <button
          type="button"
          class="transition-colors cursor-pointer"
          :class="previewMode === 'negative' ? 'text-neutral-950 dark:text-white font-semibold' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'"
          @click="emit('update:previewMode', 'negative')"
        >
          Negatives
        </button>

        <USwitch
          :model-value="previewMode === 'cyanotype'"
          size="sm"
          color="primary"
          aria-label="Toggle between negatives and cyanotype thumbnail preview"
          @update:model-value="(val) => emit('update:previewMode', val ? 'cyanotype' : 'negative')"
        />

        <button
          type="button"
          class="flex items-center gap-1.5 transition-colors cursor-pointer"
          :class="previewMode === 'cyanotype' ? 'text-primary font-semibold' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'"
          @click="emit('update:previewMode', 'cyanotype')"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-[#1C39BB]" />
          <span>Cyanotype</span>
        </button>
      </div>
    </div>
  </div>
</template>
