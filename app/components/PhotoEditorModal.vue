<script setup lang="ts">
import type { PhotoItem, ImageAdjustments } from '~/types'
import {
  createDefaultAdjustments,
  loadImageElement,
  renderAdjustedCanvas
} from '~/utils/image-processing'

const props = defineProps<{
  open: boolean
  photo: PhotoItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  apply: [photoId: string, adjustments: ImageAdjustments, newPreviewUrl: string]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const adjustments = ref<ImageAdjustments>(createDefaultAdjustments())
const previewDataUrl = ref<string>('')
const isPreviewLoading = ref(false)

let cachedImage: HTMLImageElement | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.photo,
  async (newPhoto) => {
    if (!newPhoto) {
      cachedImage = null
      return
    }

    adjustments.value = { ...newPhoto.adjustments }
    isPreviewLoading.value = true

    try {
      cachedImage = await loadImageElement(newPhoto.originalUrl)
      updatePreview()
    } catch (err) {
      console.error('Failed to load image for editor', err)
    } finally {
      isPreviewLoading.value = false
    }
  },
  { immediate: true }
)

function updatePreview() {
  if (!cachedImage) return

  const maxDimension = 600
  let targetWidth = cachedImage.naturalWidth || cachedImage.width
  let targetHeight = cachedImage.naturalHeight || cachedImage.height

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight / targetWidth) * maxDimension)
      targetWidth = maxDimension
    } else {
      targetWidth = Math.round((targetWidth / targetHeight) * maxDimension)
      targetHeight = maxDimension
    }
  }

  const canvas = renderAdjustedCanvas(
    cachedImage,
    cachedImage.naturalWidth,
    cachedImage.naturalHeight,
    adjustments.value,
    targetWidth,
    targetHeight
  )

  previewDataUrl.value = canvas.toDataURL('image/jpeg', 0.88)
}

function handleAdjustmentChange() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updatePreview()
  }, 40)
}

function resetAdjustments() {
  adjustments.value = createDefaultAdjustments()
  updatePreview()
}

function handleApply() {
  if (props.photo && previewDataUrl.value) {
    emit('apply', props.photo.id, { ...adjustments.value }, previewDataUrl.value)
  }
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Fine-tune Negative"
    description="Adjust positive tone curves before negative inversion"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div v-if="photo" class="space-y-6">
        <!-- Live Preview Canvas -->
        <div class="flex items-center justify-center bg-neutral-900/80 rounded-lg p-3 min-h-64 overflow-hidden">
          <img
            v-if="previewDataUrl"
            :src="previewDataUrl"
            :alt="photo.name"
            class="max-h-72 w-auto object-contain rounded shadow"
          >
          <div v-else class="text-neutral-400 text-sm flex items-center gap-2">
            <UIcon name="i-lucide-loader" class="w-5 h-5 animate-spin" />
            Generating preview...
          </div>
        </div>

        <!-- Tone Adjustment Sliders -->
        <div class="space-y-4">
          <UFormField label="Brightness" :hint="`${adjustments.brightness > 0 ? '+' : ''}${adjustments.brightness}`">
            <USlider
              v-model="adjustments.brightness"
              :min="-100"
              :max="100"
              :step="1"
              tooltip
              @update:model-value="handleAdjustmentChange"
            />
          </UFormField>

          <UFormField label="Contrast" :hint="`${adjustments.contrast > 0 ? '+' : ''}${adjustments.contrast}`">
            <USlider
              v-model="adjustments.contrast"
              :min="-100"
              :max="100"
              :step="1"
              tooltip
              @update:model-value="handleAdjustmentChange"
            />
          </UFormField>

          <UFormField label="Highlights" :hint="`${adjustments.highlights > 0 ? '+' : ''}${adjustments.highlights}`">
            <USlider
              v-model="adjustments.highlights"
              :min="-100"
              :max="100"
              :step="1"
              tooltip
              @update:model-value="handleAdjustmentChange"
            />
          </UFormField>

          <UFormField label="Shadows" :hint="`${adjustments.shadows > 0 ? '+' : ''}${adjustments.shadows}`">
            <USlider
              v-model="adjustments.shadows"
              :min="-100"
              :max="100"
              :step="1"
              tooltip
              @update:model-value="handleAdjustmentChange"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <UButton
          label="Reset"
          color="neutral"
          variant="outline"
          icon="i-lucide-rotate-ccw"
          @click="resetAdjustments"
        />

        <div class="flex items-center gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
          />
          <UButton
            label="Apply Changes"
            color="primary"
            icon="i-lucide-check"
            @click="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
