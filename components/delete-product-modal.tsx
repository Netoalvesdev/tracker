'use client'

import { useState } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'

interface Props {
  productId: string
  productName: string
  onClose: () => void
}

export function DeleteProductModal({ productId, productName, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deleteProduct = useStore((s) => s.deleteProduct)

  const handleConfirm = async () => {
    if (step === 1) {
      setStep(2)
      return
    }
    if (typed !== productName) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        throw new Error(data?.message ?? data?.error ?? 'Erro ao apagar produto no Supabase')
      }

      deleteProduct(productId)
      onClose()
    } catch (error) {
      console.error('Erro ao apagar produto:', error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-negative">
            <AlertTriangle size={18} />
            <h2 className="text-base font-semibold">Excluir dashboard</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {step === 1 ? (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Tem certeza que deseja apagar o dashboard{' '}
              <span className="text-foreground font-medium">{productName}</span>?{' '}
              Todos os eventos serão removidos permanentemente.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg bg-negative/90 text-white text-sm font-semibold hover:bg-negative transition-colors"
              >
                Continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              Para confirmar, digite exatamente:
            </p>
            <p className="text-xs font-mono bg-muted rounded px-2 py-1.5 text-foreground mb-3 break-all">{productName}</p>
            <input
              autoFocus
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Digite o nome exato..."
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-negative mb-4"
            />

            {error && (
              <p className="text-xs text-negative bg-negative/10 border border-negative/30 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={typed !== productName || loading}
                className="flex-1 py-2.5 rounded-lg bg-negative/90 text-white text-sm font-semibold disabled:opacity-40 hover:bg-negative transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Apagar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
