<script setup lang="ts">
useSeoMeta({
  title: 'Cyanotype Guide Overview | Cyanotype',
  description: 'Comprehensive guide to the cyanotype alternative photography process, solution preparation, and historical context.',
  ogTitle: 'Cyanotype Guide Overview | Cyanotype',
  ogDescription: 'Comprehensive guide to the cyanotype alternative photography process, solution preparation, and historical context.'
})

const chapters = [
  {
    title: 'Development Procedure',
    description: 'Step-by-step workflow covering paper coating, dark drying, negative contact sandwich, UV exposure, water development, and toning.',
    to: '/guide/procedure',
    icon: 'i-lucide-sun-medium',
    badge: 'Step-by-step'
  },
  {
    title: 'Solution Preparation',
    description: 'Tested laboratory formulas (Alternativa 1), stock solutions A & B, the 2% oxalic acid contrast boost, and mixing ratios.',
    to: '/guide/solutions',
    icon: 'i-lucide-flask-conical',
    badge: 'Formulas'
  },
  {
    title: 'Historical Context',
    description: 'Sir John Herschel (1842), Anna Atkins and the first photographic book, the origins of blueprints, and the digital negative revival.',
    to: '/guide/context',
    icon: 'i-lucide-book-open',
    badge: 'History'
  }
]
</script>

<template>
  <div class="w-full max-w-4xl pb-16">
    <UPageHeader
      title="Cyanotype Process Guide"
      description="A practical and historical guide to classic alternative photography, contact printing, and chemical solution preparation."
      class="mb-8"
    />

    <UPageBody>
      <div class="space-y-10">
        <!-- Introduction Section -->
        <div class="space-y-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p class="text-base sm:text-lg">
            Cyanotype is one of the oldest, most accessible, and most permanent alternative photographic processes. Discovered in 1842 by Sir John Herschel, it uses iron salts rather than silver halides to create rich, velvety monochrome prints in shades of deep Prussian blue.
          </p>
          <p>
            Unlike conventional darkroom processes, cyanotype requires no specialized darkroom equipment, no noxious chemical developers, and no fixing baths – <strong>it develops simply and cleanly in running water</strong>. When combined with modern digital negatives printed on transparency film, anyone can produce archival, museum-grade 19th-century prints directly at home or in the laboratory.
          </p>
        </div>

        <!-- Chapters Grid -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold tracking-tight text-highlighted">
            Guide Chapters
          </h2>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NuxtLink
              v-for="chapter in chapters"
              :key="chapter.to"
              :to="chapter.to"
              class="group relative flex flex-col justify-between rounded-xl border border-default bg-elevated/40 p-5 transition-all hover:border-primary/50 hover:bg-elevated/80"
            >
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UIcon
                      :name="chapter.icon"
                      class="size-5"
                    />
                  </div>
                  <span class="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                    {{ chapter.badge }}
                  </span>
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
                <span>Read chapter</span>
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-3.5 transition-transform group-hover:translate-x-1"
                />
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Material Credits Section -->
        <div class="rounded-xl border border-default bg-elevated/30 p-6 space-y-2">
          <div class="flex items-center gap-2 text-highlighted font-semibold text-sm">
            <UIcon
              name="i-lucide-graduation-cap"
              class="size-4 text-primary"
            />
            <span>Credits & Acknowledgments</span>
          </div>
          <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            The instructional materials, formulas, and historical overviews in this guide were developed in collaboration with <strong>Ústav učitelství a humanitních věd, VŠCHT Praha</strong> (Department of Chemical Education and Humanities, University of Chemistry and Technology, Prague).
          </p>
        </div>

        <!-- Chemical Safety Disclaimer with soft background and thin dotted outline -->
        <div class="rounded-xl border border-dotted border-neutral-400 dark:border-neutral-700 bg-elevated/40 p-6 space-y-2">
          <div class="flex items-center gap-2 font-semibold text-sm text-highlighted">
            <UIcon
              name="i-lucide-shield-alert"
              class="size-4 text-amber-500"
            />
            <span>Chemical Safety Notice & Disclaimer</span>
          </div>
          <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            The handling and preparation of chemicals described in this guide require adequate knowledge of chemical hygiene and safe laboratory practices. Work should only be conducted by individuals knowledgeable in chemistry or under proper academic supervision. Neither the author nor UCT Prague (VŠCHT Praha) assume any liability or responsibility for personal injury, health complications, or property damage resulting from the handling, storage, or disposal of any chemicals mentioned.
          </p>
        </div>

        <!-- Call to Action -->
        <div class="rounded-2xl border border-default bg-elevated/50 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
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
              Transform your photos into digital negatives ready for contact printing onto transparency film.
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
