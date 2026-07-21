import { Fragment } from 'react'

interface WizardStepperProps {
  steps: string[]
  currentStep: number
}

export default function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="pb-stepper mb-4">
      {steps.map((label, index) => (
        <Fragment key={label}>
          <div
            className={`pb-stepper-dot ${
              index + 1 < currentStep ? 'is-done' : index + 1 === currentStep ? 'is-active' : ''
            }`}
            title={label}
          >
            {index + 1 < currentStep ? (
              <i className="fa-solid fa-check" style={{ fontSize: '0.65rem' }}></i>
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`pb-stepper-line ${index + 1 < currentStep ? 'is-done' : ''}`}></div>
          )}
        </Fragment>
      ))}
    </div>
  )
}