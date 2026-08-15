import { Suspense, useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './app/providers/AppProviders'
import { router } from './app/router/AppRouter'
import { AuthPage } from './features/auth/AuthPage'
import { AuthProvider } from './features/auth/AuthContext'
import { useAuth } from './features/auth/useAuth'
import { AppErrorBoundary } from './app/shell/AppErrorBoundary'
import { ResetPasswordPage } from './features/auth/ResetPasswordPage'
import { createSessionQueryClient } from './app/query/query-client'

function App() {
  const [queryClient] = useState(createSessionQueryClient)

  return <AppErrorBoundary><QueryClientProvider client={queryClient}><AuthProvider><AuthenticatedApp /></AuthProvider></QueryClientProvider></AppErrorBoundary>
}

function AuthenticatedApp() {
  const { session, loading, configurationError } = useAuth()
  if (loading) return <main className="auth-page"><div className="loading-panel">Перевіряємо сесію…</div></main>
  if (window.location.pathname === '/auth/reset-password') return <ResetPasswordPage />
  if (configurationError || !session) return <AuthPage />
  return <SessionApp key={session.user.id} />
}

function SessionApp() {
  const [queryClient] = useState(createSessionQueryClient)
  useEffect(() => {
    const clear = () => queryClient.clear()
    window.addEventListener('meal-planner:clear-session-cache', clear)
    return () => { window.removeEventListener('meal-planner:clear-session-cache', clear); queryClient.clear() }
  }, [queryClient])

  return <QueryClientProvider client={queryClient}><AppProviders><Suspense fallback={<main className="route-loading" aria-busy="true"><div className="loading-panel" role="status">Завантажуємо сторінку…</div></main>}><RouterProvider router={router} /></Suspense></AppProviders></QueryClientProvider>
}

export default App
