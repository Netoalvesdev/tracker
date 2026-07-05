import { ALLOWED_EVENT_TYPES, EventType, FunnelMetrics, WebhookEvent } from './types'

// Obtém o identificador único de um evento (prioridade: leadId > phone > email > id)
function getLeadIdentifier(event: WebhookEvent): string {
  return event.leadId ?? event.phone ?? event.email ?? event.id
}

// Calcula métricas a partir de eventos, respeitando contagem única por padrão
export function calculateMetrics(
  events: WebhookEvent[],
  unique = true
): FunnelMetrics {
  const counts = Object.fromEntries(
    ALLOWED_EVENT_TYPES.map((t) => [t, 0])
  ) as Record<EventType, number>

  if (unique) {
    // Conta apenas uma vez por identificador em cada etapa
    const seen = new Map<EventType, Set<string>>()
    ALLOWED_EVENT_TYPES.forEach((t) => seen.set(t, new Set()))

    for (const ev of events) {
      const key = getLeadIdentifier(ev)
      const set = seen.get(ev.eventType)!
      if (!set.has(key)) {
        set.add(key)
        counts[ev.eventType]++
      }
    }
  } else {
    for (const ev of events) {
      counts[ev.eventType]++
    }
  }

  const p1 = counts.parte_1
  const pagou = counts.pagou
  const upsell1 = counts.upsell_1

  const pct = (num: number, den: number) =>
    den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : 0

  // Maior gargalo = maior queda percentual entre etapas consecutivas do funil principal
  const funnelStages: EventType[] = ['parte_1', 'parte_2', 'parte_3', 'pagou', 'upsell_1', 'upsell_2']
  let biggestBottleneck: EventType | null = null
  let biggestDrop = 0

  for (let i = 1; i < funnelStages.length; i++) {
    const prev = counts[funnelStages[i - 1]]
    const curr = counts[funnelStages[i]]
    if (prev > 0) {
      const drop = ((prev - curr) / prev) * 100
      if (drop > biggestDrop) {
        biggestDrop = drop
        biggestBottleneck = funnelStages[i]
      }
    }
  }

  const lastEvent = events.length > 0
    ? events.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
    : null

  return {
    counts,
    conversionFront: pct(pagou, p1),
    conversionOrderBump: pct(counts.orderbump, pagou),
    conversionDownsellFront: pct(counts.downsell_front, p1),
    conversionUpsell1: pct(upsell1, pagou),
    conversionUpsell2: pct(counts.upsell_2, upsell1),
    conversionDownsellUpsell1: pct(counts.downsell_upsell_1, pagou),
    conversionDownsellUpsell2: pct(counts.downsell_upsell_2, upsell1),
    biggestBottleneck,
    lastEvent,
  }
}
