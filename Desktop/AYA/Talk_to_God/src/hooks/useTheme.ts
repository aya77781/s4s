import { useCallback, useEffect, useState } from 'react'

const THEME_KEY = 'ayah-theme'
type Theme = 'light' | 'dark'

/** Gère le thème clair/sombre, persisté en localStorage et appliqué sur <html>. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
    // Par défaut : on respecte la préférence système.
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
