<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { locale, t } = useI18n()

const { data: articles } = await useAsyncData(
  () => `guide-navigation-${locale.value}`,
  () => queryCollection('guide').where('path', 'LIKE', `/guide/${locale.value}/%`).order('order', 'ASC').all(),
  { watch: [locale] }
)

const sidebarItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: t('guide.overview'),
      icon: 'i-lucide-compass',
      to: '/guide',
      active: route.path === '/guide'
    }
  ]

  if (articles.value) {
    items.push(
      ...articles.value.map((article) => {
        const url = '/guide/' + article.path.split('/').pop()
        return {
          label: article.title,
          icon: article.icon || 'i-lucide-file-text',
          to: url,
          active: route.path === url
        }
      })
    )
  }

  return items
})
</script>

<template>
  <UContainer class="py-6 sm:py-10">
    <!-- Mobile Navigation Selector (visible on small/medium screens) -->
    <div class="mb-6 block lg:hidden">
      <div class="rounded-xl border border-default bg-elevated/40 p-2">
        <p class="px-2.5 pt-1 pb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {{ t('guide.navigation') }}
        </p>
        <UNavigationMenu
          :items="sidebarItems"
          orientation="horizontal"
          variant="pill"
          class="w-full overflow-x-auto"
        />
      </div>
    </div>

    <UPage :ui="{ root: 'flex flex-col lg:grid lg:grid-cols-12 lg:gap-10', left: 'lg:col-span-3', center: 'lg:col-span-9' }">
      <template #left>
        <UPageAside class="w-full lg:w-64 xl:w-72">
          <div class="space-y-3">
            <div class="px-2.5">
              <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {{ t('guide.title') }}
              </span>
            </div>
            <UNavigationMenu
              :items="sidebarItems"
              orientation="vertical"
              variant="pill"
              highlight
              :ui="{
                linkLabel: 'whitespace-normal leading-snug text-sm',
                link: 'py-2 px-3'
              }"
            />
          </div>
        </UPageAside>
      </template>

      <NuxtPage />
    </UPage>
  </UContainer>
</template>
