import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthContextValue {
  session: Session | null
  loading: boolean
  roleLoading: boolean
  isAdmin: boolean
  profileLoading: boolean
  onboardingCompleted: boolean
  configurationError?: string
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<void>
  resendSignup(email: string): Promise<void>
  resetPassword(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
  updateEmail(email: string): Promise<void>
  reauthenticate(password: string): Promise<string>
  completeOnboarding(): Promise<void>
  signOut(): Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
