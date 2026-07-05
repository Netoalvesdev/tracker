'use client'

import { Users, ShoppingCart, TrendingDown, Clock, AlertTriangle } from 'lucide-react'
import { FunnelMetrics, WebhookEvent, EVENT_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  metrics: FunnelMetrics
  countMode: 'unique' | 'total'
}

export function MetricCards({ metrics, countMode }: Props) {
  const { counts, conversionFront, biggestBottleneck, lastEvent } = metrics

  const cards = [
    {
      icon: Users,
      color: '#6366f1',
      label: 'Entraram no funil',
      value: counts.parte_1.toLocaleString('pt-BR'),
      sub: 'Parte 1',
    },
    {
      icon: ShoppingCart,
      color: '#00e676',
      label: 'Compraram',
      value: counts.pagou.toLocaleString('pt-BR'),
      sub: 'Pagou',
    },
    {
      icon: TrendingDown,
      color: conversionFront >= 5 ? '#00e676' : '#f59e0b',
      label: 'Conversão geral',
      value: `${conversionFront.toFixed(1)}%`,
      sub: 'Pagou / Parte 1',
    },
    {
      icon: AlertTriangle,
      color: '#ef4444',
      label: 'Maior gargalo',
      value: biggestBottleneck ? EVENT_LABELS[biggestBottleneck] : '—',
      sub: biggestBottleneck ? 'maior queda no funil' : 'sem dados suficientes',
    },
    {
      icon: Clock,
      color: '#f59e0b',
      label: 'Último evento',
      value: lastEvent ? EVENT_LABELS[lastEvent.eventType] : '—',
      sub: lastEvent
        ? `${formatDate(lastEvent.createdAt)}${lastEvent.leadId ? ` · ${lastEvent.leadId}` : lastEvent.phone ? ` · ${lastEvent.phone}` : ''}`
        : 'nenhum evento ainda',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: card.color + '22' }}
              >
                <Icon size={13} style={{ color: card.color }} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.sub}</p>
            </div>
          </div>
        )
      })}
      {countMode === 'total' && (
        <div className="col-span-full">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            Modo: contagem total de eventos (incluindo repetidos)
          </span>
        </div>
      )}
    </div>
  )
}
