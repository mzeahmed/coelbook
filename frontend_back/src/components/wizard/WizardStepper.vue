<script setup lang="ts">
defineProps<{
  steps: string[]
  currentStep: number
}>()
</script>

<template>
  <div class="pb-stepper mb-4">
    <template v-for="(label, index) in steps" :key="label">
      <div
        class="pb-stepper-dot"
        :class="{
          'is-done': index + 1 < currentStep,
          'is-active': index + 1 === currentStep,
        }"
        :title="label"
      >
        <i v-if="index + 1 < currentStep" class="fa-solid fa-check" style="font-size: 0.65rem"></i>
        <span v-else>{{ index + 1 }}</span>
      </div>
      <div v-if="index < steps.length - 1" class="pb-stepper-line" :class="{ 'is-done': index + 1 < currentStep }"></div>
    </template>
  </div>
</template>