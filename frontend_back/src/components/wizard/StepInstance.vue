<script setup lang="ts">
import { reactive } from 'vue'

import type { InstanceInput } from '@/api/setup'

const instance = defineModel<InstanceInput>({ required: true })

const timezones: string[] =
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['UTC']

const locales = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

if (!instance.value.timezone) {
  instance.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
}

const errors = reactive({
  name: '',
  timezone: '',
})

function validate(): boolean {
  errors.name = instance.value.name.trim() ? '' : 'Instance name is required.'
  errors.timezone = instance.value.timezone ? '' : 'Timezone is required.'

  return !errors.name && !errors.timezone
}

defineExpose({ validate })
</script>

<template>
  <div>
    <h2 class="h5 fw-semibold mb-1">Instance configuration</h2>
    <p class="small mb-4" style="color: var(--pb-text-muted)">Basic details about this Playbook instance.</p>

    <div class="mb-3">
      <label class="form-label small fw-medium" for="instance-name">Instance name</label>
      <input
        id="instance-name"
        v-model="instance.name"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': errors.name }"
        placeholder="e.g. Acme Engineering"
      />
      <div v-if="errors.name" class="invalid-feedback d-block small">{{ errors.name }}</div>
    </div>

    <div class="row g-3">
      <div class="col-sm-7">
        <label class="form-label small fw-medium" for="instance-timezone">Timezone</label>
        <select
          id="instance-timezone"
          v-model="instance.timezone"
          class="form-select"
          :class="{ 'is-invalid': errors.timezone }"
        >
          <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
        </select>
        <div v-if="errors.timezone" class="invalid-feedback d-block small">{{ errors.timezone }}</div>
      </div>
      <div class="col-sm-5">
        <label class="form-label small fw-medium" for="instance-locale">Locale</label>
        <select id="instance-locale" v-model="instance.locale" class="form-select">
          <option v-for="locale in locales" :key="locale.value" :value="locale.value">
            {{ locale.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>