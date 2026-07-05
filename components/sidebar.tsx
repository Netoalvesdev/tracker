'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Plus, Trash2, ChevronDown, ChevronRight, Copy, Check,
  Webhook, BarChart3, Sun, Moon,
} from 'lucide-react'
import { useStore, buildWebhookUrls } from '@/lib/store'
import { cn } from '@/lib/utils'
import { NewProductModal } from './new-product-modal'
import { DeleteProductModal } from './delete-product-modal'

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

export function Sidebar() {
  const { products, activeProductId, setActiveProduct, theme, setTheme } = useStore()
  const [expandedIds, setExpandedIds] = useState<string[]>([activeProductId ?? ''])
  const [showNewModal, setShowNewModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const toggle = (id: string) =>
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleCopy = async (url: string) => {
    await copyText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 1500)
  }

  return (
    <>
      <aside className="flex flex-col w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fbb2fdc7-f8d3-4ffc-8363-0bce97c8a39d-zl2Hfl4tGKgBrv3MQvXIriNxbMu0Ya.png"
            alt="Tracker WhatsApp logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Tracker</p>
            <p className="text-xs text-brand font-semibold leading-tight">WhatsApp</p>
          </div>
        </div>

        {/* Visão Geral */}
        <button
          onClick={() => setActiveProduct(null)}
          className={cn(
            'flex items-center gap-2.5 px-4 py-3 text-sm transition-colors text-left',
            activeProductId === null
              ? 'bg-brand/10 text-brand font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          <BarChart3 size={16} />
          Visão Geral
        </button>

        {/* Novo produto */}
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 mx-3 mt-3 mb-2 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          Novo Produto
        </button>

        {/* Empty state */}
        {products.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center pb-8">
            <Webhook size={24} className="text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Crie seu primeiro produto para começar a rastrear seu funil.
            </p>
          </div>
        )}

        {/* Produtos list */}
        {products.length > 0 && (
          <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
            {products.map((product) => {
              const isActive = product.id === activeProductId
              const isExpanded = expandedIds.includes(product.id)
              const webhooks = buildWebhookUrls(product)
              return (
                <div key={product.id}>
                  <div
                    className={cn(
                      'flex items-center gap-1 rounded-lg group',
                      isActive ? 'bg-accent' : 'hover:bg-accent'
                    )}
                  >
                    <button
                      onClick={() => {
                        setActiveProduct(product.id)
                        if (!expandedIds.includes(product.id)) toggle(product.id)
                      }}
                      className="flex-1 flex items-center gap-2 px-2 py-2.5 text-sm text-left min-w-0"
                    >
                      <span
                        className={cn(
                          'truncate',
                          isActive ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        {product.name}
                      </span>
                    </button>
                    <button
                      onClick={() => toggle(product.id)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      aria-label="Expandir webhooks"
                    >
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                      className="p-1.5 text-muted-foreground hover:text-negative transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                      aria-label="Excluir produto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Webhooks */}
                  {isExpanded && (
                    <div className="ml-3 mt-0.5 mb-1 border-l border-sidebar-border pl-2 space-y-0.5">
                      {webhooks.map((wh) => (
                        <div key={wh.eventType} className="flex items-center gap-1 group/wh py-0.5">
                          <Webhook size={10} className="text-brand flex-shrink-0" />
                          <span className="flex-1 text-xs text-muted-foreground truncate">{wh.label}</span>
                          <button
                            onClick={() => handleCopy(wh.url)}
                            className="opacity-0 group-hover/wh:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-brand"
                            title="Copiar URL"
                          >
                            {copiedUrl === wh.url ? <Check size={11} className="text-brand" /> : <Copy size={11} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        )}

        {/* Theme toggle */}
        <div className="px-4 py-4 border-t border-sidebar-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tema</span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </button>
        </div>
      </aside>

      {showNewModal && <NewProductModal onClose={() => setShowNewModal(false)} />}
      {deleteTarget && (
        <DeleteProductModal
          productId={deleteTarget.id}
          productName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
