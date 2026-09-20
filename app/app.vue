<script setup lang="ts">
useHead({
  title: 'Cyanotype | Negatives Creator',
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
          <span class="font-bold text-lg tracking-tight">Cyanotype</span>
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
          Cyanotype • Open-source project created by <a href="https://github.com/FelyCZ" target="_blank" rel="noopener noreferrer" class="hover:underline text-neutral-700 dark:text-neutral-300">Jakub Ferencik</a>
        </p>
      </template>

      <template #right>
        <UButton
          to="https://github.com/FelyCZ/cyanotyper"
          target="_blank"
          icon="i-simple-icons-github"
          label="GitHub"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="GitHub repository"
        />
      </template>
    </UFooter>
  </UApp>
</template>
