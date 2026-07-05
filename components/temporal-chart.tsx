'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { WebhookEvent } from '@/lib/types'
import { cn } from '@/lib/utils'

const METRICS = [
  { key: 'leads', label: 'Entraram no funil', color: '#00e676' },
  { key: 'buyers', label: 'Compraram', color: '#818cf8' },
] as const

type MetricKey = (typeof METRICS)[number]['key']

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

interface Props {
  events: WebhookEvent[]
}

export function TemporalChart({ events }: Props) {
  const [active, setActive] = useState<MetricKey[]>(['leads', 'buyers'])
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const data = useMemo(() => {
    const byDate = new Map<string, { date: string; leads: number; buyers: number }>()

    for (const event of events) {
      const date = event.createdAt.slice(0, 10)
      const row = byDate.get(date) ?? { date: formatDate(date), leads: 0, buyers: 0 }
      if (event.eventType === 'parte_1') row.leads += 1
      if (event.eventType === 'pagou') row.buyers += 1
      byDate.set(date, row)
    }

    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
  }, [events])

  const toggle = (key: MetricKey) =>
    setActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  if (!mounted) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 mb-6 h-[316px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h2 className="text-sm font-semibold text-foreground">Evolução temporal</h2>
        <div className="flex items-center gap-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                active.includes(m.key)
                  ? 'text-foreground border-transparent'
                  : 'text-muted-foreground border-border hover:border-foreground/20'
              )}
              style={active.includes(m.key) ? { background: m.color + '22', borderColor: m.color + '44' } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: active.includes(m.key) ? m.color : '#555' }} />
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            {METRICS.map((m) => (
              <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={m.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={m.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#888' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--card-foreground)',
            }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
          />
          {METRICS.filter((m) => active.includes(m.key)).map((m) => (
            <Area
              key={m.key}
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.color}
              fill={`url(#grad-${m.key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: m.color }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
