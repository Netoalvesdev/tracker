import { WebhookEvent } from './types'

function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function endOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(23, 59, 59, 999)
  return r
}

export function filterEventsByPeriod(
  events: WebhookEvent[],
  period: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom',
  customRange: { from: string; to: string }
): WebhookEvent[] {
  const now = new Date()

  let from: Date
  let to: Date = endOfDay(now)

  switch (period) {
    case 'today':
      from = startOfDay(now)
      break
    case 'yesterday': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      from = startOfDay(y)
      to = endOfDay(y)
      break
    }
    case '7d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      from = startOfDay(d)
      break
    }
    case '30d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      from = startOfDay(d)
      break
    }
    case 'month': {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    }
    case 'custom': {
      if (!customRange.from && !customRange.to) return events
      from = customRange.from ? startOfDay(new Date(customRange.from)) : new Date(0)
      to = customRange.to ? endOfDay(new Date(customRange.to)) : endOfDay(now)
      break
    }
  }

  return events.filter((e) => {
    const t = new Date(e.createdAt).getTime()
    return t >= from.getTime() && t <= to.getTime()
  })
}
