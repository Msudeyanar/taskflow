import { createBrowserClient } from '@supabase/ssr'

// Supabase bağlantı testi
let supabaseAvailable: boolean | null = null

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Env eksikse bile çökmesin, dummy client dönsün — fallback localStorage devreye girecek
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export async function isSupabaseAvailable(): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  if (supabaseAvailable !== null) return supabaseAvailable
  
  try {
    const client = createClient()
    const { error } = await client.from('boards').select('id').limit(1)
    supabaseAvailable = !error
  } catch {
    supabaseAvailable = false
  }
  
  return supabaseAvailable
}
