<script setup lang="ts">
import type { PageSettings } from '~/types'

const props = defineProps<{
  modelValue: PageSettings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PageSettings]
}>()

const settings = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const pageSizeOptions = [
  { label: 'A3', value: 'A3' },
  { label: 'A4', value: 'A4' },
  { label: 'A5', value: 'A5' },
  { label: 'A6', value: 'A6' }
]

const perPageOptions = [
  { label: '1 per page', value: 1 },
  { label: '2 per page', value: 2 },
  { label: '3 per page', value: 3 },
  { label: '4 per page', value: 4 }
]

const orientationOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'Portrait', value: 'portrait' },
  { label: 'Landscape', value: 'landscape' }
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-sliders" class="w-5 h-5 text-primary" />
        <h2 class="text-base font-semibold">Page & Print Settings</h2>
      </div>
    </template>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <UFormField label="Page Size">
        <USelect
          v-model="settings.pageSize"
          :items="pageSizeOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Photos Per Page">
        <USelect
          v-model="settings.photosPerPage"
          :items="perPageOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Orientation">
        <USelect
          v-model="settings.orientation"
          :items="orientationOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Print DPI">
        <UInputNumber
          v-model="settings.dpi"
          :min="72"
          :max="1200"
          :step="50"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Page Margin mm">
        <UInputNumber
          v-model="settings.marginMm"
          :min="0"
          :max="50"
          :step="1"
          class="w-full"
        />
      </UFormField>
    </div>
  </UCard>
</template>
