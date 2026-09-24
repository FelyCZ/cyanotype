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

const props = withDefaults(
  defineProps<{
    open: boolean
    photo: PhotoItem | null
    previewMode?: 'negative' | 'cyanotype'
    photosCount?: number
  }>(),
  {
    previewMode: 'negative',
    photosCount: 1
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:previewMode': [value: 'negative' | 'cyanotype']
  'apply': [
    photoId: string,
    rotation: number,
    adjustments: ImageAdjustments,
    crop: CropSettings,
    newPreviewUrl: string,
    newCyanotypeUrl: string
  ]
  'applyToAll': [
    photoId: string,
    rotation: number,
    adjustments: ImageAdjustments,
    crop: CropSettings,
    newPreviewUrl: string,
    newCyanotypeUrl: string
  ]
}>()

const isOpen = computed({
  get: () => props.open,
  set: val => emit('update:open', val)
})

const rotation = ref(0)
const adjustments = ref<ImageAdjustments>(createDefaultAdjustments())
const crop = ref<CropSettings>(createDefaultCrop())
const previewDataUrl = ref<string>('')
const isPreviewLoading = ref(false)

// Cyanotype preview peek (hold) & toggle (click) state
const isHoldingEye = ref(false)
let eyePointerStartTime = 0

const isCyanotypeMode = computed(() => {
  const baseMode = props.previewMode === 'cyanotype'
  if (isHoldingEye.value) {
    return !baseMode
  }
  return baseMode
})

const { t } = useI18n()

watch(isCyanotypeMode, () => {
  updatePreview()
})

const aspectRatioOptions = computed(() => [
  { label: t('editor.aspectRatioOriginal'), value: 'original' },
  { label: t('editor.aspectRatioSquare'), value: 'square' },
  { label: '2:3', value: '2x3' },
  { label: '4:3', value: '4x3' },
  { label: '16:9', value: '16x9' },
  { label: '1:2', value: '1x2' },
  { label: t('editor.aspectRatioCustom'), value: 'custom' }
])

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
  isHoldingEye.value = false
  updatePreview()
}

// Cyanotype Preview Button Interaction (Hold to Peek, Click to Toggle)
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
}

function onEyePointerUp(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  const duration = Date.now() - eyePointerStartTime
  isHoldingEye.value = false

  if (duration < 250) {
    // Click / short tap toggles persistent global mode
    const nextMode = props.previewMode === 'cyanotype' ? 'negative' : 'cyanotype'
    emit('update:previewMode', nextMode)
  }
}

function onEyePointerCancel() {
  isHoldingEye.value = false
}

function onEyeClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (eyePointerStartTime === 0) {
    // Keyboard activation fallback
    const nextMode = props.previewMode === 'cyanotype' ? 'negative' : 'cyanotype'
    emit('update:previewMode', nextMode)
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

  const negCanvas = renderAdjustedCanvas(
    cachedImage,
    cachedImage.naturalWidth,
    cachedImage.naturalHeight,
    rotation.value,
    adjustments.value,
    crop.value,
    thumbW,
    thumbH,
    'negative'
  )

  const cyanCanvas = renderAdjustedCanvas(
    cachedImage,
    cachedImage.naturalWidth,
    cachedImage.naturalHeight,
    rotation.value,
    adjustments.value,
    crop.value,
    thumbW,
    thumbH,
    'cyanotype'
  )

  const newPreviewUrl = negCanvas.toDataURL('image/jpeg', 0.88)
  const newCyanotypeUrl = cyanCanvas.toDataURL('image/jpeg', 0.88)

  emit(
    'apply',
    props.photo.id,
    rotation.value,
    { ...adjustments.value },
    { ...crop.value, box: { ...crop.value.box } },
    newPreviewUrl,
    newCyanotypeUrl
  )

  isOpen.value = false
}

function handleApplyToAll() {
  if (!props.photo || !cachedImage) return

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

  const negCanvas = renderAdjustedCanvas(
    cachedImage,
    cachedImage.naturalWidth,
    cachedImage.naturalHeight,
    rotation.value,
    adjustments.value,
    crop.value,
    thumbW,
    thumbH,
    'negative'
  )

  const cyanCanvas = renderAdjustedCanvas(
    cachedImage,
    cachedImage.naturalWidth,
    cachedImage.naturalHeight,
    rotation.value,
    adjustments.value,
    crop.value,
    thumbW,
    thumbH,
    'cyanotype'
  )

  const newPreviewUrl = negCanvas.toDataURL('image/jpeg', 0.88)
  const newCyanotypeUrl = cyanCanvas.toDataURL('image/jpeg', 0.88)

  emit(
    'applyToAll',
    props.photo.id,
    rotation.value,
    { ...adjustments.value },
    { ...crop.value, box: { ...crop.value.box } },
    newPreviewUrl,
    newCyanotypeUrl
  )

  isOpen.value = false
}

