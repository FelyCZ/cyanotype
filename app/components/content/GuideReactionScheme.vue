<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="my-6 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-5">
    <div class="text-xs uppercase font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
      {{ t('guide.reaction.schemeTitle') }}
    </div>

    <div class="space-y-4">
      <!-- Step 1 -->
      <div class="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent">
        <div class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
          {{ t('guide.reaction.step1Title') }}
        </div>
        <div class="font-mono text-xs sm:text-sm font-medium text-highlighted overflow-x-auto py-1">
          2 [Fe(C₆H₅O₇)] + hν (UV, λ ~ 365 nm) → 2 Fe²⁺ + {{ t('guide.reaction.step1OxidizedCitrate') }} + CO₂ ↑
        </div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-2 space-y-1">
          <div>• <strong>[Fe(C₆H₅O₇)] ({{ t('guide.reaction.step1CitrateLabel') }}):</strong> {{ t('guide.reaction.step1CitrateDesc') }}</div>
          <div>• <strong>hν ({{ t('guide.reaction.step1UvLabel') }}):</strong> {{ t('guide.reaction.step1UvDesc') }}</div>
          <div>• <strong>Fe²⁺ ({{ t('guide.reaction.step1FeLabel') }}):</strong> {{ t('guide.reaction.step1FeDesc') }}</div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent">
        <div class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
          {{ t('guide.reaction.step2Title') }}
        </div>
        <div class="font-mono text-xs sm:text-sm font-medium text-highlighted overflow-x-auto py-1">
          4 Fe²⁺ + 4 [Fe(CN)₆]³⁻ + O₂ → Fe₄[Fe(CN)₆]₃ · xH₂O ↓
        </div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-2 space-y-1">
          <div>• <strong>[Fe(CN)₆]³⁻ ({{ t('guide.reaction.step2RedSaltLabel') }}):</strong> {{ t('guide.reaction.step2RedSaltDesc') }}</div>
          <div>• <strong>Fe₄[Fe(CN)₆]₃ · xH₂O ({{ t('guide.reaction.step2PrussianBlueLabel') }}):</strong> {{ t('guide.reaction.step2PrussianBlueDesc') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
