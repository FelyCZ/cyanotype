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
    statusMessage: t('guide.notFound'),
    fatal: true
  })
}

useSeoMeta({
  title: () => `${page.value?.title || t('nav.guide')} | ${t('app.title')}`,
  description: () => page.value?.description || '',
  ogTitle: () => `${page.value?.title || t('nav.guide')} | ${t('app.title')}`,
  ogDescription: () => page.value?.description || ''
})

const { data: allArticles } = await useAsyncData(
  () => `all-guide-articles-${locale.value}`,
  () => queryCollection('guide').where('path', 'LIKE', `/guide/${locale.value}/%`).order('order', 'ASC').all(),
  { watch: [locale] }
)

const surround = computed(() => {
  if (!allArticles.value || !page.value) return [null, null]
  const currentIndex = allArticles.value.findIndex(a => a.path === page.value?.path)
  if (currentIndex < 0) return [null, null]

  const prev = currentIndex > 0 ? allArticles.value[currentIndex - 1] : null
  const next = currentIndex < allArticles.value.length - 1 ? allArticles.value[currentIndex + 1] : null

  return [
    prev
      ? {
          title: prev.title,
          description: prev.description,
          path: '/guide/' + prev.path.split('/').pop()
        }
      : null,
    next
      ? {
          title: next.title,
          description: next.description,
          path: '/guide/' + next.path.split('/').pop()
        }
      : null
  ]
})

interface TocLink {
  id: string
  text: string
  depth: number
  children?: TocLink[]
}

const isMobileTocOpen = ref(false)

const filteredTocLinks = computed<TocLink[]>(() => {
  const links = (page.value?.body?.toc?.links || []) as TocLink[]
  return links
    .filter(l => l.depth === 2)
    .map(link => ({
      id: link.id,
      text: link.text,
      depth: link.depth,
      children: link.children
        ?.filter(child => child.depth === 3)
        .map(child => ({
          id: child.id,
          text: child.text,
          depth: child.depth
        }))
    }))
})

function onMobileTocLinkClick(id: string) {
  isMobileTocOpen.value = false
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const tocAsideRef = ref<HTMLElement | null>(null)

function updateTocIndicator() {
  const aside = tocAsideRef.value
  if (!aside) return

  const indicators = aside.querySelectorAll<HTMLElement>('[data-slot="indicator"]')
  for (const indicator of indicators) {
    const contentEl = indicator.closest<HTMLElement>('[data-slot="content"]')
    if (!contentEl || contentEl.offsetParent === null) continue

    const activeLinks = contentEl.querySelectorAll<HTMLElement>('a[data-slot="link"].text-primary')
    if (!activeLinks.length) continue

    const firstLink = activeLinks[0]
    const lastLink = activeLinks[activeLinks.length - 1]
    if (!firstLink || !lastLink) continue

    const contentRect = contentEl.getBoundingClientRect()
    const firstRect = firstLink.getBoundingClientRect()
    const lastRect = lastLink.getBoundingClientRect()

    const top = Math.round(firstRect.top - contentRect.top + contentEl.scrollTop)
    const height = Math.round(lastRect.bottom - firstRect.top)

    const posStr = `${top}px`
    const sizeStr = `${height}px`

    if (
      indicator.style.getPropertyValue('--indicator-position') === posStr
      && indicator.style.getPropertyPriority('--indicator-position') === 'important'
      && indicator.style.getPropertyValue('--indicator-size') === sizeStr
      && indicator.style.getPropertyPriority('--indicator-size') === 'important'
    ) {
      continue
    }

    indicator.style.setProperty('--indicator-position', posStr, 'important')
    indicator.style.setProperty('--indicator-size', sizeStr, 'important')
  }
}

let tocMutationObserver: MutationObserver | null = null
let tocResizeObserver: ResizeObserver | null = null

function setupTocObserver(el: HTMLElement | null) {
  tocMutationObserver?.disconnect()
  tocResizeObserver?.disconnect()
  tocMutationObserver = null
  tocResizeObserver = null

  if (!el) return

  tocMutationObserver = new MutationObserver(() => {
    updateTocIndicator()
  })
  tocMutationObserver.observe(el, {
    attributes: true,
    attributeFilter: ['class', 'style'],
    subtree: true
  })

  if (typeof ResizeObserver !== 'undefined') {
    tocResizeObserver = new ResizeObserver(() => {
      updateTocIndicator()
    })
    tocResizeObserver.observe(el)
  }

  nextTick(() => {
    updateTocIndicator()
    setTimeout(updateTocIndicator, 150)
  })
}

watch(tocAsideRef, (el) => {
  setupTocObserver(el)
})

onMounted(() => {
  setupTocObserver(tocAsideRef.value)
  window.addEventListener('resize', updateTocIndicator, { passive: true })
  window.addEventListener('scroll', updateTocIndicator, { passive: true })
})

onBeforeUnmount(() => {
  tocMutationObserver?.disconnect()
  tocResizeObserver?.disconnect()
  window.removeEventListener('resize', updateTocIndicator)
  window.removeEventListener('scroll', updateTocIndicator)
})
</script>

<template>
  <div
    v-if="page"
    class="w-full pb-16"
  >
    <div class="flex items-start gap-10">
      <!-- Main Content Column -->
      <div class="min-w-0 flex-1 max-w-4xl">
        <UPageHeader
          :title="page.title"
          :description="page.description"
          class="mb-6"
        />

        <!-- Mobile Table of Contents (collapsible banner above content on < xl screens) -->
        <div
          v-if="filteredTocLinks.length"
          class="mb-6 xl:hidden"
        >
          <div class="overflow-hidden rounded-xl border border-default bg-elevated/40">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-highlighted transition-colors hover:bg-elevated/50"
              @click="isMobileTocOpen = !isMobileTocOpen"
            >
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-list"
                  class="size-4 text-primary"
                />
                <span>{{ t('guide.toc') }}</span>
              </div>
              <UIcon
                name="i-lucide-chevron-down"
                class="size-4 text-neutral-400 transition-transform duration-200"
                :class="{ 'rotate-180': isMobileTocOpen }"
              />
            </button>

            <div
              v-show="isMobileTocOpen"
              class="border-t border-default px-4 py-3"
            >
              <ul class="space-y-1.5 text-sm">
                <li
                  v-for="link in filteredTocLinks"
                  :key="link.id"
                >
                  <a
                    :href="`#${link.id}`"
                    class="block py-1 text-neutral-600 transition-colors hover:text-primary dark:text-neutral-400"
                    @click.prevent="onMobileTocLinkClick(link.id)"
                  >
                    {{ link.text }}
                  </a>
                  <ul
                    v-if="link.children?.length"
                    class="mt-1 space-y-1 pl-4"
                  >
                    <li
                      v-for="child in link.children"
                      :key="child.id"
                    >
                      <a
                        :href="`#${child.id}`"
                        class="block py-0.5 text-xs text-neutral-500 transition-colors hover:text-primary dark:text-neutral-400"
                        @click.prevent="onMobileTocLinkClick(child.id)"
                      >
                        {{ child.text }}
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <UPageBody>
          <div data-guide-content>
            <ContentRenderer
              :value="page"
              :components="guideComponents"
            />
          </div>

          <USeparator class="my-10" />

          <!-- Previous / Next Navigation via UContentSurround -->
          <UContentSurround
            v-if="surround[0] || surround[1]"
            :surround="(surround as any)"
          />
        </UPageBody>
      </div>

      <!-- Desktop Right Sticky Sidebar: Table of Contents -->
      <aside
        v-if="filteredTocLinks.length"
        ref="tocAsideRef"
        data-toc-aside
        class="hidden xl:block w-64 2xl:w-72 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden"
      >
        <div class="pt-2">
          <UContentToc
            :links="filteredTocLinks"
            highlight
            color="primary"
            :ui="{
              container: 'py-0',
              list: 'min-w-0',
              item: 'min-w-0',
              link: 'items-start py-1 h-auto',
              linkText: 'whitespace-normal break-words leading-snug'
            }"
          />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* Minimal content styling */
