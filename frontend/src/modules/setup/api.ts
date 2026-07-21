import {apiFetch} from '@/http/client'

export interface AdminInput {
  first_name: string
  last_name: string
  email: string
  password: string
}

export interface InstanceInput {
  name: string
  timezone: string
  locale: string
}

export interface SetupStatus {
  initialized: boolean
}

// getSetupStatus reports whether the setup wizard has already been
// completed. The backend is the single source of truth for this: it must
// be checked on every load, never assumed from local/session state.
//
// This runs on every route navigation, so it uses a short timeout: a slow
// or unreachable API should fail fast rather than stall navigation for
// the default 15s.
export function getSetupStatus (): Promise<SetupStatus> {
  return apiFetch<SetupStatus>('/api/setup/status', undefined, 5000)
}

// completeSetup submits the full wizard payload in one call: the backend
// creates the administrator and stores the instance configuration in a
// single transaction.
export function completeSetup (admin: AdminInput, instance: InstanceInput): Promise<null> {
  return apiFetch<null>('/api/setup', {
    method: 'POST',
    payload: {
      admin,
      instance
    },
  })
}
