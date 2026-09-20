<script setup lang="ts">
import type { PhotoItem, ImageAdjustments, CropSettings, CropBox, AspectRatioOption } from '~/types'
import {
  createDefaultAdjustments,
  createDefaultCrop,
  createDefaultCropBox,
  calculateInitialCropBox,
  getNumericRatio,
  loadImageElement,
  renderAdjustedCanvas
} from '~/utils/image-processing'

const props = defineProps<{
  open: boolean
  photo: PhotoItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  apply: [
    photoId: string,
    rotation: number,
    adjustments: ImageAdjustments,
    crop: CropSettings,
    newPreviewUrl: string
  ]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const rotation = ref(0)
const adjustments = ref<ImageAdjustments>(createDefaultAdjustments())
const crop = ref<CropSettings>(createDefaultCrop())
const previewDataUrl = ref<string>('')
const isPreviewLoading = ref(false)

// Cyanotype preview peek (hold) & toggle (click) state
const isCyanotypeToggled = ref(false)
const isHoldingEye = ref(false)
let eyePointerStartTime = 0

const isCyanotypeMode = computed(() => {
  if (isHoldingEye.value) {
    return !isCyanotypeToggled.value
  }
  return isCyanotypeToggled.value
})

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

// Overlay interaction state
const previewContainerRef = ref<HTMLDivElement | null>(null)
const imageElementRef = ref<HTMLImageElement | null>(null)

interface DragState {
  type: 'move' | 'nw' | 'ne' | 'se' | 'sw'
  startX: number
  startY: number
  initialBox: CropBox
  containerWidth: number
  containerHeight: number
}

let activeDrag: DragState | null = null

watch(
  () => props.photo,
  async (newPhoto) => {
    if (!newPhoto) {
      cachedImage = null
      return
    }

    rotation.value = newPhoto.rotation || 0
    adjustments.value = { ...newPhoto.adjustments }
    crop.value = {
      aspectRatio: newPhoto.crop?.aspectRatio || 'original',
      customWidth: newPhoto.crop?.customWidth || 1,
      customHeight: newPhoto.crop?.customHeight || 1,
      box: newPhoto.crop?.box ? { ...newPhoto.crop.box } : createDefaultCropBox()
    }
    isCyanotypeToggled.value = false
    isHoldingEye.value = false
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

  const maxDimension = 640
  const isSwap = ((rotation.value % 360) + 360) % 360 === 90 || ((rotation.value % 360) + 360) % 360 === 270
  const rotW = isSwap ? cachedImage.naturalHeight : cachedImage.naturalWidth
  const rotH = isSwap ? cachedImage.naturalWidth : cachedImage.naturalHeight

  let targetWidth = rotW
  let targetHeight = rotH

  if (rotW > maxDimension || rotH > maxDimension) {
    if (rotW >= rotH) {
      targetWidth = maxDimension
      targetHeight = Math.round((rotH / rotW) * maxDimension)
    } else {
      targetHeight = maxDimension
      targetWidth = Math.round((rotW / rotH) * maxDimension)
    }
  }

  // To display the full image in the editor with the overlay on top, render full rotated image with tone adjustments
  const fullCrop = {
    aspectRatio: 'original' as AspectRatioOption,
    customWidth: 1,
    customHeight: 1,
    box: createDefaultCropBox()
  }

  const canvas = renderAdjustedCanvas(
    cachedImage,
    cachedImage.naturalWidth,
    cachedImage.naturalHeight,
    rotation.value,
    adjustments.value,
    fullCrop,
    targetWidth,
    targetHeight,
    isCyanotypeMode.value ? 'cyanotype' : 'negative'
  )

  previewDataUrl.value = canvas.toDataURL('image/jpeg', 0.88)
}

function handleParamChange() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updatePreview()
  }, 30)
}

function handleRotate() {
  rotation.value = (rotation.value + 90) % 360
  if (cachedImage) {
    const isSwap = rotation.value === 90 || rotation.value === 270
    const w = isSwap ? cachedImage.naturalHeight : cachedImage.naturalWidth
    const h = isSwap ? cachedImage.naturalWidth : cachedImage.naturalHeight
    crop.value.box = calculateInitialCropBox(
      w,
      h,
      crop.value.aspectRatio,
      crop.value.customWidth,
      crop.value.customHeight
    )
  }
  updatePreview()
}

