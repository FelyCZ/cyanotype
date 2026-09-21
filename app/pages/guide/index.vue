<script setup lang="ts">
const { locale, t } = useI18n()

useSeoMeta({
  title: () => `${t('guide.title')} | ${locale.value === 'cs' ? 'Kyanotypie' : 'Cyanotype'}`,
  description: () => t('guide.description'),
  ogTitle: () => `${t('guide.title')} | ${locale.value === 'cs' ? 'Kyanotypie' : 'Cyanotype'}`,
  ogDescription: () => t('guide.description')
})

const { data: articles } = await useAsyncData(
  () => `guide-overview-chapters-${locale.value}`,
  () => queryCollection('guide').where('path', 'LIKE', `/guide/${locale.value}/%`).order('order', 'ASC').all(),
  { watch: [locale] }
)

const chapters = computed(() => {
  if (!articles.value) return []
  return articles.value.map(a => ({
    title: a.title,
    description: a.description,
    to: '/guide/' + a.path.split('/').pop(),
    icon: a.icon || 'i-lucide-file-text'
  }))
})
</script>

<template>
  <div class="w-full max-w-4xl pb-16">
    <UPageHeader
      :title="t('guide.title')"
      :description="t('guide.description')"
      class="mb-8"
    />

    <UPageBody>
      <div class="space-y-10">
        <!-- Introduction Section -->
        <div class="space-y-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p class="text-base sm:text-lg">
            {{ t('guide.introP1') }}
          </p>
          <p>
            {{ t('guide.introP2') }}
          </p>
        </div>

        <!-- Chapters Grid -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold tracking-tight text-highlighted">
            {{ t('guide.chaptersSection') }}
          </h2>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NuxtLink
              v-for="chapter in chapters"
              :key="chapter.to"
              :to="chapter.to"
              class="group relative flex flex-col justify-between rounded-xl border border-default bg-transparent p-5 transition-all hover:border-primary/50 hover:bg-elevated/30"
            >
              <div class="space-y-3">
                <div class="flex size-9 items-center justify-center rounded-lg border border-default bg-transparent text-primary">
                  <UIcon
                    :name="chapter.icon"
                    class="size-5"
                  />
                </div>

                <div class="space-y-1.5">
                  <h3 class="font-semibold text-highlighted group-hover:text-primary transition-colors">
                    {{ chapter.title }}
                  </h3>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                    {{ chapter.description }}
                  </p>
                </div>
              </div>

              <div class="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                <span>{{ t('guide.readChapter') }}</span>
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-3.5 transition-transform group-hover:translate-x-1"
                />
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Material Credits Section -->
        <div class="rounded-xl border border-default bg-transparent p-6 space-y-2">
          <div class="flex items-center gap-2 text-highlighted font-semibold text-sm">
            <UIcon
              name="i-lucide-graduation-cap"
              class="size-4 text-primary"
            />
            <span>{{ t('guide.creditsTitle') }}</span>
          </div>
          <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {{ t('guide.creditsText') }}
          </p>
        </div>

        <!-- Chemical Safety Disclaimer with soft background and thin dotted outline -->
        <div class="rounded-xl border border-dotted border-neutral-300 dark:border-neutral-700 bg-transparent p-6 space-y-2">
          <div class="flex items-center gap-2 font-semibold text-sm text-highlighted">
            <UIcon
              name="i-lucide-shield-alert"
              class="size-4 text-amber-500"
            />
            <span>{{ t('guide.disclaimerTitle') }}</span>
          </div>
          <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {{ t('guide.disclaimerText') }}
          </p>
        </div>
      </div>
    </UPageBody>
  </div>
</template>
