import { createClient } from '@supabase/supabase-js'

let supabaseClient

export function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.')
  }

  supabaseClient ??= createClient(url, anonKey)
  return supabaseClient
}