// Interactive Overlay Drag & Resize Logic
let activeDragElement: HTMLElement | null = null

function startDrag(type: DragState['type'], event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()

  const target = event.currentTarget as HTMLElement | null
  activeDragElement = target
  try {
    target?.setPointerCapture?.(event.pointerId)
  } catch {
    // Ignore pointer capture errors on unsupported devices/browsers
  }

  const rect = imageElementRef.value?.getBoundingClientRect()
  if (!rect || rect.width <= 0 || rect.height <= 0) return

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
  window.addEventListener('pointercancel', onPointerUp)
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

  const initial = activeDrag.initialBox
  const box = { ...initial }

  if (activeDrag.type === 'move') {
    box.x = Math.max(0, Math.min(1 - box.width, initial.x + deltaX))
    box.y = Math.max(0, Math.min(1 - box.height, initial.y + deltaY))
  } else {
    // Corner resize
    let newX = initial.x
    let newY = initial.y
    let newWidth = initial.width
    let newHeight = initial.height

    if (targetRatio !== null) {
      // In normalized coordinates: (newWidth * rotW) / (newHeight * rotH) = targetRatio
      // Therefore: ratioInNorm = (targetRatio * rotH) / rotW
      // And newHeight = newWidth / ratioInNorm
      const ratioInNorm = (targetRatio * rotH) / rotW

      // Projection of movement along corner diagonal
      // sX = +1 for east, -1 for west
      // sY = +1 for south, -1 for north
      const sX = (activeDrag.type === 'se' || activeDrag.type === 'ne') ? 1 : -1
      const sY = (activeDrag.type === 'se' || activeDrag.type === 'sw') ? 1 : -1

      // Delta width projected along diagonal
      const deltaW = (sX * deltaX * (ratioInNorm * ratioInNorm) + sY * deltaY * ratioInNorm) / (1 + ratioInNorm * ratioInNorm)

      const minW = Math.max(0.05, 0.05 * ratioInNorm)

      if (activeDrag.type === 'se') {
        const anchorX = initial.x
        const anchorY = initial.y
        const maxW = Math.min(1 - anchorX, (1 - anchorY) * ratioInNorm)
        newWidth = Math.max(minW, Math.min(maxW, initial.width + deltaW))
        newHeight = newWidth / ratioInNorm
        newX = anchorX
        newY = anchorY
      } else if (activeDrag.type === 'sw') {
        const anchorX = initial.x + initial.width
        const anchorY = initial.y
        const maxW = Math.min(anchorX, (1 - anchorY) * ratioInNorm)
        newWidth = Math.max(minW, Math.min(maxW, initial.width + deltaW))
        newHeight = newWidth / ratioInNorm
        newX = anchorX - newWidth
        newY = anchorY
      } else if (activeDrag.type === 'ne') {
        const anchorX = initial.x
        const anchorY = initial.y + initial.height
        const maxW = Math.min(1 - anchorX, anchorY * ratioInNorm)
        newWidth = Math.max(minW, Math.min(maxW, initial.width + deltaW))
        newHeight = newWidth / ratioInNorm
        newX = anchorX
        newY = anchorY - newHeight
      } else if (activeDrag.type === 'nw') {
        const anchorX = initial.x + initial.width
        const anchorY = initial.y + initial.height
        const maxW = Math.min(anchorX, anchorY * ratioInNorm)
        newWidth = Math.max(minW, Math.min(maxW, initial.width + deltaW))
        newHeight = newWidth / ratioInNorm
        newX = anchorX - newWidth
        newY = anchorY - newHeight
      }
    } else {
      // Free aspect ratio
      const minSize = 0.05

      if (activeDrag.type === 'se') {
        newWidth = Math.max(minSize, Math.min(1 - initial.x, initial.width + deltaX))
        newHeight = Math.max(minSize, Math.min(1 - initial.y, initial.height + deltaY))
        newX = initial.x
        newY = initial.y
      } else if (activeDrag.type === 'sw') {
        const maxX = initial.x + initial.width
        newX = Math.max(0, Math.min(maxX - minSize, initial.x + deltaX))
        newWidth = maxX - newX
        newHeight = Math.max(minSize, Math.min(1 - initial.y, initial.height + deltaY))
        newY = initial.y
      } else if (activeDrag.type === 'ne') {
        newWidth = Math.max(minSize, Math.min(1 - initial.x, initial.width + deltaX))
        const maxY = initial.y + initial.height
        newY = Math.max(0, Math.min(maxY - minSize, initial.y + deltaY))
        newHeight = maxY - newY
        newX = initial.x
      } else if (activeDrag.type === 'nw') {
        const maxX = initial.x + initial.width
        const maxY = initial.y + initial.height
        newX = Math.max(0, Math.min(maxX - minSize, initial.x + deltaX))
        newY = Math.max(0, Math.min(maxY - minSize, initial.y + deltaY))
        newWidth = maxX - newX
        newHeight = maxY - newY
      }
    }

    box.x = newX
    box.y = newY
    box.width = newWidth
    box.height = newHeight
  }

  crop.value.box = box
}

