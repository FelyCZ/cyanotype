<script setup lang="ts">
import type { PhotoItem, ImageAdjustments, CropSettings, AspectRatioOption } from '~/types'
import {
  createDefaultAdjustments,
  createDefaultCrop,
  getCropRect,
  loadImageElement,
  renderAdjustedCanvas
} from '~/utils/image-processing'

const props = defineProps<{
  open: boolean
  photo: PhotoItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  apply: [photoId: string, adjustments: ImageAdjustments, crop: CropSettings, newPreviewUrl: string]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const adjustments = ref<ImageAdjustments>(createDefaultAdjustments())
const crop = ref<CropSettings>(createDefaultCrop())
const previewDataUrl = ref<string>('')
const isPreviewLoading = ref(false)

const aspectRatioOptions = [
  { label: 'Original', value: 'original' },
  { label: 'Square', value: 'square' },
  { label: '2x3', value: '2x3' },
  { label: '4x3', value: '4x3' },
  { label: '16x9', value: '16x9' },
  { label: '1x2', value: '1x2' },
  { label: 'Custom', value: 'custom' }
]

let cachedImage: HTMLImageElement | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const canPanHorizontal = computed(() => {
  if (!cachedImage || crop.value.aspectRatio === 'original') return false
  const rect = getCropRect(cachedImage.naturalWidth, cachedImage.naturalHeight, crop.value)
  return rect.sWidth < cachedImage.naturalWidth
})

const canPanVertical = computed(() => {
  if (!cachedImage || crop.value.aspectRatio === 'original') return false
  const rect = getCropRect(cachedImage.naturalWidth, cachedImage.naturalHeight, crop.value)
  return rect.sHeight < cachedImage.naturalHeight
})

watch(
  () => props.photo,
  async (newPhoto) => {
    if (!newPhoto) {
      cachedImage = null
      return
    }

    adjustments.value = { ...newPhoto.adjustments }
    crop.value = { ...newPhoto.crop }
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
  const cropRect = getCropRect(cachedImage.naturalWidth, cachedImage.naturalHeight, crop.value)

  let targetWidth = cropRect.sWidth
  let targetHeight = cropRect.sHeight

  if (cropRect.sWidth > maxDimension || cropRect.sHeight > maxDimension) {
    if (cropRect.sWidth >= cropRect.sHeight) {
      targetHeight = Math.round((cropRect.sHeight / cropRect.sWidth) * maxDimension)
      targetWidth = maxDimension
    } else {
      targetWidth = Math.round((cropRect.sWidth / cropRect.sHeight) * maxDimension)
      targetHeight = maxDimension
    }
  }

  const canvas = renderAdjustedCanvas(
    cachedImage,
    cachedImage.naturalWidth,
    cachedImage.naturalHeight,
    adjustments.value,
    crop.value,
    targetWidth,
    targetHeight
  )

  previewDataUrl.value = canvas.toDataURL('image/jpeg', 0.88)
}

function handleParamChange() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updatePreview()
  }, 40)
}

function handleAspectRatioChange(newRatio: AspectRatioOption) {
  crop.value.aspectRatio = newRatio
  crop.value.panX = 0.5
  crop.value.panY = 0.5
  updatePreview()
}

function resetAll() {
  adjustments.value = createDefaultAdjustments()
  crop.value = createDefaultCrop()
  updatePreview()
}

function handleApply() {
  if (props.photo && previewDataUrl.value) {
    emit('apply', props.photo.id, { ...adjustments.value }, { ...crop.value }, previewDataUrl.value)
  }
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Fine-tune Negative"
    description="Adjust crop and positive tone curves before negative inversion"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div v-if="photo" class="space-y-6">
        <!-- Live Preview -->
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

        <!-- Cropping Controls -->
        <div class="space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800/40 rounded-lg">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <UIcon name="i-lucide-crop" class="w-4 h-4 text-primary" />
            <span>Crop & Aspect Ratio</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Aspect Ratio">
              <USelect
                :model-value="crop.aspectRatio"
                :items="aspectRatioOptions"
                class="w-full"
                @update:model-value="(val) => handleAspectRatioChange(val as AspectRatioOption)"
              />
            </UFormField>

            <!-- Custom Ratio Inputs -->
            <div v-if="crop.aspectRatio === 'custom'" class="flex items-center gap-2">
              <UFormField label="Width" class="flex-1">
                <UInputNumber
                  v-model="crop.customWidth"
                  :min="1"
                  :max="100"
                  :step="1"
                  class="w-full"
                  @update:model-value="handleParamChange"
                />
              </UFormField>
              <span class="pt-6 font-bold text-neutral-400">:</span>
              <UFormField label="Height" class="flex-1">
                <UInputNumber
                  v-model="crop.customHeight"
                  :min="1"
                  :max="100"
                  :step="1"
                  class="w-full"
                  @update:model-value="handleParamChange"
                />
              </UFormField>
            </div>
          </div>

          <!-- Position Adjustments when cropping -->
          <div v-if="canPanHorizontal" class="pt-1">
            <UFormField label="Horizontal Position" :hint="`${Math.round(crop.panX * 100)}%`">
              <USlider
                v-model="crop.panX"
                :min="0"
                :max="1"
                :step="0.01"
                tooltip
                @update:model-value="handleParamChange"
              />
            </UFormField>
          </div>

          <div v-if="canPanVertical" class="pt-1">
            <UFormField label="Vertical Position" :hint="`${Math.round(crop.panY * 100)}%`">
              <USlider
                v-model="crop.panY"
                :min="0"
                :max="1"
                :step="0.01"
                tooltip
                @update:model-value="handleParamChange"
              />
            </UFormField>
          </div>
        </div>

        <!-- Tone Adjustment Sliders -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <UIcon name="i-lucide-sliders" class="w-4 h-4 text-primary" />
            <span>Tone Adjustments</span>
          </h3>

          <UFormField label="Brightness" :hint="`${adjustments.brightness > 0 ? '+' : ''}${adjustments.brightness}`">
            <USlider
              v-model="adjustments.brightness"
              :min="-100"
              :max="100"
              :step="1"
              tooltip
              @update:model-value="handleParamChange"
            />
          </UFormField>

          <UFormField label="Contrast" :hint="`${adjustments.contrast > 0 ? '+' : ''}${adjustments.contrast}`">
            <USlider
              v-model="adjustments.contrast"
              :min="-100"
              :max="100"
              :step="1"
              tooltip
              @update:model-value="handleParamChange"
            />
          </UFormField>

          <UFormField label="Highlights" :hint="`${adjustments.highlights > 0 ? '+' : ''}${adjustments.highlights}`">
            <USlider
              v-model="adjustments.highlights"
              :min="-100"
              :max="100"
              :step="1"
              tooltip
              @update:model-value="handleParamChange"
            />
          </UFormField>

          <UFormField label="Shadows" :hint="`${adjustments.shadows > 0 ? '+' : ''}${adjustments.shadows}`">
            <USlider
              v-model="adjustments.shadows"
              :min="-100"
              :max="100"
              :step="1"
              tooltip
              @update:model-value="handleParamChange"
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
          @click="resetAll"
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
