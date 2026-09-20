<script setup lang="ts">
useHead({
  title: 'Cyanotyper — Digital Negative Generator for Cyanotype',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    {
      name: 'description',
      content: 'Client-side digital negative generator for cyanotype alternative photography process. Transform photos to grayscale negatives at 300 DPI.'
    }
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en'
  }
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="rounded-lg bg-primary/15 p-1.5 text-primary flex items-center justify-center">
            <UIcon name="i-lucide-contrast" class="w-5 h-5" />
          </div>
          <span class="font-bold text-lg tracking-tight">Cyanotyper</span>
          <UBadge
            label="Digital Negatives"
            color="primary"
            variant="subtle"
            size="xs"
            class="hidden sm:inline-flex"
          />
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-xs text-neutral-500">
          Cyanotyper • Client-side Cyanotype Negative Generator
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
