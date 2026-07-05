'use client'

import { FunnelMetrics } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ConversionItem {
  label: string
  rate: number
  numerator: number
  denominator: number
}

interface Props {
  metrics: FunnelMetrics
}

export function ConversionPanel({ metrics }: Props) {
  const { counts, conversionFront, conversionOrderBump, conversionDownsellFront,
    conversionUpsell1, conversionUpsell2, conversionDownsellUpsell1, conversionDownsellUpsell2 } = metrics

  const items: ConversionItem[] = [
    { label: 'Conversão Front', rate: conversionFront, numerator: counts.pagou, denominator: counts.parte_1 },
    { label: 'Conversão Order Bump', rate: conversionOrderBump, numerator: counts.orderbump, denominator: counts.pagou },
    { label: 'Conversão Downsell Front', rate: conversionDownsellFront, numerator: counts.downsell_front, denominator: counts.parte_1 },
    { label: 'Conversão Upsell 1', rate: conversionUpsell1, numerator: counts.upsell_1, denominator: counts.pagou },
    { label: 'Conversão Upsell 2', rate: conversionUpsell2, numerator: counts.upsell_2, denominator: counts.upsell_1 },
    { label: 'Conversão Downsell Upsell 1', rate: conversionDownsellUpsell1, numerator: counts.downsell_upsell_1, denominator: counts.pagou },
    { label: 'Conversão Downsell Upsell 2', rate: conversionDownsellUpsell2, numerator: counts.downsell_upsell_2, denominator: counts.upsell_1 },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">Conversões por oferta</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((item) => {
          const isGood = item.rate >= 10
          const isEmpty = item.denominator === 0

          return (
            <div key={item.label} className="bg-muted rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-2">{item.label}</p>
              {isEmpty ? (
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">0%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">0 pessoas</p>
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-2 mb-2">
                    <p className={cn('text-2xl font-bold', isGood ? 'text-positive' : 'text-foreground')}>
                      {item.rate.toFixed(1)}%
                    </p>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {item.numerator.toLocaleString('pt-BR')} /{' '}
                        {item.denominator.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">pessoas</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(item.rate * 3, 100)}%`,
                        background: isGood ? '#00e676' : '#f59e0b',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
