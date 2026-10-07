import { createBrowserRouter, redirect } from 'react-router-dom'

import { getSetupStatus } from '@/modules/wizard/api'
import { getToken } from '@/modules/auth/session'
import SetupView from '@/modules/wizard/views/SetupView'
import LoginView from '@/modules/auth/views/LoginView'
import ForgotPasswordView from '@/modules/auth/views/ForgotPasswordView'
import ResetPasswordView from '@/modules/auth/views/ResetPasswordView'
import DashboardView from '@/modules/dashboard/views/DashboardView'
import IncidentView from '@/modules/dashboard/views/IncidentView'

// The API is the single source of truth for initialization state, so
// every navigation re-checks it instead of trusting anything cached
// client-side: /setup is unreachable once initialized, and every other
// route is unreachable until it is.
async function guard(routeName: 'setup' | 'login' | 'forgot-password' | 'reset-password') {
  let initialized: boolean

  try {
    const status = await getSetupStatus()
    initialized = status.initialized
  } catch {
    // The API is unreachable; let navigation proceed rather than trap the
    // user behind a redirect loop they can't recover from.
    return null
  }

  if (!initialized && routeName !== 'setup') {
    return redirect('/setup')
  }

  if (initialized && routeName === 'setup') {
    return redirect('/login')
  }

  // Already signed in: /login has nothing left to do.
  if (routeName === 'login' && getToken()) {
    return redirect('/dashboard')
  }

  return null
}

const router = createBrowserRouter([
  {
    path: '/',
    loader: () => redirect('/login'),
  },
  {
    path: '/setup',
    loader: () => guard('setup'),
    Component: SetupView,
  },
  {
    path: '/login',
    loader: () => guard('login'),
    Component: LoginView,
  },
  {
    path: '/forgot-password',
    loader: () => guard('forgot-password'),
    Component: ForgotPasswordView,
  },
  {
    path: '/reset-password',
    loader: () => guard('reset-password'),
    Component: ResetPasswordView,
  },
  {
    path: '/dashboard',
    loader: () => (getToken() ? null : redirect('/login')),
    Component: DashboardView,
  },
  {
    path: '/incidents/:slug',
    loader: () => (getToken() ? null : redirect('/login')),
    Component: IncidentView,
  },
])

export default router
