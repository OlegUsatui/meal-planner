import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase не налаштовано. Додайте VITE_SUPABASE_URL і VITE_SUPABASE_ANON_KEY.')
  return supabase
}
