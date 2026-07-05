import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { isSupabaseConfigured, getSupabaseServerClient } from '@/lib/supabase-server'

function toSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return slug || 'produto'
}

function generateWebhookSecret(): string {
  return randomBytes(24).toString('hex')
}

async function createUniqueSlug(supabase: ReturnType<typeof getSupabaseServerClient>, name: string): Promise<string> {
  const baseSlug = toSlug(name)

  for (let index = 0; index < 100; index++) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`

    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      throw new Error(`Erro ao verificar slug: ${error.message}`)
    }

    if (!data) return candidate
  }

  return `${baseSlug}-${randomBytes(4).toString('hex')}`
}

const PRODUCT_FIELDS = 'id, name, slug, description, webhook_secret, created_at, is_active'

// GET /api/products — lista produtos reais do Supabase
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          message: 'Supabase não configurado. Configure as variáveis de ambiente antes de listar produtos.',
          products: [],
        },
        { status: 503 }
      )
    }

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, configured: true, message: 'Erro ao listar produtos', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, configured: true, products: data ?? [] })
  } catch (error) {
    console.error('Erro ao listar produtos:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao listar produtos',
        error: error instanceof Error ? error.message : String(error),
        products: [],
      },
      { status: 500 }
    )
  }
}

// POST /api/products — cria produto no Supabase e retorna o UUID real da linha criada
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          message: 'Supabase não configurado. O produto precisa ser criado no Supabase para gerar webhooks válidos.',
        },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const description = typeof body?.description === 'string' ? body.description.trim() : ''

    if (!name) {
      return NextResponse.json(
        { success: false, configured: true, message: 'Nome obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    const slug = await createUniqueSlug(supabase, name)
    const webhookSecret = generateWebhookSecret()

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description: description || null,
        webhook_secret: webhookSecret,
        is_active: true,
      })
      .select(PRODUCT_FIELDS)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, configured: true, message: error.code === '23505' ? 'Já existe um produto com esse nome. Tente novamente.' : 'Erro ao criar produto no Supabase', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, configured: true, product: data })
  } catch (error) {
    console.error('Erro ao criar produto:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao criar produto',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
