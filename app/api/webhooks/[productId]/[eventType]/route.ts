import { NextRequest, NextResponse } from 'next/server'
import { normalizeEventType, UUID_REGEX } from '@/lib/types'
import { isSupabaseConfigured, getSupabaseServerClient } from '@/lib/supabase-server'

function getText(body: Record<string, unknown>, camelKey: string, snakeKey?: string) {
  const value = body[camelKey] ?? (snakeKey ? body[snakeKey] : undefined)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; eventType: string }> }
) {
  try {
    const { productId, eventType: eventTypeParam } = await params
    const secret = request.nextUrl.searchParams.get('secret')?.trim() ?? ''

    if (!UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { success: false, message: 'productId inválido. Use o UUID real da tabela products.' },
        { status: 400 }
      )
    }

    const eventType = normalizeEventType(eventTypeParam)
    if (!eventType) {
      return NextResponse.json(
        { success: false, message: 'Etapa inválida' },
        { status: 400 }
      )
    }

    if (!secret) {
      return NextResponse.json(
        { success: false, message: 'Secret obrigatório' },
        { status: 401 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, configured: false, message: 'Supabase não configurado. Configure as variáveis de ambiente para registrar webhooks.' },
        { status: 503 }
      )
    }

    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // body vazio é aceito
    }

    const supabase = getSupabaseServerClient()

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, webhook_secret, is_active')
      .eq('id', productId)
      .maybeSingle()

    if (productError) {
      return NextResponse.json(
        { success: false, message: 'Erro ao buscar produto', error: productError.message },
        { status: 500 }
      )
    }

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    if (!product.is_active) {
      return NextResponse.json(
        { success: false, message: 'Produto inativo' },
        { status: 403 }
      )
    }

    if (product.webhook_secret !== secret) {
      return NextResponse.json(
        { success: false, message: 'Secret inválido' },
        { status: 401 }
      )
    }

    const leadId = getText(body, 'leadId', 'lead_id')
    const isTest = body?.source === 'teste' || leadId === 'teste_123'

    const { data: event, error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        product_id: product.id,
        event_type: eventType,
        lead_id: leadId,
        phone: getText(body, 'phone'),
        name: getText(body, 'name'),
        email: getText(body, 'email'),
        source: getText(body, 'source') ?? getText(body, 'utm_source'),
        campaign: getText(body, 'campaign') ?? getText(body, 'utm_campaign'),
        creative: getText(body, 'creative') ?? getText(body, 'utm_content'),
        payload: body,
        is_test: isTest,
      })
      .select('id, product_id, event_type, lead_id, phone, name, email, source, campaign, creative, payload, is_test, created_at')
      .single()

    if (insertError) {
      console.error('Erro ao salvar evento de webhook:', insertError)
      return NextResponse.json(
        { success: false, message: 'Erro ao salvar evento', error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Evento registrado com sucesso',
      event,
    })
  } catch (error) {
    console.error('Erro no webhook:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao registrar webhook',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
