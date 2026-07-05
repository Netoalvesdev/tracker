import { createClient } from '@supabase/supabase-js'

function cleanEnv(value: string | undefined) {
  return value?.trim()
}

// Client de servidor — NUNCA importar em arquivos "use client"
// Usa a secret key que nunca deve ser exposta no browser
export function getSupabaseServerClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const secret = cleanEnv(
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  if (!url || !secret) {
    throw new Error(
      'Variáveis de ambiente do Supabase não configuradas. ' +
      'Adicione NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY nas configurações do projeto.'
    )
  }

  return createClient(url, secret, {
    auth: { persistSession: false },
  })
}

export function isSupabaseConfigured() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const secret = cleanEnv(
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const pub = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return Boolean(url && secret && pub)
}
