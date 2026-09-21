<script setup lang="ts">
import type { PhotoItem } from '~/types'

const props = withDefaults(
  defineProps<{
    photos: PhotoItem[]
    isProcessing: boolean
    processingProgress: number
    processingStatusText: string
    previewMode?: 'negative' | 'cyanotype'
  }>(),
  {
    previewMode: 'negative'
  }
)

const emit = defineEmits<{
  editPhoto: [photo: PhotoItem]
  removePhoto: [photoId: string]
}>()

const { t } = useI18n()

function getDisplayThumbnail(photo: PhotoItem): string {
  if (props.previewMode === 'cyanotype' && photo.cyanotypeUrl) {
    return photo.cyanotypeUrl
  }
  return photo.previewUrl
}

function isAdjusted(photo: PhotoItem): boolean {
  return (
    photo.adjustments.brightness !== 0
    || photo.adjustments.contrast !== 0
    || photo.adjustments.highlights !== 0
    || photo.adjustments.shadows !== 0
    || photo.crop.aspectRatio !== 'original'
  )
}
</script>

<template>
  <div class="space-y-4">
    <!-- Batch Processing Progress Bar -->
    <UCard v-if="isProcessing">
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium flex items-center gap-2">
            <UIcon
              name="i-lucide-loader"
              class="w-4 h-4 animate-spin text-primary"
            />
            {{ processingStatusText || t('gallery.processing') }}
          </span>
          <span class="text-neutral-500">{{ Math.round(processingProgress) }}%</span>
        </div>
        <UProgress
          :model-value="processingProgress"
          :max="100"
        />
      </div>
    </UCard>

    <!-- Gallery Grid -->
    <div
      v-if="photos.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <UCard
        v-for="photo in photos"
        :key="photo.id"
        :ui="{ body: 'p-3' }"
        class="group relative overflow-hidden transition-shadow hover:shadow-md"
      >
        <!-- Thumbnail Clickable Image -->
        <div
          class="aspect-square bg-neutral-900 rounded cursor-pointer overflow-hidden flex items-center justify-center relative"
          @click="emit('editPhoto', photo)"
        >
          <img
            v-if="getDisplayThumbnail(photo)"
            :src="getDisplayThumbnail(photo)"
            :alt="photo.name"
            class="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
          >
          <div
            v-else
            class="flex flex-col items-center justify-center text-neutral-400 gap-2 p-2"
          >
            <UIcon
              name="i-lucide-loader"
              class="w-6 h-6 animate-spin text-primary"
            />
            <span class="text-xs">{{ t('gallery.converting') }}</span>
          </div>

          <!-- Hover Overlay Icon -->
          <div
            class="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
          >
            <div class="flex items-center gap-1 bg-neutral-900/80 px-3 py-1.5 rounded-full text-xs font-medium">
              <UIcon
                name="i-lucide-sliders-horizontal"
                class="w-3.5 h-3.5"
              />
              <span>{{ t('gallery.edit') }}</span>
            </div>
          </div>
        </div>

        <!-- Metadata & Actions -->
        <div class="mt-3 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p
                class="text-xs font-medium truncate"
                :title="photo.name"
              >
                {{ photo.name }}
              </p>
              <p class="text-[11px] text-neutral-500">
                {{ photo.originalWidth }} × {{ photo.originalHeight }} px
              </p>
            </div>

            <UBadge
              v-if="isAdjusted(photo)"
              :label="t('gallery.edited')"
              color="primary"
              variant="subtle"
              size="xs"
            />
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800">
            <UButton
              :label="t('gallery.adjust')"
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-sliders-horizontal"
              @click="emit('editPhoto', photo)"
            />

            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              :aria-label="t('gallery.remove')"
              @click="emit('removePhoto', photo.id)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
