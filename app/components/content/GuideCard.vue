<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="my-5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-5">
    <div
      v-if="title"
      class="text-xs uppercase font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 mb-3"
    >
      {{ title }}
    </div>
    <div class="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      <slot />
    </div>
  </div>
</template>
