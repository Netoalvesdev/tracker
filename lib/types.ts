// Eventos permitidos nos webhooks
export const ALLOWED_EVENT_TYPES = [
  'parte_1',
  'parte_2',
  'parte_3',
  'pagou',
  'orderbump',
  'downsell_front',
  'upsell_1',
  'upsell_2',
  'downsell_upsell_1',
  'downsell_upsell_2',
] as const

export type EventType = (typeof ALLOWED_EVENT_TYPES)[number]

export const EVENT_LABELS: Record<EventType, string> = {
  parte_1: 'Parte 1',
  parte_2: 'Parte 2',
  parte_3: 'Parte 3',
  pagou: 'Pagou',
  orderbump: 'Order Bump',
  downsell_front: 'Downsell Front',
  upsell_1: 'Upsell 1',
  upsell_2: 'Upsell 2',
  downsell_upsell_1: 'Downsell Upsell 1',
  downsell_upsell_2: 'Downsell Upsell 2',
}

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normalizeEventType(value: string): EventType | null {
  const normalized = value.trim().toLowerCase().replace(/-/g, '_')
  return ALLOWED_EVENT_TYPES.includes(normalized as EventType)
    ? (normalized as EventType)
    : null
}

export interface WebhookEndpoint {
  eventType: EventType
  label: string
  url: string
  lastEventAt?: string
  lastEventStatus?: 'success' | 'error'
}

// Linha retornada pela tabela products do Supabase
export interface ProductRow {
  id: string
  name: string
  slug: string
  description: string | null
  webhook_secret: string
  created_at: string
  is_active: boolean
}

// Produto usado no front-end
export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  webhookSecret: string
  createdAt: string
  isActive: boolean
}

export function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    webhookSecret: row.webhook_secret,
    createdAt: row.created_at,
    isActive: row.is_active,
  }
}

// Linha retornada pela tabela webhook_events do Supabase
export interface WebhookEventRow {
  id: string
  product_id: string
  event_type: EventType | string
  lead_id: string | null
  phone: string | null
  name: string | null
  email: string | null
  source: string | null
  campaign: string | null
  creative: string | null
  payload: Record<string, unknown> | null
  is_test: boolean
  created_at: string
}

// Evento usado no front-end
export interface WebhookEvent {
  id: string
  productId: string
  eventType: EventType
  leadId?: string
  phone?: string
  name?: string
  email?: string
  source?: string
  campaign?: string
  creative?: string
  payload?: Record<string, unknown>
  isTest: boolean
  createdAt: string
}

export function webhookEventFromRow(row: WebhookEventRow): WebhookEvent | null {
  const eventType = normalizeEventType(String(row.event_type))
  if (!eventType) return null

  return {
    id: row.id,
    productId: row.product_id,
    eventType,
    leadId: row.lead_id ?? undefined,
    phone: row.phone ?? undefined,
    name: row.name ?? undefined,
    email: row.email ?? undefined,
    source: row.source ?? undefined,
    campaign: row.campaign ?? undefined,
    creative: row.creative ?? undefined,
    payload: row.payload ?? undefined,
    isTest: row.is_test,
    createdAt: row.created_at,
  }
}

// Métricas calculadas a partir dos eventos (sem campos financeiros)
export interface FunnelMetrics {
  // Contagem por etapa
  counts: Record<EventType, number>
  // Conversões calculadas
  conversionFront: number        // pagou / parte_1 * 100
  conversionOrderBump: number    // orderbump / pagou * 100
  conversionDownsellFront: number // downsell_front / parte_1 * 100
  conversionUpsell1: number      // upsell_1 / pagou * 100
  conversionUpsell2: number      // upsell_2 / upsell_1 * 100
  conversionDownsellUpsell1: number // downsell_upsell_1 / pagou * 100
  conversionDownsellUpsell2: number // downsell_upsell_2 / upsell_1 * 100
  biggestBottleneck: EventType | null
  lastEvent: WebhookEvent | null
}
