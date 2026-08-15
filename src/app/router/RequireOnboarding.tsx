import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'

export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { onboardingCompleted, profileLoading } = useAuth()
  const location = useLocation()
  if (profileLoading) return <main className="route-loading" aria-busy="true"><div className="loading-panel" role="status">Завантажуємо профіль…</div></main>
  if (!onboardingCompleted) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/welcome?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }
  return children
}
