import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Tracker WhatsApp',
  description: 'Plataforma de tracking de funis de vendas via WhatsApp',
  icons: {
    icon: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fbb2fdc7-f8d3-4ffc-8363-0bce97c8a39d-zl2Hfl4tGKgBrv3MQvXIriNxbMu0Ya.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`bg-background ${inter.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}
