import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured, getSupabaseServerClient } from '@/lib/supabase-server'
import { UUID_REGEX } from '@/lib/types'

const EVENT_FIELDS = 'id, product_id, event_type, lead_id, phone, name, email, source, campaign, creative, payload, is_test, created_at'

// DELETE /api/products/[productId] — apaga produto real do Supabase
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    if (!UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { success: false, message: 'productId inválido. Use o UUID real da tabela products.' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, configured: false, message: 'Supabase não configurado.' },
        { status: 503 }
      )
    }

    const supabase = getSupabaseServerClient()

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      return NextResponse.json(
        { success: false, configured: true, message: 'Erro ao apagar produto', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, configured: true })
  } catch (error) {
    console.error('Erro ao apagar produto:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao apagar produto',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// GET /api/products/[productId] — busca eventos do produto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    if (!UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { success: false, message: 'productId inválido. Use o UUID real da tabela products.', events: [] },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, configured: false, message: 'Supabase não configurado.', events: [] },
        { status: 503 }
      )
    }

    const supabase = getSupabaseServerClient()
    const from = request.nextUrl.searchParams.get('from')
    const to = request.nextUrl.searchParams.get('to')

    let query = supabase
      .from('webhook_events')
      .select(EVENT_FIELDS)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, configured: true, message: 'Erro ao buscar eventos', error: error.message, events: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, configured: true, events: data ?? [] })
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao buscar eventos',
        error: error instanceof Error ? error.message : String(error),
        events: [],
      },
      { status: 500 }
    )
  }
}
