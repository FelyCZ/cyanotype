<script setup lang="ts">
import type { PhotoItem, PageSettings, ImageAdjustments, CropSettings } from '~/types'
import {
  createDefaultAdjustments,
  createDefaultCrop,
  loadImageElement,
  createThumbnailFromImage
} from '~/utils/image-processing'
import {
  exportSheetsToPdfBlob,
  exportIndividualNegatives,
  saveFilesToUserSelection
} from '~/utils/export-service'

const { t } = useI18n()

const settings = ref<PageSettings>({
  pageSize: 'A4',
  dpi: 300,
  photosPerPage: 1,
  orientation: 'auto',
  marginMm: 10,
  imageFormat: 'jpeg',
  jpegQuality: 80
})

const photos = ref<PhotoItem[]>([])
const isBatchProcessing = ref(false)
const processingProgress = ref(0)
const processingStatusText = ref('')

const isExporting = ref(false)
const isPreviewing = ref(false)
const exportProgress = ref(0)
const exportStatusText = ref('')

const editingPhoto = ref<PhotoItem | null>(null)
const isEditorOpen = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const previewMode = ref<'negative' | 'cyanotype'>('negative')

watch(previewMode, async (newMode) => {
  if (newMode === 'cyanotype') {
    const missing = photos.value.filter(p => p.status === 'done' && !p.cyanotypeUrl)
    for (const photo of missing) {
      try {
        const img = await loadImageElement(photo.originalUrl)
        const { previewUrl: cyanUrl } = await createThumbnailFromImage(
          img,
          photo.rotation,
          photo.adjustments,
          photo.crop,
          640,
          'cyanotype'
        )
        photo.cyanotypeUrl = cyanUrl
      } catch (err) {
        console.error('Failed to generate cyanotype thumbnail:', err)
      }
    }
  }
})