function handleAspectRatioChange(newRatio: AspectRatioOption) {
  crop.value.aspectRatio = newRatio
  if (cachedImage) {
    const isSwap = rotation.value === 90 || rotation.value === 270
    const w = isSwap ? cachedImage.naturalHeight : cachedImage.naturalWidth
    const h = isSwap ? cachedImage.naturalWidth : cachedImage.naturalHeight
    crop.value.box = calculateInitialCropBox(
      w,
      h,
      newRatio,
      crop.value.customWidth,
      crop.value.customHeight
    )
  }
}

function handleCustomRatioChange() {
  if (crop.value.aspectRatio === 'custom' && cachedImage) {
    const isSwap = rotation.value === 90 || rotation.value === 270
    const w = isSwap ? cachedImage.naturalHeight : cachedImage.naturalWidth
    const h = isSwap ? cachedImage.naturalWidth : cachedImage.naturalHeight
    crop.value.box = calculateInitialCropBox(
      w,
      h,
      'custom',
      crop.value.customWidth,
      crop.value.customHeight
    )
  }
}

function resetSlider(key: keyof ImageAdjustments) {
  adjustments.value[key] = 0
  handleParamChange()
}

function resetAll() {
  rotation.value = 0
  adjustments.value = createDefaultAdjustments()
  crop.value = createDefaultCrop()
  isCyanotypeToggled.value = false
  isHoldingEye.value = false
  updatePreview()
}

// Cyanotype Eye Button Interaction (Hold to Peek, Click to Toggle)
function onEyePointerDown(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  try {
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  } catch {
    // Ignore if pointer capture is not supported
  }
  eyePointerStartTime = Date.now()
  isHoldingEye.value = true
  updatePreview()
}

function onEyePointerUp(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  const duration = Date.now() - eyePointerStartTime
  isHoldingEye.value = false

  if (duration < 250) {
    // Click / short tap toggles persistent mode
    isCyanotypeToggled.value = !isCyanotypeToggled.value
  }
  // If held, releasing naturally reverts peek preview
  updatePreview()
}

function onEyePointerCancel() {
  if (isHoldingEye.value) {
    isHoldingEye.value = false
    updatePreview()
  }
}

function onEyeClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (eyePointerStartTime === 0) {
    // Keyboard activation fallback
    isCyanotypeToggled.value = !isCyanotypeToggled.value
    updatePreview()
  }
  eyePointerStartTime = 0
}

function handleApply() {
  if (!props.photo || !cachedImage) return

  // Generate thumbnail with applied crop and rotation
  const isSwap = rotation.value === 90 || rotation.value === 270
  const rotW = isSwap ? cachedImage.naturalHeight : cachedImage.naturalWidth
  const rotH = isSwap ? cachedImage.naturalWidth : cachedImage.naturalHeight

  const cropW = Math.max(1, Math.round(crop.value.box.width * rotW))
  const cropH = Math.max(1, Math.round(crop.value.box.height * rotH))

  let thumbW = cropW
  let thumbH = cropH
  const maxThumb = 600
  if (thumbW > maxThumb || thumbH > maxThumb) {
    if (thumbW >= thumbH) {
      thumbH = Math.round((thumbH / thumbW) * maxThumb)
      thumbW = maxThumb
    } else {
      thumbW = Math.round((thumbW / thumbH) * maxThumb)
      thumbH = maxThumb
    }
  }

  const canvas = renderAdjustedCanvas(
    cachedImage,
    cachedImage.naturalWidth,
    cachedImage.naturalHeight,
    rotation.value,
    adjustments.value,
    crop.value,
    thumbW,
    thumbH
  )

  const thumbUrl = canvas.toDataURL('image/jpeg', 0.88)

  emit(
    'apply',
    props.photo.id,
    rotation.value,
    { ...adjustments.value },
    { ...crop.value, box: { ...crop.value.box } },
    thumbUrl
  )

  isOpen.value = false
}

