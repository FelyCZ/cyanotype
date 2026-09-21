<script setup lang="ts">
const { locale, setLocale } = useI18n()

const languageOptions = [
  { label: '🇬🇧 English', value: 'en' },
  { label: '🇨🇿 Čeština', value: 'cs' }
]

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
    <USelect
      v-model="current"
      :items="languageOptions"
      size="sm"
      class="w-32 font-medium"
      aria-label="Select language"
    />
  </div>
</template>
