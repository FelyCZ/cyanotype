<script setup lang="ts">
import GuideCard from '~/components/content/GuideCard.vue'
import GuideGrid from '~/components/content/GuideGrid.vue'
import GuideNote from '~/components/content/GuideNote.vue'
import GuideReactionScheme from '~/components/content/GuideReactionScheme.vue'

const guideComponents = {
  GuideCard,
  GuideGrid,
  GuideNote,
  GuideReactionScheme,
  'guide-card': GuideCard,
  'guide-grid': GuideGrid,
  'guide-note': GuideNote,
  'guide-reaction-scheme': GuideReactionScheme
}

const route = useRoute()
const { locale, t } = useI18n()

const slugName = computed(() => {
  const s = route.params.slug
  if (Array.isArray(s)) return s[s.length - 1]
  return s || 'solutions'
})

const { data: page } = await useAsyncData(
  () => `guide-page-${locale.value}-${slugName.value}`,
  () => queryCollection('guide').path(`/guide/${locale.value}/${slugName.value}`).first(),
  { watch: [locale] }
)

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Guide article not found',
    fatal: true
  })
}

useSeoMeta({
  title: () => `${page.value?.title || 'Guide'} | ${locale.value === 'cs' ? 'Kyanotypie' : 'Cyanotype'}`,
  description: () => page.value?.description || '',
  ogTitle: () => `${page.value?.title || 'Guide'} | ${locale.value === 'cs' ? 'Kyanotypie' : 'Cyanotype'}`,
  ogDescription: () => page.value?.description || ''
})

const { data: allArticles } = await useAsyncData(
  () => `all-guide-articles-${locale.value}`,
  () => queryCollection('guide').where('path', 'LIKE', `/guide/${locale.value}/%`).order('order', 'ASC').all(),
  { watch: [locale] }
)

const prevArticle = computed(() => {
  if (!allArticles.value || !page.value) return null
  const currentIndex = allArticles.value.findIndex(a => a.path === page.value?.path)
  if (currentIndex <= 0) return null
  const prev = allArticles.value[currentIndex - 1]
  if (!prev) return null
  return {
    ...prev,
    url: '/guide/' + prev.path.split('/').pop()
  }
})

const nextArticle = computed(() => {
  if (!allArticles.value || !page.value) return null
  const currentIndex = allArticles.value.findIndex(a => a.path === page.value?.path)
  if (currentIndex < 0 || currentIndex >= allArticles.value.length - 1) return null
  const next = allArticles.value[currentIndex + 1]
  if (!next) return null
  return {
    ...next,
    url: '/guide/' + next.path.split('/').pop()
  }
})
</script>

<template>
  <div
    v-if="page"
    class="w-full max-w-4xl pb-16"
  >
    <UPageHeader
      :title="page.title"
      :description="page.description"
      class="mb-6"
    />

    <UPageBody>
      <div data-guide-content>
        <ContentRenderer
          :value="page"
          :components="guideComponents"
        />
      </div>

      <USeparator class="my-10" />

      <!-- Previous / Next Navigation Buttons -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          v-if="prevArticle"
          :class="{ 'sm:col-span-2': !nextArticle && prevArticle }"
        >
          <UButton
            :to="prevArticle.url"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
            size="lg"
            block
            class="justify-start text-left"
          >
            <div>
              <div class="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {{ t('guide.prevSection') }}
              </div>
              <div class="font-medium text-highlighted">
                {{ prevArticle.title }}
              </div>
            </div>
          </UButton>
        </div>

        <div
          v-if="nextArticle"
          :class="{ 'sm:col-span-2': !prevArticle && nextArticle }"
        >
          <UButton
            :to="nextArticle.url"
            trailing-icon="i-lucide-arrow-right"
            color="neutral"
            variant="outline"
            size="lg"
            block
            class="justify-end text-right"
          >
            <div>
              <div class="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {{ t('guide.nextSection') }}
              </div>
              <div class="font-medium text-highlighted">
                {{ nextArticle.title }}
              </div>
            </div>
          </UButton>
        </div>
      </div>
    </UPageBody>
  </div>
