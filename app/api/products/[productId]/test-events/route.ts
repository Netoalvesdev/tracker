import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured, getSupabaseServerClient } from '@/lib/supabase-server'
import { UUID_REGEX } from '@/lib/types'

// DELETE /api/products/[productId]/test-events — remove eventos de teste do produto no Supabase
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
      .from('webhook_events')
      .delete()
      .eq('product_id', productId)
      .eq('is_test', true)

    if (error) {
      return NextResponse.json(
        { success: false, configured: true, message: 'Erro ao limpar eventos de teste', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      configured: true,
      message: 'Eventos de teste apagados com sucesso',
    })
  } catch (error) {
    console.error('Erro ao limpar eventos de teste:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao limpar eventos de teste',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