function onPointerUp(event?: PointerEvent) {
  if (activeDragElement && event) {
    try {
      activeDragElement.releasePointerCapture?.(event.pointerId)
    } catch {
      // Ignore release pointer capture errors if pointer was lost
    }
  }
  activeDragElement = null
  activeDrag = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

watch(isOpen, (val) => {
  if (!val) {
    onPointerUp()
  }
})

onUnmounted(() => {
  onPointerUp()
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('editor.title')"
    :description="t('editor.description')"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div
        v-if="photo"
        class="space-y-6"
      >
        <!-- Interactive Preview & Crop Overlay Container -->
        <div
          ref="previewContainerRef"
          class="flex items-center justify-center bg-neutral-950 rounded-lg p-5 min-h-72 overflow-hidden select-none"
        >
          <div
            v-if="previewDataUrl"
            class="relative inline-block"
          >
            <!-- Background Image -->
            <img
              ref="imageElementRef"
              :src="previewDataUrl"
              :alt="photo.name"
              class="max-h-72 w-auto object-contain rounded block pointer-events-none"
            >

            <!-- Cyanotype Preview Button in Corner of Image -->
            <div class="absolute top-2.5 right-2.5 z-20">
              <button
                type="button"
                class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md cursor-pointer select-none transition-all duration-200 border"
                :class="isCyanotypeMode
                  ? 'bg-[#1C39BB] hover:bg-[#162e97] text-white border-[#1C39BB] shadow-[#1C39BB]/40 ring-2 ring-[#1C39BB]/40'
                  : 'bg-neutral-900/85 hover:bg-neutral-800 text-neutral-200 border-neutral-700/80 hover:text-white'"
                :title="isCyanotypeMode ? t('editor.cyanotypeActiveTooltip') : t('editor.cyanotypeInactiveTooltip')"
                :aria-label="t('editor.toggleCyanotypeAria')"
                @pointerdown="onEyePointerDown"
                @pointerup="onEyePointerUp"
                @pointercancel="onEyePointerCancel"
                @click="onEyeClick"
              >
                <UIcon
                  name="i-lucide-eye"
                  class="w-3.5 h-3.5 shrink-0"
                />
                <span>{{ t('actions.cyanotype') }}</span>
                <span
                  class="w-2 h-2 rounded-full transition-colors"
                  :class="isCyanotypeMode ? 'bg-white animate-pulse' : 'bg-[#1C39BB]'"
                />
              </button>
            </div>

            <!-- Dark Shaded Mask Outside Crop Box -->
            <div
              class="absolute inset-0 pointer-events-none rounded overflow-hidden"
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

              <!-- Corner Resize Handles (enlarged touch hit target with centered visual dot) -->
              <div
                class="absolute -left-5 -top-5 w-10 h-10 flex items-center justify-center cursor-nwse-resize touch-none select-none z-30 group"
                aria-label="Resize top-left"
                @pointerdown="(e) => startDrag('nw', e)"
              >
                <div class="w-4 h-4 rounded-full bg-white border-2 border-primary shadow-sm pointer-events-none transition-transform group-hover:scale-125 group-active:scale-125" />
              </div>
              <div
                class="absolute -right-5 -top-5 w-10 h-10 flex items-center justify-center cursor-nesw-resize touch-none select-none z-30 group"
                aria-label="Resize top-right"
                @pointerdown="(e) => startDrag('ne', e)"
              >
                <div class="w-4 h-4 rounded-full bg-white border-2 border-primary shadow-sm pointer-events-none transition-transform group-hover:scale-125 group-active:scale-125" />
              </div>
              <div
                class="absolute -right-5 -bottom-5 w-10 h-10 flex items-center justify-center cursor-nwse-resize touch-none select-none z-30 group"
                aria-label="Resize bottom-right"
                @pointerdown="(e) => startDrag('se', e)"
              >
                <div class="w-4 h-4 rounded-full bg-white border-2 border-primary shadow-sm pointer-events-none transition-transform group-hover:scale-125 group-active:scale-125" />
              </div>
              <div
                class="absolute -left-5 -bottom-5 w-10 h-10 flex items-center justify-center cursor-nesw-resize touch-none select-none z-30 group"
                aria-label="Resize bottom-left"
                @pointerdown="(e) => startDrag('sw', e)"
              >
                <div class="w-4 h-4 rounded-full bg-white border-2 border-primary shadow-sm pointer-events-none transition-transform group-hover:scale-125 group-active:scale-125" />
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-neutral-400 text-sm flex items-center gap-2"
          >
            <UIcon
              name="i-lucide-loader"
              class="w-5 h-5 animate-spin text-primary"
            />
            {{ t('editor.generatingPreview') }}
          </div>
        </div>

        <!-- Crop & Orientation Bar -->
        <div class="space-y-3 p-3 bg-neutral-100 dark:bg-neutral-800/40 rounded-lg">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <UIcon
                name="i-lucide-crop"
                class="w-4 h-4 text-primary"
              />
              <span>{{ t('editor.cropAndOrientation') }}</span>
            </h3>

            <!-- Rotate 90 Button -->
            <UButton
              :label="t('editor.rotate')"
              icon="i-lucide-rotate-cw"
              color="neutral"
              variant="outline"
              size="xs"
              @click="handleRotate"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <UFormField :label="t('editor.aspectRatio')">
              <USelect
                :model-value="crop.aspectRatio"
                :items="aspectRatioOptions"
                class="w-full"
                @update:model-value="(val) => handleAspectRatioChange(val as AspectRatioOption)"
              />
            </UFormField>

            <!-- Custom Ratio Inputs -->
            <div
              v-if="crop.aspectRatio === 'custom'"
              class="flex items-center gap-2"
            >
              <UFormField
                :label="t('editor.width')"
                class="flex-1"
              >
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
              <UFormField
                :label="t('editor.height')"
                class="flex-1"
              >
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
              <UIcon
                name="i-lucide-sliders"
                class="w-4 h-4 text-primary"
              />
              <span>{{ t('editor.toneAdjustments') }}</span>
            </h3>
            <span class="text-[11px] text-neutral-400">{{ t('editor.sliderResetHint') }}</span>
          </div>

          <div @dblclick="resetSlider('brightness')">
            <UFormField
              :label="t('editor.brightness')"
              :hint="`${adjustments.brightness > 0 ? '+' : ''}${adjustments.brightness}`"
            >
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
            <UFormField
              :label="t('editor.contrast')"
              :hint="`${adjustments.contrast > 0 ? '+' : ''}${adjustments.contrast}`"
            >
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
            <UFormField
              :label="t('editor.highlights')"
              :hint="`${adjustments.highlights > 0 ? '+' : ''}${adjustments.highlights}`"
            >
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
            <UFormField
              :label="t('editor.shadows')"
              :hint="`${adjustments.shadows > 0 ? '+' : ''}${adjustments.shadows}`"
            >
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
          :label="t('editor.reset')"
          color="neutral"
          variant="outline"
          icon="i-lucide-rotate-ccw"
          @click="resetAll"
        />

        <div class="flex items-center gap-2">
          <UButton
            :label="t('editor.cancel')"
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
          />
          <UButton
            v-if="photosCount > 1"
            :label="t('editor.applyAll', { count: photosCount })"
            color="neutral"
            variant="subtle"
            icon="i-lucide-copy-check"
            :title="t('editor.applyAllTooltip')"
            @click="handleApplyToAll"
          />
          <UButton
            :label="t('editor.apply')"
            color="primary"
            icon="i-lucide-check"
            @click="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
