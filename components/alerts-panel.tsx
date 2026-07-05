'use client'

import { Download } from 'lucide-react'
import { Product } from '@/lib/types'

function exportCSV(product: Product) {
  const rows = [
    ['ID', 'Nome', 'Slug', 'Descrição', 'Criado em', 'Ativo'],
    [
      product.id,
      product.name,
      product.slug,
      product.description ?? '',
      product.createdAt,
      product.isActive ? 'Sim' : 'Não',
    ],
  ]
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${product.name.replace(/ /g, '_')}_produto.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  product: Product
}

export function AlertsPanel({ product }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Download size={14} className="text-brand" />
        <h2 className="text-sm font-semibold text-foreground">Exportar produto</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Exporte os dados básicos deste produto. Eventos completos podem ser exportados pela tabela de eventos.
      </p>
      <button
        onClick={() => exportCSV(product)}
        className="flex items-center gap-2 px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        <Download size={14} />
        Baixar CSV
      </button>
    </div>
  )
}
