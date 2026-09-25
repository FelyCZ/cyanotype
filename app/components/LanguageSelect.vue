<script setup lang="ts">
import { cs, en } from '@nuxt/ui/locale'

const { locale, setLocale, t } = useI18n()

const current = computed({
  get: () => locale.value,
  set: (val: string) => {
    if (val && val !== locale.value) {
      setLocale(val as 'en' | 'cs')
    }
  }
})
</script>

<template>
  <div class="inline-flex items-center">
    <ULocaleSelect
      v-model="current"
      :locales="[en, cs]"
      size="sm"
      class="w-32 font-medium"
      :aria-label="t('nav.selectLanguage')"
    />
  </div>
</template>
