import type { AdminInput, InstanceInput } from './api'

export type AdminErrors = Partial<
  Record<'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword', string>
>

export function validateAdmin (admin: AdminInput, confirmPassword: string): AdminErrors {
  const errors: AdminErrors = {}

  if (!admin.first_name.trim()) errors.firstName = 'Le prénom est obligatoire.'
  if (!admin.last_name.trim()) errors.lastName = 'Le nom est obligatoire.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email)) errors.email = 'Saisissez une adresse e-mail valide.'
  if (admin.password.length < 8) errors.password = 'Le mot de passe doit contenir au moins 8 caractères.'
  if (confirmPassword !== admin.password) errors.confirmPassword = 'Les mots de passe ne correspondent pas.'

  return errors
}

export type InstanceErrors = Partial<Record<'name' | 'timezone', string>>

export function validateInstance (instance: InstanceInput): InstanceErrors {
  const errors: InstanceErrors = {}

  if (!instance.name.trim()) errors.name = 'Le nom de l\'instance est obligatoire.'
  if (!instance.timezone) errors.timezone = 'Le fuseau horaire est obligatoire.'

  return errors
}
