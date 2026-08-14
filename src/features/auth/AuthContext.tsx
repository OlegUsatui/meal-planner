import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { requireSupabase, supabase } from '../../lib/supabase'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const configurationError = supabase ? undefined : 'Додайте Supabase-змінні середовища перед запуском застосунку.'

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let active = true
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false) } })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    configurationError,
    async signIn(email, password) {
      const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password) {
      const { error } = await requireSupabase().auth.signUp({ email, password })
      if (error) throw error
    },
    async resetPassword(email) {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      if (error) throw error
    },
    async signOut() {
      const { error } = await requireSupabase().auth.signOut()
      if (error) throw error
    },
  }), [configurationError, loading, session])

  return <AuthContext value={value}>{children}</AuthContext>
}
