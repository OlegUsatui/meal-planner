import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { ApiError, header, type ApiRequest } from './http.js'

export interface AuthContext {
  client: SupabaseClient
  user: User
}

export function bearerToken(request: ApiRequest): string {
  const value = header(request, 'authorization')
  if (!value?.startsWith('Bearer ')) throw new ApiError(401, 'unauthorized', 'Потрібна авторизація')
  const token = value.slice('Bearer '.length).trim()
  if (!token) throw new ApiError(401, 'unauthorized', 'Потрібна авторизація')
  return token
}

export async function authenticate(request: ApiRequest, environment: Record<string, string | undefined> = process.env): Promise<AuthContext> {
  const token = bearerToken(request)
  const url = environment.SUPABASE_URL
  const key = environment.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new ApiError(500, 'internal', 'API не налаштовано')
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }, global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) throw new ApiError(401, 'unauthorized', 'Сесія недійсна або завершилася')
  return { client, user: data.user }
}
