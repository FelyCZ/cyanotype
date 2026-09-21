<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const headerItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Negative Creator',
    icon: 'i-lucide-image',
    to: '/',
    active: route.path === '/'
  },
  {
    label: 'Guide',
    icon: 'i-lucide-book-open',
    to: '/guide',
    active: route.path.startsWith('/guide')
  }
])

useHead({
  title: 'Cyanotype | Negatives Creator',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    {
      name: 'description',
      content: 'Client-side digital negative generator and guide for cyanotype alternative photography process. Transform photos to grayscale negatives at 300 DPI.'
    }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2"
        >
          <div class="rounded-lg bg-blue-500/15 p-1.5 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <UIcon
              name="i-lucide-contrast"
              class="w-5 h-5"
            />
          </div>
          <span class="font-bold text-lg tracking-tight">Cyanotype</span>
        </NuxtLink>
      </template>

      <UNavigationMenu :items="headerItems" />

      <template #right>
        <UColorModeButton />
      </template>

      <template #body>
        <UNavigationMenu
          :items="headerItems"
          orientation="vertical"
          class="-mx-2.5"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-xs text-neutral-500">
          Cyanotype • Open-source project created by <a
            href="https://github.com/FelyCZ"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline text-neutral-700 dark:text-neutral-300"
          >Jakub Ferencik</a>
        </p>
      </template>

      <template #right>
        <UButton
          to="https://github.com/FelyCZ/cyanotype"
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
