'use client'

import { useEffect, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { calculateMetrics } from '@/lib/metrics'
import { filterEventsByPeriod } from '@/lib/period-filter'
import { webhookEventFromRow, WebhookEvent, WebhookEventRow } from '@/lib/types'
import { DashboardHeader } from './dashboard-header'
import { MetricCards } from './metric-cards'
import { ThermalFunnel } from './thermal-funnel'
import { ConversionPanel } from './conversion-panel'
import { WebhookPanel } from './webhook-panel'
import { EventsTable } from './events-table'
import { cn } from '@/lib/utils'

export function ProductDashboard() {
  const { products, activeProductId, events, period, customRange, countMode, setCountMode, setEvents } = useStore()
  const product = products.find((p) => p.id === activeProductId)

  useEffect(() => {
    if (!activeProductId) return

    let cancelled = false

    async function loadEvents() {
      try {
        const res = await fetch(`/api/products/${activeProductId}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data.success) {
          console.error('Erro ao carregar eventos:', data?.message ?? res.statusText)
          return
        }

        const mappedEvents = (data.events ?? [])
          .map((row: WebhookEventRow) => webhookEventFromRow(row))
          .filter((event: WebhookEvent | null): event is WebhookEvent => event !== null)

        if (!cancelled) setEvents(activeProductId, mappedEvents)
      } catch (error) {
        console.error('Erro ao carregar eventos:', error)
      }
    }

    loadEvents()

    return () => {
      cancelled = true
    }
  }, [activeProductId, setEvents])

  const productEvents = useMemo(
    () => events.filter((e) => e.productId === activeProductId),
    [events, activeProductId]
  )

  const filteredEvents = useMemo(
    () => filterEventsByPeriod(productEvents, period, customRange),
    [productEvents, period, customRange]
  )

  const metrics = useMemo(
    () => calculateMetrics(filteredEvents, countMode === 'unique'),
    [filteredEvents, countMode]
  )

  if (!product) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Produto não encontrado.</p>
      </div>
    )
  }

  return (
    <main className="flex-1 min-h-screen p-6 overflow-y-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="flex-1 min-w-0">
          <DashboardHeader
            title={product.name}
            subtitle={product.description ?? 'Dashboard do produto'}
          />
        </div>
        {/* Count mode toggle */}
        <div className="flex-shrink-0 flex items-center gap-1 bg-card border border-border rounded-lg p-1 self-start">
          <button
            onClick={() => setCountMode('unique')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              countMode === 'unique'
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            Contagem única
          </button>
          <button
            onClick={() => setCountMode('total')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              countMode === 'total'
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            Total de eventos
          </button>
        </div>
      </div>

      <MetricCards metrics={metrics} countMode={countMode} />
      <ThermalFunnel metrics={metrics} />
      <ConversionPanel metrics={metrics} />
      <WebhookPanel product={product} />
      <EventsTable events={filteredEvents} productName={product.name} />
    </main>
  )
}
