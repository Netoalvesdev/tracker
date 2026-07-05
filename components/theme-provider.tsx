'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
    }
  }, [theme])

  return <>{children}</>
}
