import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { completeSetup, type AdminInput, type InstanceInput } from '../api'
import WizardStepper from '../components/WizardStepper'
import StepWelcome from '../components/StepWelcome'
import StepAdmin from '../components/StepAdmin'
import StepInstance from '../components/StepInstance'
import StepFinish from '../components/StepFinish'
import { validateAdmin, validateInstance, type AdminErrors, type InstanceErrors } from '../components/validators'

const steps = ['Welcome', 'Administrator', 'Instance', 'Finish']

export default function SetupView() {
  const [currentStep, setCurrentStep] = useState(1)

  const [admin, setAdmin] = useState<AdminInput>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminErrors, setAdminErrors] = useState<AdminErrors>({})

  const [instance, setInstance] = useState<InstanceInput>({
    name: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: 'en',
  })
  const [instanceErrors, setInstanceErrors] = useState<InstanceErrors>({})

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const navigate = useNavigate()

  function updateAdmin(patch: Partial<AdminInput>) {
    setAdmin((prev) => ({ ...prev, ...patch }))
  }

  function updateInstance(patch: Partial<InstanceInput>) {
    setInstance((prev) => ({ ...prev, ...patch }))
  }

  function next() {
    if (currentStep === 2) {
      const errors = validateAdmin(admin, confirmPassword)
      setAdminErrors(errors)
      if (Object.keys(errors).length > 0) return
    }

    if (currentStep === 3) {
      const errors = validateInstance(instance)
      setInstanceErrors(errors)
      if (Object.keys(errors).length > 0) return
    }

    setCurrentStep((step) => step + 1)
  }

  function back() {
    setSubmitError('')
    setCurrentStep((step) => step - 1)
  }

  async function finish() {
    setSubmitting(true)
    setSubmitError('')

    try {
      await completeSetup(admin, instance)
      navigate('/login')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pb-wizard-shell d-flex align-items-center justify-content-center p-3">
      <div className="pb-card pb-wizard-card border rounded-4 p-4 p-sm-5">
        <WizardStepper steps={steps} currentStep={currentStep} />

        {currentStep === 1 && <StepWelcome />}
        {currentStep === 2 && (
          <StepAdmin
            admin={admin}
            onChange={updateAdmin}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            errors={adminErrors}
          />
        )}
        {currentStep === 3 && (
          <StepInstance instance={instance} onChange={updateInstance} errors={instanceErrors} />
        )}
        {currentStep === 4 && <StepFinish admin={admin} instance={instance} />}

        {submitError && (
          <div className="badge-danger-soft rounded-3 small mt-4 mb-0 py-2 px-3" role="alert">
            {submitError}
          </div>
        )}

        <div className="d-flex align-items-center gap-2 mt-4">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-sm pb-surface border"
              style={{ color: 'var(--pb-text-muted)' }}
              disabled={submitting}
              onClick={back}
            >
              Back
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              className="btn btn-primary btn-sm ms-auto fw-medium px-3"
              onClick={next}
            >
              {currentStep === 1 ? 'Get started' : 'Continue'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm ms-auto fw-medium px-3"
              disabled={submitting}
              onClick={finish}
            >
              {submitting && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              )}
              Finish setup
            </button>
          )}
        </div>
      </div>
    </div>
  )
}