<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(`guide-page-${route.path}`, () => {
  return queryCollection('guide').path(route.path).first()
})

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Guide article not found',
    fatal: true
  })
}

useSeoMeta({
  title: `${page.value.title} | Cyanotype Guide`,
  description: page.value.description,
  ogTitle: `${page.value.title} | Cyanotype Guide`,
  ogDescription: page.value.description
})

const { data: allArticles } = await useAsyncData('all-guide-articles-surround', () => {
  return queryCollection('guide').order('order', 'ASC').all()
})

const prevArticle = computed(() => {
  if (!allArticles.value || !page.value) return null
  const currentIndex = allArticles.value.findIndex(a => a.path === page.value?.path)
  return currentIndex > 0 ? allArticles.value[currentIndex - 1] : null
})

const nextArticle = computed(() => {
  if (!allArticles.value || !page.value) return null
  const currentIndex = allArticles.value.findIndex(a => a.path === page.value?.path)
  return currentIndex >= 0 && currentIndex < allArticles.value.length - 1
    ? allArticles.value[currentIndex + 1]
    : null
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
        <ContentRenderer :value="page" />
      </div>

      <USeparator class="my-10" />

      <!-- Previous / Next Navigation Buttons -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <UButton
            v-if="prevArticle"
            :to="prevArticle.path"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
            size="lg"
            block
            class="justify-start text-left"
          >
            <div>
              <div class="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Previous Section
              </div>
              <div class="font-medium text-highlighted">
                {{ prevArticle.title }}
              </div>
            </div>
          </UButton>
        </div>

        <div>
          <UButton
            v-if="nextArticle"
            :to="nextArticle.path"
            trailing-icon="i-lucide-arrow-right"
            color="neutral"
            variant="outline"
            size="lg"
            block
            class="justify-end text-right"
          >
            <div>
              <div class="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Next Section
              </div>
              <div class="font-medium text-highlighted">
                {{ nextArticle.title }}
              </div>
            </div>
          </UButton>
        </div>
      </div>

      <!-- Call To Action Card to Creator -->
      <div class="mt-12 rounded-2xl border border-default bg-elevated/50 p-6 sm:p-8">
        <div class="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-sparkles"
                class="size-5 text-primary"
              />
              <h3 class="text-base font-semibold text-highlighted sm:text-lg">
                Ready to create digital negatives?
              </h3>
            </div>
            <p class="text-sm text-neutral-500">
              Transform your photos into calibrated 300 DPI inverted negatives ready for contact printing onto transparency film.
            </p>
          </div>
          <UButton
            to="/"
            icon="i-lucide-image"
            label="Open Negative Creator"
            color="primary"
            size="md"
            class="shrink-0"
          />
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

[data-guide-content] :deep(table) {
  width: 100%;
  margin: 1.5rem 0;
  border-collapse: collapse;
  font-size: 0.9rem;
  overflow-x: auto;
  display: block;
}

[data-guide-content] :deep(th) {
  border-bottom: 2px solid var(--ui-color-neutral-300);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

:global(.dark) [data-guide-content] :deep(th) {
  border-bottom-color: var(--ui-color-neutral-700);
}

[data-guide-content] :deep(td) {
  border-bottom: 1px solid var(--ui-color-neutral-200);
  padding: 0.75rem 1rem;
}

:global(.dark) [data-guide-content] :deep(td) {
  border-bottom-color: var(--ui-color-neutral-800);
}

[data-guide-content] :deep(hr) {
  border: 0;
  border-top: 1px solid var(--ui-color-neutral-200);
  margin: 2rem 0;
}

:global(.dark) [data-guide-content] :deep(hr) {
  border-top-color: var(--ui-color-neutral-800);
}

[data-guide-content] :deep(blockquote) {
  border-left: 3px solid var(--ui-color-primary-500);
  padding: 0.75rem 1rem;
  margin: 1.5rem 0;
  background-color: var(--ui-bg-elevated);
  border-radius: 0 0.5rem 0.5rem 0;
}

[data-guide-content] :deep(code:not(pre code)) {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background-color: var(--ui-bg-accented);
  padding: 0.15em 0.35em;
  border-radius: 0.35rem;
}
</style>
