<script setup lang="ts">
import type { PageSettings } from '~/types'

const props = defineProps<{
  modelValue: PageSettings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PageSettings]
}>()

const { t } = useI18n()

const settings = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const pageSizeOptions = [
  { label: 'A3', value: 'A3' },
  { label: 'A4', value: 'A4' },
  { label: 'A5', value: 'A5' },
  { label: 'A6', value: 'A6' }
]

const perPageOptions = computed(() => [
  { label: t('settings.perPage', { n: 1 }), value: 1 },
  { label: t('settings.perPage', { n: 2 }), value: 2 },
  { label: t('settings.perPage', { n: 3 }), value: 3 },
  { label: t('settings.perPage', { n: 4 }), value: 4 }
])

const orientationOptions = computed(() => [
  { label: t('settings.auto'), value: 'auto' },
  { label: t('settings.portrait'), value: 'portrait' },
  { label: t('settings.landscape'), value: 'landscape' }
])

const imageFormatOptions = [
  { label: 'JPEG', value: 'jpeg' },
  { label: 'PNG', value: 'png' }
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-sliders"
          class="w-5 h-5 text-primary"
        />
        <h2 class="text-base font-semibold">
          {{ t('settings.title') }}
        </h2>
      </div>
    </template>

    <div class="space-y-5">
      <!-- Row 1: Page Layout -->
      <div>
        <h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          {{ t('settings.pageLayout') }}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UFormField :label="t('settings.pageSize')">
            <USelect
              v-model="settings.pageSize"
              :items="pageSizeOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('settings.photosPerPage')">
            <USelect
              v-model="settings.photosPerPage"
              :items="perPageOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('settings.orientation')">
            <USelect
              v-model="settings.orientation"
              :items="orientationOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('settings.margin')">
            <UInputNumber
              v-model="settings.marginMm"
              :min="0"
              :max="50"
              :step="1"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <USeparator />

      <!-- Row 2: Resolution & Export Settings -->
      <div>
        <h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          {{ t('settings.exportQuality') }}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <UFormField :label="t('settings.printDpi')">
            <UInputNumber
              v-model="settings.dpi"
              :min="300"
              :max="2400"
              :step="300"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('settings.format')">
            <USelect
              v-model="settings.imageFormat"
              :items="imageFormatOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField
            v-if="settings.imageFormat === 'jpeg'"
            :label="t('settings.quality')"
            :hint="`${settings.jpegQuality}%`"
          >
            <div class="flex items-center gap-3">
              <USlider
                v-model="settings.jpegQuality"
                :min="10"
                :max="100"
                :step="5"
                class="flex-1"
              />
              <UInputNumber
                v-model="settings.jpegQuality"
                :min="10"
                :max="100"
                :step="1"
                class="w-28 shrink-0"
              />
            </div>
          </UFormField>
        </div>
      </div>
    </div>
  </UCard>
</template>
