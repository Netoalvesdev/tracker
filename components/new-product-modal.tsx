'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { productFromRow, ProductRow } from '@/lib/types'

interface Props {
  onClose: () => void
}

export function NewProductModal({ onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const upsertProduct = useStore((s) => s.upsertProduct)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success || !data.product) {
        throw new Error(data?.message ?? data?.error ?? 'Erro ao criar produto no Supabase')
      }

      const product = productFromRow(data.product as ProductRow)
      upsertProduct(product)
      onClose()
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Novo Produto</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Nome do produto / oferta</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Método Acelerador 2.0"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Descrição <span className="text-muted-foreground/60">(opcional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição breve do produto..."
              rows={2}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-negative bg-negative/10 border border-negative/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Criar dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