</template>

<style scoped>
[data-guide-content] :deep(h1) {
  display: none; /* Already rendered in UPageHeader */
}

[data-guide-content] :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: 2.25rem;
  margin-bottom: 0.85rem;
  color: var(--ui-text-highlighted);
}

[data-guide-content] :deep(h3) {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-top: 1.75rem;
  margin-bottom: 0.65rem;
  color: var(--ui-text-highlighted);
}

[data-guide-content] :deep(p) {
  line-height: 1.75;
  margin-bottom: 1.25rem;
  color: var(--ui-text);
}

[data-guide-content] :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1.25rem;
  line-height: 1.7;
}

[data-guide-content] :deep(ol) {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 1.25rem;
  line-height: 1.7;
}

[data-guide-content] :deep(li) {
  margin-bottom: 0.4rem;
}

[data-guide-content] :deep(strong) {
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

/* Clean table styling without awkward outer outlines */
[data-guide-content] :deep(table) {
  width: 100%;
  margin: 1.75rem 0;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
  border: 1px solid var(--ui-color-neutral-300);
  border-radius: 0.75rem;
  overflow: hidden;
}

:global(.dark) [data-guide-content] :deep(table) {
  border-color: var(--ui-color-neutral-800);
}

[data-guide-content] :deep(th) {
  background-color: var(--ui-bg-elevated);
  border-bottom: 1px solid var(--ui-color-neutral-300);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

:global(.dark) [data-guide-content] :deep(th) {
  border-bottom-color: var(--ui-color-neutral-800);
}

[data-guide-content] :deep(td) {
  border-bottom: 1px solid var(--ui-color-neutral-200);
  padding: 0.75rem 1rem;
  color: var(--ui-text);
}

:global(.dark) [data-guide-content] :deep(td) {
  border-bottom-color: var(--ui-color-neutral-800);
}

[data-guide-content] :deep(tr:last-child td) {
  border-bottom: none;
}

[data-guide-content] :deep(hr) {
  border: 0;
  border-top: 1px solid var(--ui-color-neutral-200);
  margin: 2rem 0;
}

:global(.dark) [data-guide-content] :deep(hr) {
  border-top-color: var(--ui-color-neutral-800);
}

/* Soft callout boxes with thin dotted outline and transparent background */
[data-guide-content] :deep(.guide-caution),
[data-guide-content] :deep(.guide-note),
[data-guide-content] :deep(blockquote) {
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  background-color: transparent;
  border: 1px dotted var(--ui-color-neutral-300);
  border-radius: var(--ui-radius, 0.375rem);
}

:global(.dark) [data-guide-content] :deep(.guide-caution),
:global(.dark) [data-guide-content] :deep(.guide-note),
:global(.dark) [data-guide-content] :deep(blockquote) {
  border-color: var(--ui-color-neutral-700);
}

[data-guide-content] :deep(.guide-grid) {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
}

@media (min-width: 768px) {
  [data-guide-content] :deep(.guide-grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Outline-only card variant for guides - clean, lightweight, not bright */
[data-guide-content] :deep(.guide-card) {
  padding: 1.25rem;
  background-color: transparent;
  border: 1px solid var(--ui-color-neutral-300);
  border-radius: var(--ui-radius, 0.375rem);
}

:global(.dark) [data-guide-content] :deep(.guide-card) {
  background-color: transparent;
  border-color: var(--ui-color-neutral-800);
}

[data-guide-content] :deep(.guide-caution p),
[data-guide-content] :deep(.guide-note p),
[data-guide-content] :deep(blockquote p) {
  margin-bottom: 0;
  font-size: 0.875rem;
  line-height: 1.6;
}

[data-guide-content] :deep(.guide-caution ul) {
  margin-top: 0.5rem;
  margin-bottom: 0;
  font-size: 0.875rem;
}

[data-guide-content] :deep(code:not(pre code)) {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background-color: var(--ui-bg-accented);
  padding: 0.15em 0.35em;
  border-radius: 0.35rem;
}
</style>
