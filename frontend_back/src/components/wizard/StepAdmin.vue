<script setup lang="ts">
import { reactive, ref } from 'vue'

import type { AdminInput } from '@/api/setup'

const admin = defineModel<AdminInput>({ required: true })
const confirmPassword = ref('')

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

function validate(): boolean {
  errors.firstName = admin.value.first_name.trim() ? '' : 'First name is required.'
  errors.lastName = admin.value.last_name.trim() ? '' : 'Last name is required.'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.value.email) ? '' : 'Enter a valid email address.'
  errors.password = admin.value.password.length >= 8 ? '' : 'Password must be at least 8 characters.'
  errors.confirmPassword = confirmPassword.value === admin.value.password ? '' : 'Passwords do not match.'

  return !errors.firstName && !errors.lastName && !errors.email && !errors.password && !errors.confirmPassword
}

defineExpose({ validate })
</script>

<template>
  <div>
    <h2 class="h5 fw-semibold mb-1">Administrator account</h2>
    <p class="small mb-4" style="color: var(--pb-text-muted)">
      This is the account you'll use to sign in and manage Playbook.
    </p>

    <div class="row g-3 mb-3">
      <div class="col-sm-6">
        <label class="form-label small fw-medium" for="admin-first-name">First name</label>
        <input
          id="admin-first-name"
          v-model="admin.first_name"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errors.firstName }"
          autocomplete="given-name"
        />
        <div v-if="errors.firstName" class="invalid-feedback d-block small">{{ errors.firstName }}</div>
      </div>
      <div class="col-sm-6">
        <label class="form-label small fw-medium" for="admin-last-name">Last name</label>
        <input
          id="admin-last-name"
          v-model="admin.last_name"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errors.lastName }"
          autocomplete="family-name"
        />
        <div v-if="errors.lastName" class="invalid-feedback d-block small">{{ errors.lastName }}</div>
      </div>
    </div>

    <div class="mb-3">
      <label class="form-label small fw-medium" for="admin-email">Email</label>
      <input
        id="admin-email"
        v-model="admin.email"
        type="email"
        class="form-control"
        :class="{ 'is-invalid': errors.email }"
        autocomplete="email"
      />
      <div v-if="errors.email" class="invalid-feedback d-block small">{{ errors.email }}</div>
    </div>

    <div class="row g-3">
      <div class="col-sm-6">
        <label class="form-label small fw-medium" for="admin-password">Password</label>
        <input
          id="admin-password"
          v-model="admin.password"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': errors.password }"
          autocomplete="new-password"
        />
        <div v-if="errors.password" class="invalid-feedback d-block small">{{ errors.password }}</div>
      </div>
      <div class="col-sm-6">
        <label class="form-label small fw-medium" for="admin-confirm-password">Confirm password</label>
        <input
          id="admin-confirm-password"
          v-model="confirmPassword"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': errors.confirmPassword }"
          autocomplete="new-password"
        />
        <div v-if="errors.confirmPassword" class="invalid-feedback d-block small">{{ errors.confirmPassword }}</div>
      </div>
    </div>
  </div>
</template>