import { useContext } from 'react'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is missing')
  return value
}

export function useOptionalAuth(): AuthContextValue | undefined {
  return useContext(AuthContext)
}
