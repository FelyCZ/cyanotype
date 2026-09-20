<script setup lang="ts">
import type { PhotoItem, PageSettings, ImageAdjustments } from '~/types'
import { createDefaultAdjustments, loadImageElement, createThumbnailFromImage } from '~/utils/image-processing'
import { exportSheetsToPdfBlob, exportIndividualPngs, saveFilesToUserSelection } from '~/utils/export-service'

const settings = ref<PageSettings>({
  pageSize: 'A4',
  dpi: 300,
  photosPerPage: 1,
  orientation: 'auto',
  outputMode: 'sheets',
  marginMm: 10
})

const photos = ref<PhotoItem[]>([])
const isBatchProcessing = ref(false)
const processingProgress = ref(0)
const processingStatusText = ref('')

const isExporting = ref(false)
const exportProgress = ref(0)
const exportStatusText = ref('')

const editingPhoto = ref<PhotoItem | null>(null)
const isEditorOpen = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

async function handleFilesSelected(files: File[]) {
  errorMessage.value = ''
  successMessage.value = ''

  const newItems: PhotoItem[] = files.map((file) => ({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: file.name,
    file,
    originalUrl: URL.createObjectURL(file),
    previewUrl: '',
    originalWidth: 0,
    originalHeight: 0,
    adjustments: createDefaultAdjustments(),
    status: 'pending'
  }))

  photos.value.push(...newItems)
  await processPendingPhotos()
}

async function processPendingPhotos() {
  const pendingPhotos = photos.value.filter(p => p.status === 'pending')
  if (pendingPhotos.length === 0) return

  isBatchProcessing.value = true
  processingProgress.value = 0
  const total = pendingPhotos.length

  for (let i = 0; i < total; i++) {
    const photo = pendingPhotos[i]!
    photo.status = 'processing'
    processingStatusText.value = `Converting ${photo.name} (${i + 1} of ${total})`
    processingProgress.value = Math.round(((i) / total) * 100)

    try {
      const img = await loadImageElement(photo.originalUrl)
      const { previewUrl, width, height } = await createThumbnailFromImage(img, photo.adjustments)
      photo.originalWidth = width
      photo.originalHeight = height
      photo.previewUrl = previewUrl
      photo.status = 'done'
    } catch (err: unknown) {
      console.error('Error converting photo:', err)
      photo.status = 'error'
      photo.errorMessage = 'Failed to process image'
    }

    processingProgress.value = Math.round(((i + 1) / total) * 100)
  }

  isBatchProcessing.value = false
  processingStatusText.value = ''
}

function handleEditPhoto(photo: PhotoItem) {
  editingPhoto.value = photo
  isEditorOpen.value = true
}

function handleApplyEditorChanges(photoId: string, adjustments: ImageAdjustments, newPreviewUrl: string) {
  const photo = photos.value.find(p => p.id === photoId)
  if (photo) {
    photo.adjustments = adjustments
    photo.previewUrl = newPreviewUrl
  }
}

function handleRemovePhoto(photoId: string) {
  const index = photos.value.findIndex(p => p.id === photoId)
  if (index !== -1) {
    const [removed] = photos.value.splice(index, 1)
    if (removed?.originalUrl) {
      URL.revokeObjectURL(removed.originalUrl)
    }
  }
}

function handleClearAll() {
  photos.value.forEach(p => {
    if (p.originalUrl) URL.revokeObjectURL(p.originalUrl)
  })
  photos.value = []
  errorMessage.value = ''
  successMessage.value = ''
}

async function handleSaveAll() {
  if (photos.value.length === 0) return

  errorMessage.value = ''
  successMessage.value = ''
  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = 'Preparing export...'

  try {
    if (settings.value.outputMode === 'sheets') {
      const pdfBlob = await exportSheetsToPdfBlob(photos.value, settings.value, (progress) => {
        exportProgress.value = Math.round((progress.current / progress.total) * 100)
        exportStatusText.value = progress.step
      })

      exportStatusText.value = 'Saving PDF...'
      const result = await saveFilesToUserSelection([
        { name: `cyanotype-${settings.value.pageSize.toLowerCase()}-negatives.pdf`, blob: pdfBlob }
      ], (status) => {
        exportStatusText.value = status
      })

      if (result.method === 'directory') {
        successMessage.value = 'PDF sheet saved successfully to chosen folder.'
      } else {
        successMessage.value = 'PDF sheet downloaded successfully.'
      }
    } else {
      const pngFiles = await exportIndividualPngs(photos.value, (progress) => {
        exportProgress.value = Math.round((progress.current / progress.total) * 100)
        exportStatusText.value = progress.step
      })

      exportStatusText.value = 'Saving images...'
      const result = await saveFilesToUserSelection(pngFiles, (status) => {
        exportStatusText.value = status
      })

      if (result.method === 'directory') {
        successMessage.value = 'All negative PNGs saved successfully to chosen folder.'
      } else if (result.method === 'zip') {
        successMessage.value = 'All negative PNGs packaged and downloaded as a ZIP archive.'
      } else {
        successMessage.value = 'Negative PNG downloaded successfully.'
      }
    }
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      // User cancelled directory picker
    } else {
      console.error('Export failed:', err)
      errorMessage.value = 'Export failed. Please try again.'
    }
  } finally {
    isExporting.value = false
    exportProgress.value = 0
    exportStatusText.value = ''
  }
}

onUnmounted(() => {
  photos.value.forEach(p => {
    if (p.originalUrl) URL.revokeObjectURL(p.originalUrl)
  })
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl space-y-8">
    <!-- Intro Banner -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">
        Cyanotype Negative Generator
      </h1>
      <p class="text-neutral-500 max-w-2xl text-sm sm:text-base">
        Select photos to convert them into inverted grayscale negatives ready for printing onto transparency film for cyanotype contact printing. All processing runs entirely on your device.
      </p>
    </div>

    <!-- Page & Output Settings -->
    <SettingsBar v-model="settings" />

    <!-- Upload Dropzone -->
    <ImageUploader @files-selected="handleFilesSelected" />

    <!-- Action Bar (Top summary when photos exist) -->
    <ActionBar
      :photos="photos"
      :settings="settings"
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      :export-status-text="exportStatusText"
      :error-message="errorMessage"
      :success-message="successMessage"
      @save-all="handleSaveAll"
      @clear-all="handleClearAll"
      @dismiss-alert="() => { errorMessage = ''; successMessage = '' }"
    />

    <!-- Thumbnail Gallery & Queue Progress -->
    <ThumbnailGallery
      :photos="photos"
      :is-processing="isBatchProcessing"
      :processing-progress="processingProgress"
      :processing-status-text="processingStatusText"
      @edit-photo="handleEditPhoto"
      @remove-photo="handleRemovePhoto"
    />

    <!-- Bottom Action Bar (when many photos exist) -->
    <ActionBar
      v-if="photos.length >= 4"
      :photos="photos"
      :settings="settings"
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      :export-status-text="exportStatusText"
      :error-message="errorMessage"
      :success-message="successMessage"
      @save-all="handleSaveAll"
      @clear-all="handleClearAll"
      @dismiss-alert="() => { errorMessage = ''; successMessage = '' }"
    />

    <!-- Fine-tune Modal Editor -->
    <PhotoEditorModal
      v-model:open="isEditorOpen"
      :photo="editingPhoto"
      @apply="handleApplyEditorChanges"
    />
  </div>
</template>
