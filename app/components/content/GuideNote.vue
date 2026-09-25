<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="my-5 rounded-lg border border-dotted border-neutral-300 dark:border-neutral-700 bg-transparent p-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
    <strong
      v-if="title"
      class="text-highlighted font-semibold mr-1.5"
    >{{ title }}:</strong>
    <slot />
  </div>
</template>
