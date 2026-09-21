<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const { data: articles } = await useAsyncData('guide-navigation', () => {
  return queryCollection('guide').order('order', 'ASC').all()
})

const sidebarItems = computed<NavigationMenuItem[]>(() => {
  return (articles.value || []).map(article => ({
    label: article.title,
    icon: article.icon || 'i-lucide-file-text',
    to: article.path,
    active: route.path === article.path
  }))
})
</script>

<template>
  <UContainer class="py-6 sm:py-10">
    <!-- Mobile Navigation Selector (visible on small/medium screens) -->
    <div class="mb-6 block lg:hidden">
      <div class="rounded-xl border border-default bg-elevated/40 p-2">
        <p class="px-2.5 pt-1 pb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Guide Navigation
        </p>
        <UNavigationMenu
          :items="sidebarItems"
          orientation="horizontal"
          variant="pill"
          class="w-full overflow-x-auto"
        />
      </div>
    </div>

    <UPage>
      <template #left>
        <UPageAside>
          <div class="space-y-3">
            <div class="px-2.5">
              <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Cyanotype Guide
              </span>
            </div>
            <UNavigationMenu
              :items="sidebarItems"
              orientation="vertical"
              variant="pill"
              highlight
            />
          </div>
        </UPageAside>
      </template>

      <NuxtPage />
    </UPage>
  </UContainer>
</template>