[data-guide-content] :deep(h1) {
  display: none; /* Rendered in UPageHeader */
}

[data-guide-content] :deep(h2) {
  scroll-margin-top: 5rem;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: 2.25rem;
  margin-bottom: 0.75rem;
  color: var(--ui-text-highlighted);
}

[data-guide-content] :deep(h3) {
  scroll-margin-top: 5rem;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-top: 1.75rem;
  margin-bottom: 0.5rem;
  color: var(--ui-text-highlighted);
}

[data-guide-content] :deep(h4) {
  scroll-margin-top: 5rem;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
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
  margin-bottom: 0.35rem;
}

[data-guide-content] :deep(strong) {
  font-weight: 700;
  color: var(--ui-text-highlighted);
}

:global(.dark) [data-guide-content] :deep(strong) {
  color: #ffffff;
}

[data-guide-content] :deep(hr) {
  border: 0;
  border-top: 1px solid var(--ui-color-neutral-200);
  margin: 2rem 0;
}

:global(.dark) [data-guide-content] :deep(hr) {
  border-top-color: var(--ui-color-neutral-800);
}

/* TOC: wrap text to multiple lines & eliminate horizontal scrollbar */
[data-toc-aside] :deep([data-slot="linkText"]) {
  white-space: normal !important;
  text-overflow: clip !important;
  overflow: visible !important;
  line-height: 1.35 !important;
}

[data-toc-aside] :deep([data-slot="link"]) {
  height: auto !important;
  padding-top: 0.25rem !important;
  padding-bottom: 0.25rem !important;
  align-items: flex-start !important;
  white-space: normal !important;
}

[data-toc-aside] :deep([data-slot="content"]),
[data-toc-aside] :deep([data-slot="container"]),
[data-toc-aside] :deep([data-slot="root"]) {
  overflow-x: hidden !important;
}

[data-toc-aside] :deep([data-slot="indicator"]) {
  width: 2px !important;
  margin-inline-start: calc(0.625rem - 0.5px) !important;
}
</style>
