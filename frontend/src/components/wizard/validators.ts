import type {AdminInput, InstanceInput} from '@/api/setup'

export type AdminErrors = Partial<
  Record<'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword', string>
>

export function validateAdmin (admin: AdminInput, confirmPassword: string): AdminErrors {
  const errors: AdminErrors = {}

  if (!admin.first_name.trim()) errors.firstName = 'First name is required.'
  if (!admin.last_name.trim()) errors.lastName = 'Last name is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email)) errors.email = 'Enter a valid email address.'
  if (admin.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (confirmPassword !== admin.password) errors.confirmPassword = 'Passwords do not match.'

  return errors
}

export type InstanceErrors = Partial<Record<'name' | 'timezone', string>>

export function validateInstance (instance: InstanceInput): InstanceErrors {
  const errors: InstanceErrors = {}

  if (!instance.name.trim()) errors.name = 'Instance name is required.'
  if (!instance.timezone) errors.timezone = 'Timezone is required.'

  return errors
}
