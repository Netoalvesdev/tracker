'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const PERIODS = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'custom', label: 'Personalizado' },
] as const

interface Props {
  title: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: Props) {
  const { period, setPeriod, customRange, setCustomRange } = useStore()
  const [showCustom, setShowCustom] = useState(period === 'custom')

  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPeriod(p.key)
                setShowCustom(p.key === 'custom')
              }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                period === p.key
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {showCustom && (
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
            <Calendar size={13} className="text-muted-foreground" />
            <input
              type="date"
              value={customRange.from}
              onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
              className="bg-transparent text-xs text-foreground focus:outline-none"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
              className="bg-transparent text-xs text-foreground focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}
