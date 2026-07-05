'use client'

import { FunnelMetrics, EventType, EVENT_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

// Pre-computed particles at module level — identical on server and client
function makeLcgRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}
const _rand = makeLcgRand(31415)
const PARTICLES = Array.from({ length: 28 }, () => ({
  cx: _rand() * 900,
  cy: 110 + (_rand() - 0.5) * 220 * 0.35,
  r: _rand() * 1.5 + 0.5,
  opacity: _rand() * 0.4 + 0.15,
}))

// Etapas exibidas no funil visual
const FUNNEL_STAGES: { key: EventType; color: string }[] = [
  { key: 'parte_1', color: '#6366f1' },
  { key: 'parte_2', color: '#8b5cf6' },
  { key: 'parte_3', color: '#a855f7' },
  { key: 'pagou', color: '#ec4899' },
  { key: 'upsell_1', color: '#f97316' },
  { key: 'upsell_2', color: '#f59e0b' },
]

interface ThermalSVGProps {
  stages: { count: number }[]
}

function ThermalFunnelSVG({ stages }: ThermalSVGProps) {
  const max = Math.max(stages[0]?.count || 1, 1)
  const W = 900
  const H = 220
  const n = stages.length

  const points = stages.map((s, i) => ({
    x: n === 1 ? W / 2 : (i / (n - 1)) * W,
    halfH: (s.count / max) * (H * 0.46),
  }))

  const buildPath = (pts: typeof points, upper: boolean) => {
    const cy = H / 2
    if (pts.length === 1) {
      const p = pts[0]
      const y = cy + (upper ? -1 : 1) * p.halfH
      return `M ${p.x} ${y}`
    }
    let d = `M ${pts[0].x} ${cy + (upper ? -1 : 1) * pts[0].halfH}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const cpX = (prev.x + curr.x) / 2
      d += ` C ${cpX} ${cy + (upper ? -1 : 1) * prev.halfH}, ${cpX} ${cy + (upper ? -1 : 1) * curr.halfH}, ${curr.x} ${cy + (upper ? -1 : 1) * curr.halfH}`
    }
    return d
  }

  const upperPath = buildPath(points, true)
  const reverseLower = (() => {
    const cy = H / 2
    let d = `L ${points[points.length - 1].x} ${cy + points[points.length - 1].halfH}`
    for (let i = points.length - 2; i >= 0; i--) {
      const curr = points[i + 1]
      const prev = points[i]
      const cpX = (prev.x + curr.x) / 2
      d += ` C ${cpX} ${cy + curr.halfH}, ${cpX} ${cy + prev.halfH}, ${prev.x} ${cy + prev.halfH}`
    }
    return d + ' Z'
  })()

  const fillPath = upperPath + ' ' + reverseLower

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="none"
      style={{ display: 'block', height: '200px' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="thermalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="25%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="70%" stopColor="#ec4899" />
          <stop offset="85%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="thermalGradGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={fillPath} fill="url(#thermalGradGlow)" />
      <path d={fillPath} fill="url(#thermalGrad)" opacity="0.85" />
      <path d={upperPath} fill="none" stroke="url(#thermalGrad)" strokeWidth="1.5" opacity="0.6" filter="url(#glow)" />
      <path d={buildPath(points, false)} fill="none" stroke="url(#thermalGrad)" strokeWidth="1.5" opacity="0.6" filter="url(#glow)" />
      {PARTICLES.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="white" opacity={p.opacity} />
      ))}
    </svg>
  )
}

interface Props {
  metrics: FunnelMetrics
}

export function ThermalFunnel({ metrics }: Props) {
  const { counts, biggestBottleneck } = metrics
  const stages = FUNNEL_STAGES.map((s) => ({ ...s, count: counts[s.key] }))
  const entry = stages[0]?.count || 1

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="mb-1">
        <p className="text-xs text-brand font-semibold uppercase tracking-widest">Visão de Águia</p>
        <h2 className="text-base font-semibold text-foreground">A jornada térmica da sua operação</h2>
      </div>

      <div className="mt-4">
        <ThermalFunnelSVG stages={stages} />
      </div>

      {/* Frio / Quente legend */}
      <div className="flex items-center justify-between mt-2 px-1 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
          <span className="text-xs font-semibold text-[#6366f1] tracking-widest uppercase">Frio</span>
        </div>
        <div className="flex-1 mx-3 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right,#6366f1,#8b5cf6,#ec4899,#f97316,#f59e0b)' }} />
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#f59e0b] tracking-widest uppercase">Quente</span>
          <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
        </div>
      </div>

      {/* Stage cards */}
      <div className="flex gap-2 flex-wrap">
        {stages.map((stage, i) => {
          const prevCount = i === 0 ? entry : stages[i - 1].count
          const pctOfEntry = entry > 0 ? ((stage.count / entry) * 100).toFixed(1) : '0'
          const pctOfPrev = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : '100'
          const isBottleneck = biggestBottleneck === stage.key
          const drop = prevCount > 0 ? prevCount - stage.count : 0

          return (
            <div
              key={stage.key}
              className={cn(
                'flex-1 min-w-[120px] bg-muted rounded-xl p-3 border',
                isBottleneck ? 'border-negative/40' : 'border-transparent'
              )}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                <span className="text-xs text-muted-foreground truncate">{EVENT_LABELS[stage.key]}</span>
                {isBottleneck && (
                  <span className="ml-auto text-xs text-negative font-medium flex-shrink-0">gargalo</span>
                )}
              </div>
              <p className="text-xl font-bold text-foreground">{stage.count.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pctOfPrev}% da anterior</p>
              <p className="text-xs text-muted-foreground">{pctOfEntry}% do total</p>
              {i > 0 && drop > 0 && (
                <p className="text-xs text-negative mt-0.5">-{drop.toLocaleString('pt-BR')} pessoas</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
