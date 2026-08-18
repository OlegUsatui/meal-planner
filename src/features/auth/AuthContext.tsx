import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { requireSupabase, supabase } from '../../lib/supabase'
import { AuthContext, type AuthContextValue } from './auth-context'
import { cacheTimes, queryKeys } from '../../app/query/query-client'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const configurationError = supabase ? undefined : 'Додайте Supabase-змінні середовища перед запуском застосунку.'

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let active = true
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false) } })
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') queryClient.clear()
      setSession(nextSession)
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [queryClient])

  useEffect(() => {
    const client = supabase
    if (!client) return
    const expired = () => { clearSessionCache(queryClient); sessionStorage.setItem('meal-planner:session-expired', '1'); void client.auth.signOut() }
    window.addEventListener('meal-planner:session-expired', expired)
    return () => window.removeEventListener('meal-planner:session-expired', expired)
  }, [queryClient])

  useEffect(() => {
    if (!session) { setIsAdmin(false); setRoleLoading(false); setProfileLoading(false); return }
    let active = true
    setRoleLoading(true)
    setProfileLoading(true)
    void queryClient.fetchQuery({
      queryKey: queryKeys.me(session.user.id),
      staleTime: cacheTimes.catalogueStale,
      queryFn: () => fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Не вдалося перевірити роль')
        const payload = await response.json() as { data?: { isAdmin?: boolean } }
        return payload.data
      })
    }).then((profile) => { if (active) setIsAdmin(profile?.isAdmin === true) })
      .catch(() => { if (active) setIsAdmin(false) })
      .finally(() => { if (active) { setRoleLoading(false); setProfileLoading(false) } })
    return () => { active = false }
  }, [queryClient, session])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    roleLoading,
    profileLoading,
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
    async resendSignup(email) {
      const { error } = await requireSupabase().auth.resend({ type: 'signup', email })
      if (error) throw error
    },
    async resetPassword(email) {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` })
      if (error) throw error
    },
    async updatePassword(password) {
      const { error } = await requireSupabase().auth.updateUser({ password })
      if (error) throw error
    },
    async updateEmail(email) {
      const { error } = await requireSupabase().auth.updateUser({ email })
      if (error) throw error
    },
    async reauthenticate(password) {
      if (!session?.user.email) throw new Error('Email акаунта недоступний')
      const { data, error } = await requireSupabase().auth.signInWithPassword({ email: session.user.email, password })
      if (error) throw error
      if (!data.session?.access_token) throw new Error('Не вдалося оновити сесію')
      return data.session.access_token
    },
    async signOut() {
      clearSessionCache(queryClient)
      const { error } = await requireSupabase().auth.signOut()
      if (error) throw error
    },
  }), [configurationError, isAdmin, loading, profileLoading, roleLoading, session])

  return <AuthContext value={value}>{children}</AuthContext>
}

function clearSessionCache(queryClient: QueryClient): void {
  queryClient.clear()
  window.dispatchEvent(new Event('meal-planner:clear-session-cache'))
}
