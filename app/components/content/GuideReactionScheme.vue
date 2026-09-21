<script setup lang="ts">
const { locale } = useI18n()
</script>

<template>
  <div class="my-6 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-5">
    <div class="text-xs uppercase font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
      {{ locale === 'cs' ? 'Schéma fotochemické reakce' : 'Photochemical Reaction Scheme' }}
    </div>

    <div class="space-y-4">
      <!-- Step 1 -->
      <div class="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent">
        <div class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
          {{ locale === 'cs' ? '1. krok: Fotoredukce železitého komplexu UV světlem na ionty Fe²⁺' : 'Step 1: Photoreduction of Iron(III) to Iron(II) by UV Light' }}
        </div>
        <div class="font-mono text-xs sm:text-sm font-medium text-highlighted overflow-x-auto py-1">
          2 [Fe(C₆H₅O₇)] + hν (UV, λ ~ 365 nm) → 2 Fe²⁺ + {{ locale === 'cs' ? '(oxidované produkty citranu)' : '(oxidized citrate)' }} + CO₂ ↑
        </div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-2 space-y-1">
          <div>• <strong>[Fe(C₆H₅O₇)] ({{ locale === 'cs' ? 'zelený citran železito-amonný' : 'Ferric Ammonium Citrate' }}):</strong> {{ locale === 'cs' ? 'Světlocitlivá organická sloučenina trojmocného železa sloužící jako donor elektronů.' : 'Light-sensitive organic iron(III) complex acting as electron donor.' }}</div>
          <div>• <strong>hν ({{ locale === 'cs' ? 'UV záření' : 'UV radiation' }}):</strong> {{ locale === 'cs' ? 'Fotony o vlnové délce 365 – 400 nm vybudí molekulu a redukují železo z Fe³⁺ na reaktivní Fe²⁺.' : 'Photons in the 365 – 400 nm band trigger photoreduction to reactive iron(II).' }}</div>
          <div>• <strong>Fe²⁺ ({{ locale === 'cs' ? 'ionty dvojmocného železa' : 'Ferrous ions' }}):</strong> {{ locale === 'cs' ? 'Chemicky aktivní železnaté ionty připravené k okamžité srážecí reakci.' : 'Chemically active reduced iron ready to couple with the oxidizer.' }}</div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent">
        <div class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
          {{ locale === 'cs' ? '2. krok: Vznik nerozpustné berlínské modři' : 'Step 2: Precipitation of Prussian Blue Pigment' }}
        </div>
        <div class="font-mono text-xs sm:text-sm font-medium text-highlighted overflow-x-auto py-1">
          4 Fe²⁺ + 4 [Fe(CN)₆]³⁻ + O₂ → Fe₄[Fe(CN)₆]₃ · xH₂O ↓
        </div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-2 space-y-1">
          <div>• <strong>[Fe(CN)₆]³⁻ ({{ locale === 'cs' ? 'červená krevní sůl' : 'Potassium Ferricyanide' }}):</strong> {{ locale === 'cs' ? 'Hexakyanoželezitan draselný, který tvoří koordinační vazbu s ionty železa.' : 'Potassium hexacyanoferrate(III), the iron-cyanide coupling agent.' }}</div>
          <div>• <strong>Fe₄[Fe(CN)₆]₃ · xH₂O ({{ locale === 'cs' ? 'berlínská / Turnbullova modř' : 'Prussian Blue / Turnbull\'s Blue' }}):</strong> {{ locale === 'cs' ? 'Stálý anorganický pigment trvale zachycený v celulózových vláknech papíru.' : 'Insoluble coordination polymer network permanently embedded within paper fibers.' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
