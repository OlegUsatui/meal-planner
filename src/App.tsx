import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './app/providers/AppProviders'
import { router } from './app/router/AppRouter'
import { AuthPage } from './features/auth/AuthPage'
import { AuthProvider } from './features/auth/AuthContext'
import { useAuth } from './features/auth/useAuth'

function App() {
  return <AuthProvider><AuthenticatedApp /></AuthProvider>
}

function AuthenticatedApp() {
  const { session, loading, configurationError } = useAuth()
  if (loading) return <main className="auth-page"><div className="loading-panel">Перевіряємо сесію…</div></main>
  if (configurationError || !session) return <AuthPage />
  return <AppProviders><RouterProvider router={router} /></AppProviders>
}

export default App
