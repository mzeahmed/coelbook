import { createRouter, createWebHistory } from 'vue-router'

import { getSetupStatus } from '@/api/setup'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/SetupView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
  ],
})

// The backend is the single source of truth for initialization state, so
// every navigation re-checks it instead of trusting anything cached
// client-side: /setup is unreachable once initialized, and every other
// route is unreachable until it is.
router.beforeEach(async (to) => {
  let initialized: boolean

  try {
    ;({ initialized } = await getSetupStatus())
  } catch {
    // The API is unreachable; let navigation proceed rather than trap the
    // user behind a redirect loop they can't recover from.
    return true
  }

  if (!initialized && to.name !== 'setup') {
    return { name: 'setup' }
  }

  if (initialized && to.name === 'setup') {
    return { name: 'login' }
  }

  return true
})

export default router