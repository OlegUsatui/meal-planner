import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { requireSupabase, supabase } from '../../lib/supabase'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const configurationError = supabase ? undefined : 'Додайте Supabase-змінні середовища перед запуском застосунку.'

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let active = true
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false) } })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session) { setIsAdmin(false); setRoleLoading(false); return }
    let active = true
    setRoleLoading(true)
    void fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Не вдалося перевірити роль')
        const payload = await response.json() as { data?: { isAdmin?: boolean } }
        if (active) setIsAdmin(payload.data?.isAdmin === true)
      })
      .catch(() => { if (active) setIsAdmin(false) })
      .finally(() => { if (active) setRoleLoading(false) })
    return () => { active = false }
  }, [session])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    roleLoading,
    isAdmin,
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
  }), [configurationError, isAdmin, loading, roleLoading, session])

  return <AuthContext value={value}>{children}</AuthContext>
}
