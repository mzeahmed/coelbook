import { createBrowserRouter, redirect } from 'react-router-dom'

import { getSetupStatus } from '@/modules/setup/api'
import SetupView from '@/modules/setup/views/SetupView'
import LoginView from '@/modules/auth/views/LoginView'

// The backend is the single source of truth for initialization state, so
// every navigation re-checks it instead of trusting anything cached
// client-side: /setup is unreachable once initialized, and every other
// route is unreachable until it is.
async function guard(routeName: 'setup' | 'login') {
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
])

export default router