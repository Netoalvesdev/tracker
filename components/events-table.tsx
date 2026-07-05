'use client'

import { useState } from 'react'
import { Search, Download, X, ChevronDown, ChevronUp } from 'lucide-react'
import { WebhookEvent, EventType, ALLOWED_EVENT_TYPES, EVENT_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function exportCSV(events: WebhookEvent[], productName: string) {
  const headers = ['Data/Hora', 'Etapa', 'Lead ID', 'Telefone', 'Nome', 'E-mail', 'Origem', 'Campanha', 'Criativo', 'Teste']
  const rows = events.map((e) => [
    formatDate(e.createdAt),
    EVENT_LABELS[e.eventType],
    e.leadId ?? '',
    e.phone ?? '',
    e.name ?? '',
    e.email ?? '',
    e.source ?? '',
    e.campaign ?? '',
    e.creative ?? '',
    e.isTest ? 'Sim' : 'Não',
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${productName.replace(/\s+/g, '_')}_eventos.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface PayloadModalProps {
  event: WebhookEvent
  onClose: () => void
}

function PayloadModal({ event, onClose }: PayloadModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Payload do evento</p>
            <p className="text-xs text-muted-foreground">{EVENT_LABELS[event.eventType]} · {formatDate(event.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <pre className="bg-muted rounded-lg p-3 text-xs text-foreground overflow-auto max-h-80 font-mono">
          {JSON.stringify(event.payload ?? {}, null, 2)}
        </pre>
      </div>
    </div>
  )
}

interface Props {
  events: WebhookEvent[]
  productName: string
}

export function EventsTable({ events, productName }: Props) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<EventType | 'all'>('all')
  const [expandedPayload, setExpandedPayload] = useState<WebhookEvent | null>(null)
  const [sortDesc, setSortDesc] = useState(true)

  const filtered = events
    .filter((e) => {
      if (stageFilter !== 'all' && e.eventType !== stageFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          e.leadId?.toLowerCase().includes(q) ||
          e.phone?.toLowerCase().includes(q) ||
          e.name?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDesc ? -diff : diff
    })

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Eventos Recebidos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} de {events.length} evento{events.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por telefone, nome..."
              className="pl-8 pr-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand w-52"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Stage filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as EventType | 'all')}
            className="bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">Todas as etapas</option>
            {ALLOWED_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{EVENT_LABELS[t]}</option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={() => exportCSV(filtered, productName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-muted border border-border hover:border-brand/40 transition-colors"
          >
            <Download size={12} />
            CSV
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-2">Nenhum evento recebido ainda.</p>
          <p className="text-xs text-muted-foreground">Copie os webhooks deste produto e coloque nas etapas do seu fluxo de WhatsApp.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Nenhum evento encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th
                  className="pb-2 text-left text-muted-foreground font-medium pr-3 cursor-pointer hover:text-foreground select-none"
                  onClick={() => setSortDesc(!sortDesc)}
                >
                  <span className="flex items-center gap-1">
                    Data/Hora
                    {sortDesc ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                  </span>
                </th>
                {['Etapa', 'Lead ID', 'Telefone', 'Nome', 'Campanha', 'Payload'].map((h) => (
                  <th key={h} className="pb-2 text-left text-muted-foreground font-medium pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 200).map((ev) => (
                <tr key={ev.id} className={cn('hover:bg-muted/50 transition-colors', ev.isTest && 'opacity-60')}>
                  <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{formatDate(ev.createdAt)}</td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-muted border border-border">
                      {EVENT_LABELS[ev.eventType]}
                    </span>
                    {ev.isTest && <span className="ml-1 text-muted-foreground text-xs">(teste)</span>}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground font-mono">{ev.leadId ?? '—'}</td>
                  <td className="py-2 pr-3 text-muted-foreground font-mono">{ev.phone ?? '—'}</td>
                  <td className="py-2 pr-3 text-foreground">{ev.name ?? '—'}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{ev.campaign ?? '—'}</td>
                  <td className="py-2">
                    <button
                      onClick={() => setExpandedPayload(ev)}
                      className="text-brand hover:underline"
                    >
                      ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Mostrando 200 de {filtered.length} eventos. Use filtros para refinar.
            </p>
          )}
        </div>
      )}

      {expandedPayload && (
        <PayloadModal event={expandedPayload} onClose={() => setExpandedPayload(null)} />
      )}
    </div>
  )
}
