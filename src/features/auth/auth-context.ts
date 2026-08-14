import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthContextValue {
  session: Session | null
  loading: boolean
  configurationError?: string
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<void>
  resetPassword(email: string): Promise<void>
  signOut(): Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
