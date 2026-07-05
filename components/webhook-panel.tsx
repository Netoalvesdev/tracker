'use client'

import { useMemo, useState, useEffect } from 'react'
import { Copy, Check, Play, Loader2, CopyCheck, Trash2 } from 'lucide-react'
import { useStore, buildWebhookUrls } from '@/lib/store'
import { Product, WebhookEvent, WebhookEventRow, webhookEventFromRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  product: Product
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getLatestEventByType(events: WebhookEvent[]) {
  return events.reduce<Record<string, WebhookEvent>>((acc, event) => {
    const current = acc[event.eventType]
    if (!current || new Date(event.createdAt).getTime() > new Date(current.createdAt).getTime()) {
      acc[event.eventType] = event
    }
    return acc
  }, {})
}

export function WebhookPanel({ product }: Props) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [clearingTests, setClearingTests] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error'>>({})
  const [mounted, setMounted] = useState(false)
  const { events, addEvent, clearTestEvents } = useStore()

  useEffect(() => setMounted(true), [])

  const productEvents = useMemo(
    () => events.filter((event) => event.productId === product.id),
    [events, product.id]
  )

  const latestByType = useMemo(
    () => getLatestEventByType(productEvents),
    [productEvents]
  )

  if (!mounted) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 mb-6 h-48 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  const webhooks = buildWebhookUrls(product)

  const handleCopy = async (url: string) => {
    await copyText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 1500)
  }

  const handleCopyAll = async () => {
    const text = webhooks
      .map((wh) => `${wh.label}:\n${wh.url}`)
      .join('\n\n')
    await copyText(text)
    setCopiedUrl('all')
    setTimeout(() => setCopiedUrl(null), 1500)
  }

  const handleClearTests = async () => {
    if (clearingTests) return

    setClearingTests(true)
    try {
      const res = await fetch(`/api/products/${product.id}/test-events`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        throw new Error(data?.message ?? data?.error ?? 'Erro ao limpar eventos de teste')
      }

      clearTestEvents(product.id)
      setTestResults({})
    } catch (error) {
      console.error('Erro ao limpar eventos de teste:', error)
      alert(error instanceof Error ? error.message : 'Erro ao limpar eventos de teste')
    } finally {
      setClearingTests(false)
    }
  }

  const handleTest = async (eventType: string) => {
    setTesting(eventType)
    try {
      const res = await fetch(`/api/webhooks/${product.id}/${eventType}?secret=${product.webhookSecret}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: `teste_${eventType}`,
          phone: '5581999999999',
          name: 'Lead Teste',
          source: 'teste',
          campaign: 'teste_tracker',
          creative: 'botao_teste',
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        setTestResults((r) => ({ ...r, [eventType]: 'success' }))
        if (data.event) {
          const event = webhookEventFromRow(data.event as WebhookEventRow)
          if (event) addEvent(event)
        }
      } else {
        console.error('Erro no teste de webhook:', data)
        setTestResults((r) => ({ ...r, [eventType]: 'error' }))
      }
    } catch (error) {
      console.error('Erro no teste de webhook:', error)
      setTestResults((r) => ({ ...r, [eventType]: 'error' }))
    }
    setTesting(null)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-foreground">Endpoints de Webhook</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearTests}
            disabled={clearingTests}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border hover:text-negative hover:border-negative/40 disabled:opacity-50 transition-colors"
          >
            {clearingTests ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Limpar testes
          </button>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-muted text-foreground border border-border hover:border-brand/40 transition-colors"
          >
            {copiedUrl === 'all' ? <Check size={12} className="text-brand" /> : <CopyCheck size={12} />}
            Copiar todos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {webhooks.map((wh) => {
          const result = testResults[wh.eventType]
          const latestEvent = latestByType[wh.eventType]
          const hasLatestEvent = Boolean(latestEvent)
          const status = result === 'error'
            ? 'Erro'
            : hasLatestEvent
              ? 'Funcionando'
              : 'Sem evento'

          return (
            <div key={wh.eventType} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2.5 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-xs font-medium text-foreground">{wh.label}</p>
                  <span
                    className={cn(
                      'text-xs',
                      status === 'Funcionando' && 'text-positive',
                      status === 'Erro' && 'text-negative',
                      status === 'Sem evento' && 'text-muted-foreground'
                    )}
                  >
                    {status}
                  </span>
                  {result === 'success' && <span className="text-xs text-brand">Testado</span>}
                  {latestEvent && (
                    <span className="text-xs text-muted-foreground">
                      {latestEvent.isTest ? 'teste' : 'real'} · {formatEventDate(latestEvent.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">{wh.url}</p>
              </div>

              <button
                onClick={() => handleTest(wh.eventType)}
                disabled={testing === wh.eventType}
                className={cn(
                  'flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded text-muted-foreground hover:text-brand',
                  testing === wh.eventType && 'opacity-100'
                )}
                title="Testar webhook"
              >
                {testing === wh.eventType
                  ? <Loader2 size={12} className="animate-spin text-brand" />
                  : <Play size={12} />
                }
              </button>
              <button
                onClick={() => handleCopy(wh.url)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded text-muted-foreground hover:text-brand"
                title="Copiar URL"
              >
                {copiedUrl === wh.url ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Cole estas URLs nas etapas do seu fluxo de WhatsApp. Cada chamada registra um evento no dashboard.
      </p>
    </div>
  )
}
