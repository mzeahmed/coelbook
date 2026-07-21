<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api/http'
import { completeSetup, type AdminInput, type InstanceInput } from '@/api/setup'
import WizardStepper from '@/components/wizard/WizardStepper.vue'
import StepWelcome from '@/components/wizard/StepWelcome.vue'
import StepAdmin from '@/components/wizard/StepAdmin.vue'
import StepInstance from '@/components/wizard/StepInstance.vue'
import StepFinish from '@/components/wizard/StepFinish.vue'

const steps = ['Welcome', 'Administrator', 'Instance', 'Finish']
const currentStep = ref(1)

const admin = ref<AdminInput>({ first_name: '', last_name: '', email: '', password: '' })
const instance = ref<InstanceInput>({ name: '', timezone: '', locale: 'en' })

const adminStepRef = ref<{ validate: () => boolean } | null>(null)
const instanceStepRef = ref<{ validate: () => boolean } | null>(null)

const submitting = ref(false)
const submitError = ref('')

const router = useRouter()

function next() {
  if (currentStep.value === 2 && !adminStepRef.value?.validate()) return
  if (currentStep.value === 3 && !instanceStepRef.value?.validate()) return

  currentStep.value++
}

function back() {
  submitError.value = ''
  currentStep.value--
}

async function finish() {
  submitting.value = true
  submitError.value = ''

  try {
    await completeSetup(admin.value, instance.value)
    await router.push({ name: 'login' })
  } catch (err) {
    submitError.value = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="pb-wizard-shell d-flex align-items-center justify-content-center p-3">
    <div class="pb-card pb-wizard-card border rounded-4 p-4 p-sm-5">
      <WizardStepper :steps="steps" :current-step="currentStep" />

      <StepWelcome v-if="currentStep === 1" />
      <StepAdmin v-else-if="currentStep === 2" ref="adminStepRef" v-model="admin" />
      <StepInstance v-else-if="currentStep === 3" ref="instanceStepRef" v-model="instance" />
      <StepFinish v-else :admin="admin" :instance="instance" />

      <div v-if="submitError" class="badge-danger-soft rounded-3 small mt-4 mb-0 py-2 px-3" role="alert">
        {{ submitError }}
      </div>

      <div class="d-flex align-items-center gap-2 mt-4">
        <button
          v-if="currentStep > 1"
          type="button"
          class="btn btn-sm pb-surface border"
          style="color: var(--pb-text-muted)"
          :disabled="submitting"
          @click="back"
        >
          Back
        </button>

        <button
          v-if="currentStep < 4"
          type="button"
          class="btn btn-primary btn-sm ms-auto fw-medium px-3"
          @click="next"
        >
          {{ currentStep === 1 ? 'Get started' : 'Continue' }}
        </button>

        <button
          v-else
          type="button"
          class="btn btn-primary btn-sm ms-auto fw-medium px-3"
          :disabled="submitting"
          @click="finish"
        >
          <span
            v-if="submitting"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Finish setup
        </button>
      </div>
    </div>
  </div>
</template>