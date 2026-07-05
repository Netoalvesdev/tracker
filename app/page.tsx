'use client'

import { useEffect } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Sidebar } from '@/components/sidebar'
import { ProductDashboard } from '@/components/product-dashboard'
import { OverviewDashboard } from '@/components/overview-dashboard'
import { useStore } from '@/lib/store'
import { productFromRow, webhookEventFromRow, ProductRow, WebhookEvent, WebhookEventRow } from '@/lib/types'

function AppContent() {
  const activeProductId = useStore((s) => s.activeProductId)
  const setProducts = useStore((s) => s.setProducts)
  const setEvents = useStore((s) => s.setEvents)

  useEffect(() => {
    let cancelled = false

    async function loadProductsFromSupabase() {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data.success) {
          console.error('Erro ao carregar produtos:', data?.message ?? res.statusText)
          if (!cancelled) setProducts([])
          return
        }

        const products = (data.products ?? []).map((row: ProductRow) => productFromRow(row))
        if (cancelled) return

        setProducts(products)

        await Promise.all(
          products.map(async (product) => {
            try {
              const eventsRes = await fetch(`/api/products/${product.id}`, { cache: 'no-store' })
              const eventsData = await eventsRes.json().catch(() => ({}))
              if (!eventsRes.ok || !eventsData.success) return

              const events = (eventsData.events ?? [])
                .map((row: WebhookEventRow) => webhookEventFromRow(row))
                .filter((event: WebhookEvent | null): event is WebhookEvent => event !== null)

              if (!cancelled) setEvents(product.id, events)
            } catch (error) {
              console.error(`Erro ao carregar eventos do produto ${product.id}:`, error)
            }
          })
        )
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        if (!cancelled) setProducts([])
      }
    }

    loadProductsFromSupabase()

    return () => {
      cancelled = true
    }
  }, [setProducts, setEvents])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {activeProductId === null ? <OverviewDashboard /> : <ProductDashboard />}
    </div>
  )
}

export default function Page() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
