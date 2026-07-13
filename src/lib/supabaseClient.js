import { createClient } from '@supabase/supabase-js'

const url =
  import.meta.env.VITE_SUPABASE_URL ??
  import.meta.env.VITE_PUBLIC_SUPABASE_URL

const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

export function todayISO(date = new Date()) {
  return date.toISOString().slice(0, 10)
}
