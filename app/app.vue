<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { t, locale } = useI18n()

const headerItems = computed<NavigationMenuItem[]>(() => [
  {
    label: t('nav.creator'),
    icon: 'i-lucide-image',
    to: '/',
    active: route.path === '/'
  },
  {
    label: t('nav.guide'),
    icon: 'i-lucide-book-open',
    to: '/guide',
    active: route.path.startsWith('/guide')
  }
])

useHead({
  title: computed(() => locale.value === 'cs' ? 'Kyanotypie' : 'Cyanotype'),
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    {
      name: 'description',
      content: computed(() => locale.value === 'cs'
        ? 'Klientský generátor digitálních negativů a průvodce procesem kyanotypie.'
        : 'Client-side digital negative generator and guide for cyanotype alternative photography process.'
      )
    }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: computed(() => locale.value)
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
          <div class="rounded-lg bg-primary/15 p-1.5 text-primary flex items-center justify-center">
            <UIcon
              name="i-lucide-contrast"
              class="w-5 h-5"
            />
          </div>
          <span class="font-bold text-lg tracking-tight">{{ locale === 'cs' ? 'Kyanotypie' : 'Cyanotype' }}</span>
        </NuxtLink>
      </template>

      <UNavigationMenu :items="headerItems" />

      <template #right>
        <div class="flex items-center gap-2">
          <LanguageSelect />
          <UColorModeButton />
        </div>
      </template>

      <template #body>
        <div class="space-y-4">
          <UNavigationMenu
            :items="headerItems"
            orientation="vertical"
            class="-mx-2.5"
          />
          <div class="flex items-center justify-between pt-2 border-t border-default">
            <span class="text-xs text-neutral-500">Language / Jazyk</span>
            <LanguageSelect />
          </div>
        </div>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-xs text-neutral-500">
          {{ t('footer.text') }} <a
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
          :label="t('footer.github')"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="GitHub repository"
        />
      </template>
    </UFooter>
  </UApp>
</template>