async function handleFilesSelected(files: File[]) {
  errorMessage.value = ''
  successMessage.value = ''

  const newItems: PhotoItem[] = files.map(file => ({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: file.name,
    file,
    originalUrl: URL.createObjectURL(file),
    previewUrl: '',
    originalWidth: 0,
    originalHeight: 0,
    rotation: 0,
    adjustments: createDefaultAdjustments(),
    crop: createDefaultCrop(),
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
    processingStatusText.value = t('gallery.convertingProgress', { name: photo.name, current: i + 1, total })
    processingProgress.value = Math.round(((i) / total) * 100)

    try {
      const img = await loadImageElement(photo.originalUrl)
      const [{ previewUrl, width, height }, { previewUrl: cyanotypeUrl }] = await Promise.all([
        createThumbnailFromImage(
          img,
          photo.rotation,
          photo.adjustments,
          photo.crop,
          640,
          'negative'
        ),
        createThumbnailFromImage(
          img,
          photo.rotation,
          photo.adjustments,
          photo.crop,
          640,
          'cyanotype'
        )
      ])
      photo.originalWidth = width
      photo.originalHeight = height
      photo.previewUrl = previewUrl
      photo.cyanotypeUrl = cyanotypeUrl
      photo.status = 'done'
    } catch (err: unknown) {
      console.error('Error converting photo:', err)
      photo.status = 'error'
      photo.errorMessage = t('gallery.failedToProcess')
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

function handleApplyEditorChanges(
  photoId: string,
  rotation: number,
  adjustments: ImageAdjustments,
  crop: CropSettings,
  newPreviewUrl: string,
  newCyanotypeUrl: string
) {
  const photo = photos.value.find(p => p.id === photoId)
  if (photo) {
    photo.rotation = rotation
    photo.adjustments = adjustments
    photo.crop = crop
    photo.previewUrl = newPreviewUrl
    photo.cyanotypeUrl = newCyanotypeUrl
  }
}

async function handleApplyAdjustmentsToAll(
  photoId: string,
  rotation: number,
  adjustments: ImageAdjustments,
  crop: CropSettings,
  newPreviewUrl: string,
  newCyanotypeUrl: string
) {
  const current = photos.value.find(p => p.id === photoId)
  if (current) {
    current.rotation = rotation
    current.adjustments = { ...adjustments }
    current.crop = { ...crop }
    current.previewUrl = newPreviewUrl
    current.cyanotypeUrl = newCyanotypeUrl
  }

  const otherPhotos = photos.value.filter(p => p.id !== photoId && p.status === 'done')
  if (otherPhotos.length === 0) {
    successMessage.value = t('editor.appliedToAll')
    return
  }

  isBatchProcessing.value = true
  processingStatusText.value = t('editor.applyingToAll')
  processingProgress.value = 0

  let completed = 0
  const total = otherPhotos.length

  await Promise.all(
    otherPhotos.map(async (photo) => {
      photo.adjustments = { ...adjustments }
      try {
        const img = await loadImageElement(photo.originalUrl)
        const [{ previewUrl }, { previewUrl: cyanotypeUrl }] = await Promise.all([
          createThumbnailFromImage(
            img,
            photo.rotation,
            photo.adjustments,
            photo.crop,
            640,
            'negative'
          ),
          createThumbnailFromImage(
            img,
            photo.rotation,
            photo.adjustments,
            photo.crop,
            640,
            'cyanotype'
          )
        ])
        photo.previewUrl = previewUrl
        photo.cyanotypeUrl = cyanotypeUrl
      } catch (err) {
        console.error('Failed to update thumbnail for photo', photo.id, err)
      } finally {
        completed++
        processingProgress.value = Math.round((completed / total) * 100)
      }
    })
  )

  isBatchProcessing.value = false
  processingStatusText.value = ''
  successMessage.value = t('editor.appliedToAllCount', { count: photos.value.length })
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
  photos.value.forEach((p) => {
    if (p.originalUrl) URL.revokeObjectURL(p.originalUrl)
  })
  photos.value = []
  errorMessage.value = ''
  successMessage.value = ''
}

async function handlePreviewPages() {
  if (photos.value.length === 0) return

  errorMessage.value = ''
  successMessage.value = ''
  isPreviewing.value = true
  exportProgress.value = 0
  exportStatusText.value = t('actions.renderingPreview')

  try {
    const pdfBlob = await exportSheetsToPdfBlob(photos.value, settings.value, (progress) => {
      exportProgress.value = Math.round((progress.current / progress.total) * 100)
      exportStatusText.value = progress.step
    })

    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  } catch (err) {
    console.error('Failed to generate PDF preview:', err)
    errorMessage.value = t('actions.errorPreview')
  } finally {
    isPreviewing.value = false
    exportProgress.value = 0
    exportStatusText.value = ''
  }
}

async function handleSaveAll() {
  if (photos.value.length === 0) return

  const formatUpper = settings.value.imageFormat.toUpperCase()
  errorMessage.value = ''
  successMessage.value = ''
  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = t('actions.preparing', { format: formatUpper })

  try {
    const files = await exportIndividualNegatives(
      photos.value,
      settings.value.imageFormat,
      settings.value.jpegQuality,
      (progress) => {
        exportProgress.value = Math.round((progress.current / progress.total) * 100)
        exportStatusText.value = progress.step
      }
    )

    exportStatusText.value = t('actions.saving')
    const result = await saveFilesToUserSelection(files, (status) => {
      exportStatusText.value = status
    })

    const successMessages: Record<'directory' | 'zip' | 'single', string> = {
      directory: t('actions.successDirectory', { format: formatUpper }),
      zip: t('actions.successZip', { format: formatUpper }),
      single: t('actions.successSingle', { format: formatUpper })
    }
    successMessage.value = successMessages[result.method]
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      // User cancelled directory picker
    } else {
      console.error('Export failed:', err)
      errorMessage.value = t('actions.errorExport')
    }
  } finally {
    isExporting.value = false
    exportProgress.value = 0
    exportStatusText.value = ''
  }
}

onUnmounted(() => {
  photos.value.forEach((p) => {
    if (p.originalUrl) URL.revokeObjectURL(p.originalUrl)
  })
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl space-y-8">
    <!-- Intro Banner -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">
        {{ t('hero.title') }}
      </h1>
      <p class="text-neutral-500 max-w-2xl text-sm sm:text-base">
        {{ t('hero.description') }} <strong class="font-semibold text-neutral-700 dark:text-neutral-200">{{ t('hero.localProcessing') }}</strong>
      </p>
    </div>

    <!-- Page & Print Settings -->
    <SettingsBar v-model="settings" />

    <!-- Upload Dropzone -->
    <ImageUploader @files-selected="handleFilesSelected" />

    <!-- Action Bar (Only shown once above gallery) -->
    <ActionBar
      v-model:preview-mode="previewMode"
      :photos="photos"
      :settings="settings"
      :is-exporting="isExporting"
      :is-previewing="isPreviewing"
      :export-progress="exportProgress"
      :export-status-text="exportStatusText"
      :error-message="errorMessage"
      :success-message="successMessage"
      @save-all="handleSaveAll"
      @preview-pages="handlePreviewPages"
      @clear-all="handleClearAll"
      @dismiss-alert="() => { errorMessage = ''; successMessage = '' }"
    />

    <!-- Thumbnail Gallery & Queue Progress -->
    <ThumbnailGallery
      :photos="photos"
      :preview-mode="previewMode"
      :is-processing="isBatchProcessing"
      :processing-progress="processingProgress"
      :processing-status-text="processingStatusText"
      @edit-photo="handleEditPhoto"
      @remove-photo="handleRemovePhoto"
    />

    <!-- Fine-tune Modal Editor with Interactive Crop & Rotation -->
    <PhotoEditorModal
      v-model:open="isEditorOpen"
      v-model:preview-mode="previewMode"
      :photo="editingPhoto"
      :photos-count="photos.length"
      @apply="handleApplyEditorChanges"
      @apply-to-all="handleApplyAdjustmentsToAll"
    />
  </div>
</template>