// Interactive Overlay Drag & Resize Logic
function startDrag(type: DragState['type'], event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()

  const target = event.currentTarget as HTMLElement
  target.setPointerCapture?.(event.pointerId)

  const rect = imageElementRef.value?.getBoundingClientRect()
  if (!rect) return

  activeDrag = {
    type,
    startX: event.clientX,
    startY: event.clientY,
    initialBox: { ...crop.value.box },
    containerWidth: rect.width,
    containerHeight: rect.height
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event: PointerEvent) {
  if (!activeDrag || !cachedImage) return

  const deltaX = (event.clientX - activeDrag.startX) / activeDrag.containerWidth
  const deltaY = (event.clientY - activeDrag.startY) / activeDrag.containerHeight

  const isSwap = rotation.value === 90 || rotation.value === 270
  const rotW = isSwap ? cachedImage.naturalHeight : cachedImage.naturalWidth
  const rotH = isSwap ? cachedImage.naturalWidth : cachedImage.naturalHeight
  const targetRatio = getNumericRatio(
    crop.value.aspectRatio,
    rotW >= rotH,
    crop.value.customWidth,
    crop.value.customHeight
  )

  const box = { ...activeDrag.initialBox }

  if (activeDrag.type === 'move') {
    box.x = Math.max(0, Math.min(1 - box.width, activeDrag.initialBox.x + deltaX))
    box.y = Math.max(0, Math.min(1 - box.height, activeDrag.initialBox.y + deltaY))
  } else {
    // Resize with corner handles
    let newWidth = box.width
    let newHeight = box.height
    let newX = box.x
    let newY = box.y

    if (activeDrag.type === 'se') {
      newWidth = Math.max(0.1, Math.min(1 - box.x, activeDrag.initialBox.width + deltaX))
      newHeight = Math.max(0.1, Math.min(1 - box.y, activeDrag.initialBox.height + deltaY))
    } else if (activeDrag.type === 'sw') {
      const maxX = activeDrag.initialBox.x + activeDrag.initialBox.width
      newX = Math.max(0, Math.min(maxX - 0.1, activeDrag.initialBox.x + deltaX))
      newWidth = maxX - newX
      newHeight = Math.max(0.1, Math.min(1 - box.y, activeDrag.initialBox.height + deltaY))
    } else if (activeDrag.type === 'ne') {
      newWidth = Math.max(0.1, Math.min(1 - box.x, activeDrag.initialBox.width + deltaX))
      const maxY = activeDrag.initialBox.y + activeDrag.initialBox.height
      newY = Math.max(0, Math.min(maxY - 0.1, activeDrag.initialBox.y + deltaY))
      newHeight = maxY - newY
    } else if (activeDrag.type === 'nw') {
      const maxX = activeDrag.initialBox.x + activeDrag.initialBox.width
      const maxY = activeDrag.initialBox.y + activeDrag.initialBox.height
      newX = Math.max(0, Math.min(maxX - 0.1, activeDrag.initialBox.x + deltaX))
      newY = Math.max(0, Math.min(maxY - 0.1, activeDrag.initialBox.y + deltaY))
      newWidth = maxX - newX
      newHeight = maxY - newY
    }

    // Maintain aspect ratio constraint if specified
    if (targetRatio !== null) {
      // In pixel terms: (newWidth * rotW) / (newHeight * rotH) = targetRatio
      // Therefore: newHeight = (newWidth * rotW) / (rotH * targetRatio)
      const ratioInNorm = (targetRatio * rotH) / rotW
      newHeight = newWidth / ratioInNorm
      if (newY + newHeight > 1) {
        newHeight = 1 - newY
        newWidth = newHeight * ratioInNorm
      }
      if (newX + newWidth > 1) {
        newWidth = 1 - newX
        newHeight = newWidth / ratioInNorm
      }
    }

    box.x = newX
    box.y = newY
    box.width = newWidth
    box.height = newHeight
  }

  crop.value.box = box
}

function onPointerUp() {
  activeDrag = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Fine-tune Negative"
    description="Adjust crop, rotation, and positive tone curves before negative inversion"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div v-if="photo" class="space-y-6">
        <!-- Interactive Preview & Crop Overlay Container -->
        <div
          ref="previewContainerRef"
          class="flex items-center justify-center bg-neutral-950 rounded-lg p-3 min-h-72 overflow-hidden select-none"
        >
          <div
            v-if="previewDataUrl"
            class="relative inline-block overflow-hidden"
          >
            <!-- Background Image -->
            <img
              ref="imageElementRef"
              :src="previewDataUrl"
              :alt="photo.name"
              class="max-h-72 w-auto object-contain rounded block pointer-events-none"
            >

            <!-- Small Circular Eye Button in Corner of Image -->
            <div class="absolute top-2.5 right-2.5 z-30">
              <UButton
                icon="i-lucide-eye"
                size="xs"
                :color="isCyanotypeMode ? 'primary' : 'neutral'"
                :variant="isCyanotypeMode ? 'solid' : 'subtle'"
                class="rounded-full shadow-lg backdrop-blur-md cursor-pointer select-none"
                :title="isCyanotypeMode ? 'Developed print preview' : 'Preview developed print'"
                aria-label="Preview developed cyanotype print"
                @pointerdown="onEyePointerDown"
                @pointerup="onEyePointerUp"
                @pointercancel="onEyePointerCancel"
                @click="onEyeClick"
              />
            </div>

            <!-- Dark Shaded Mask Outside Crop Box -->
            <div
              class="absolute inset-0 pointer-events-none"
            >
              <!-- Top Mask -->
              <div
                class="absolute left-0 top-0 right-0 bg-black/60"
                :style="{ height: `${crop.box.y * 100}%` }"
              />
              <!-- Bottom Mask -->
              <div
                class="absolute left-0 right-0 bottom-0 bg-black/60"
                :style="{ height: `${(1 - crop.box.y - crop.box.height) * 100}%` }"
              />
              <!-- Left Mask -->
              <div
                class="absolute left-0 bg-black/60"
                :style="{
                  top: `${crop.box.y * 100}%`,
                  height: `${crop.box.height * 100}%`,
                  width: `${crop.box.x * 100}%`
                }"
              />
              <!-- Right Mask -->
              <div
                class="absolute right-0 bg-black/60"
                :style="{
                  top: `${crop.box.y * 100}%`,
                  height: `${crop.box.height * 100}%`,
                  width: `${(1 - crop.box.x - crop.box.width) * 100}%`
                }"
              />
            </div>

            <!-- Draggable & Resizable Crop Box -->
            <div
              class="absolute border-2 border-primary cursor-move touch-none z-10"
              :style="{
                left: `${crop.box.x * 100}%`,
                top: `${crop.box.y * 100}%`,
                width: `${crop.box.width * 100}%`,
                height: `${crop.box.height * 100}%`
              }"
              @pointerdown="(e) => startDrag('move', e)"
            >
              <!-- Rule-of-Thirds Grid Lines -->
              <div class="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div class="border-r border-b border-white/25" />
                <div class="border-r border-b border-white/25" />
                <div class="border-b border-white/25" />
                <div class="border-r border-b border-white/25" />
                <div class="border-r border-b border-white/25" />
                <div class="border-b border-white/25" />
                <div class="border-r border-white/25" />
                <div class="border-r border-white/25" />
                <div />
              </div>

              <!-- Corner Resize Handles -->
              <div
                class="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-white border-2 border-primary cursor-nwse-resize"
                @pointerdown="(e) => startDrag('nw', e)"
              />
              <div
                class="absolute -right-2 -top-2 w-4 h-4 rounded-full bg-white border-2 border-primary cursor-nesw-resize"
                @pointerdown="(e) => startDrag('ne', e)"
              />
              <div
                class="absolute -right-2 -bottom-2 w-4 h-4 rounded-full bg-white border-2 border-primary cursor-nwse-resize"
                @pointerdown="(e) => startDrag('se', e)"
              />
              <div
                class="absolute -left-2 -bottom-2 w-4 h-4 rounded-full bg-white border-2 border-primary cursor-nesw-resize"
                @pointerdown="(e) => startDrag('sw', e)"
              />
            </div>
          </div>

          <div v-else class="text-neutral-400 text-sm flex items-center gap-2">
            <UIcon name="i-lucide-loader" class="w-5 h-5 animate-spin text-primary" />
            Generating preview...
          </div>
        </div>

        <!-- Crop & Orientation Bar -->
        <div class="space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800/40 rounded-lg">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-crop" class="w-4 h-4 text-primary" />
              <span>Crop & Orientation</span>
            </h3>

            <!-- Rotate 90 Button -->
            <UButton
              label="Rotate 90°"
              icon="i-lucide-rotate-cw"
              color="neutral"
              variant="outline"
              size="xs"
              @click="handleRotate"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
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
                  @update:model-value="handleCustomRatioChange"
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
                  @update:model-value="handleCustomRatioChange"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Tone Adjustment Sliders (Double click resets to 0) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-sliders" class="w-4 h-4 text-primary" />
              <span>Tone Adjustments</span>
            </h3>
            <span class="text-[11px] text-neutral-400">Double click slider to reset to 0</span>
          </div>

          <div @dblclick="resetSlider('brightness')">
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
          </div>

          <div @dblclick="resetSlider('contrast')">
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
          </div>

          <div @dblclick="resetSlider('highlights')">
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
          </div>

          <div @dblclick="resetSlider('shadows')">
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
