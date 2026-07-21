<script setup lang="ts">
import type { AdminInput, InstanceInput } from '@/api/setup'

defineProps<{
  admin: AdminInput
  instance: InstanceInput
}>()
</script>

<template>
  <div>
    <h2 class="h5 fw-semibold mb-1">Review &amp; finish</h2>
    <p class="small mb-4" style="color: var(--pb-text-muted)">
      Confirm everything looks right, then finish setup.
    </p>

    <div class="pb-surface border rounded-3 p-3 mb-3">
      <p
        class="text-uppercase fw-semibold mb-2"
        style="font-size: 0.625rem; letter-spacing: 0.08em; color: var(--pb-text-muted)"
      >
        Administrator
      </p>
      <div class="d-flex justify-content-between small mb-1">
        <span style="color: var(--pb-text-muted)">Name</span>
        <span class="fw-medium">{{ admin.first_name }} {{ admin.last_name }}</span>
      </div>
      <div class="d-flex justify-content-between small">
        <span style="color: var(--pb-text-muted)">Email</span>
        <span class="fw-medium">{{ admin.email }}</span>
      </div>
    </div>

    <div class="pb-surface border rounded-3 p-3">
      <p
        class="text-uppercase fw-semibold mb-2"
        style="font-size: 0.625rem; letter-spacing: 0.08em; color: var(--pb-text-muted)"
      >
        Instance
      </p>
      <div class="d-flex justify-content-between small mb-1">
        <span style="color: var(--pb-text-muted)">Name</span>
        <span class="fw-medium">{{ instance.name }}</span>
      </div>
      <div class="d-flex justify-content-between small mb-1">
        <span style="color: var(--pb-text-muted)">Timezone</span>
        <span class="fw-medium font-mono" style="font-size: 0.75rem">{{ instance.timezone }}</span>
      </div>
      <div class="d-flex justify-content-between small">
        <span style="color: var(--pb-text-muted)">Locale</span>
        <span class="fw-medium">{{ instance.locale }}</span>
      </div>
    </div>
  </div>
</template>