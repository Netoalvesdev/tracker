'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, WebhookEvent, ALLOWED_EVENT_TYPES, EVENT_LABELS } from './types'

// Gera URLs de webhook para um produto usando sempre o ID real salvo no Supabase
export function buildWebhookUrls(product: Product, baseUrl?: string) {
  const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.vercel.app')
  return ALLOWED_EVENT_TYPES.map((eventType) => ({
    eventType,
    label: EVENT_LABELS[eventType],
    url: `${base}/api/webhooks/${product.id}/${eventType}?secret=${product.webhookSecret}`,
  }))
}

interface AppStore {
  // Dados vindos do Supabase
  products: Product[]
  events: WebhookEvent[]
  activeProductId: string | null
  // Preferências de UI persistidas no localStorage
  theme: 'dark' | 'light'
  period: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom'
  customRange: { from: string; to: string }
  countMode: 'unique' | 'total'
  // Actions
  setTheme: (theme: 'dark' | 'light') => void
  setActiveProduct: (id: string | null) => void
  setPeriod: (period: AppStore['period']) => void
  setCustomRange: (range: { from: string; to: string }) => void
  setCountMode: (mode: 'unique' | 'total') => void
  setProducts: (products: Product[]) => void
  upsertProduct: (product: Product) => void
  deleteProduct: (id: string) => void
  setEvents: (productId: string, events: WebhookEvent[]) => void
  addEvent: (event: WebhookEvent) => void
  clearTestEvents: (productId: string) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      products: [],
      events: [],
      activeProductId: null,
      theme: 'dark',
      period: '30d',
      customRange: { from: '', to: '' },
      countMode: 'unique',

      setTheme: (theme) => set({ theme }),
      setActiveProduct: (id) => set({ activeProductId: id }),
      setPeriod: (period) => set({ period }),
      setCustomRange: (range) => set({ customRange: range }),
      setCountMode: (mode) => set({ countMode: mode }),

      setProducts: (products) =>
        set((s) => {
          const productIds = new Set(products.map((p) => p.id))
          const activeProductId =
            s.activeProductId && productIds.has(s.activeProductId)
              ? s.activeProductId
              : products[0]?.id ?? null

          return {
            products,
            activeProductId,
            events: s.events.filter((e) => productIds.has(e.productId)),
          }
        }),

      upsertProduct: (product) =>
        set((s) => {
          const exists = s.products.some((p) => p.id === product.id)
          return {
            products: exists
              ? s.products.map((p) => (p.id === product.id ? product : p))
              : [product, ...s.products],
            activeProductId: product.id,
          }
        }),

      deleteProduct: (id) =>
        set((s) => {
          const remaining = s.products.filter((p) => p.id !== id)
          return {
            products: remaining,
            events: s.events.filter((e) => e.productId !== id),
            activeProductId: s.activeProductId === id ? remaining[0]?.id ?? null : s.activeProductId,
          }
        }),

      setEvents: (productId, events) =>
        set((s) => ({
          events: [
            ...s.events.filter((e) => e.productId !== productId),
            ...events,
          ],
        })),

      addEvent: (event) =>
        set((s) => ({ events: [event, ...s.events.filter((e) => e.id !== event.id)] })),

      clearTestEvents: (productId) =>
        set((s) => ({
          events: s.events.filter((e) => !(e.productId === productId && e.isTest)),
        })),
    }),
    {
      name: 'tracker-whatsapp-v2',
      // Persistir apenas preferências de UI. Produtos e eventos devem sempre vir do Supabase.
      partialize: (s) => ({
        theme: s.theme,
        period: s.period,
        customRange: s.customRange,
        countMode: s.countMode,
        activeProductId: s.activeProductId,
      }),
      // Impede que produtos/eventos antigos salvos no localStorage voltem para a sidebar.
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppStore> | undefined

        return {
          ...current,
          theme: saved?.theme ?? current.theme,
          period: saved?.period ?? current.period,
          customRange: saved?.customRange ?? current.customRange,
          countMode: saved?.countMode ?? current.countMode,
          activeProductId: typeof saved?.activeProductId === 'string' ? saved.activeProductId : null,
        }
      },
    }
  )
)
