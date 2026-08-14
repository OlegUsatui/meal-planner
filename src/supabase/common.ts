import type { SupabaseClient } from '@supabase/supabase-js'

export async function currentUserId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('Потрібно увійти до акаунта.')
  return data.user.id
}

export function cleanName(value: string): string {
  return value.trim().replace(/\s+/gu, ' ')
}

export function timestamp(value: string | null | undefined): string {
  return value ?? new Date().toISOString()
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : typeof value === 'string' && value ? Number(value) : null
}

export function asBoolean(value: unknown): boolean {
  return value === true
}
