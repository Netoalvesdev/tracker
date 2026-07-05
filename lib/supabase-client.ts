import { createClient } from '@supabase/supabase-js'

function cleanEnv(value: string | undefined) {
  return value?.trim()
}

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabasePublishableKey = cleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Client público — seguro para usar no front-end
// Retorna null quando as variáveis de ambiente não estão configuradas
export function getSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) return null
  return createClient(supabaseUrl, supabasePublishableKey)
}
