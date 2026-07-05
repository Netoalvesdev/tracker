'use client'

import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStore } from '@/lib/store'
import { calculateMetrics } from '@/lib/metrics'
import { DashboardHeader } from './dashboard-header'
import { cn } from '@/lib/utils'

const COLORS = ['#00e676', '#818cf8', '#f59e0b', '#ec4899', '#f97316']

export function OverviewDashboard() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { products, events } = useStore()

  const productMetrics = useMemo(() =>
    products.map((p) => {
      const productEvents = events.filter((e) => e.productId === p.id)
      const metrics = calculateMetrics(productEvents, true)
      return { product: p, metrics }
    }),
    [products, events]
  )

  const totalLeads = productMetrics.reduce((a, pm) => a + pm.metrics.counts.parte_1, 0)
  const totalBuyers = productMetrics.reduce((a, pm) => a + pm.metrics.counts.pagou, 0)
  const avgConversion = productMetrics.length > 0
    ? productMetrics.reduce((a, pm) => a + pm.metrics.conversionFront, 0) / productMetrics.length
    : 0

  const summaryCards = [
    { label: 'Total no funil', value: totalLeads.toLocaleString('pt-BR'), sub: 'Parte 1 (todos os produtos)' },
    { label: 'Total compraram', value: totalBuyers.toLocaleString('pt-BR'), sub: 'Pagou (todos os produtos)' },
    { label: 'Conversão média', value: `${avgConversion.toFixed(1)}%`, sub: 'Pagou / Parte 1' },
    { label: 'Produtos ativos', value: String(products.length), sub: 'dashboards' },
  ]

  const chartData = productMetrics.map((pm, i) => ({
    name: pm.product.name.split(' ').slice(0, 3).join(' '),
    leads: pm.metrics.counts.parte_1,
    compradores: pm.metrics.counts.pagou,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="flex-1 min-h-screen p-6 overflow-y-auto">
      <DashboardHeader
        title="Visão Geral"
        subtitle={`Consolidado de ${products.length} produto${products.length !== 1 ? 's' : ''}`}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">{c.label}</p>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Comparison chart */}
      {mounted && products.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Comparativo por produto</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28} barGap={4} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--card-foreground)',
                }}
              />
              <Bar dataKey="leads" name="Funil" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="compradores" name="Compraram" radius={[6, 6, 0, 0]} fill="#00e676" fillOpacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Products table */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Resumo por produto</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Produto', 'No funil', 'Compraram', 'Conversão', 'Upsell 1', 'Upsell 2'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium text-muted-foreground pr-4 first:pl-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productMetrics.map(({ product: p, metrics: m }, i) => (
                <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-foreground font-medium text-xs">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-foreground">{m.counts.parte_1.toLocaleString('pt-BR')}</td>
                  <td className="py-3 pr-4 text-xs text-positive">{m.counts.pagou.toLocaleString('pt-BR')}</td>
                  <td className="py-3 pr-4 text-xs">
                    <span className={cn(m.conversionFront >= 5 ? 'text-positive' : 'text-foreground')}>
                      {m.conversionFront.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-foreground">{m.counts.upsell_1.toLocaleString('pt-BR')}</td>
                  <td className="py-3 text-xs text-foreground">{m.counts.upsell_2.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
