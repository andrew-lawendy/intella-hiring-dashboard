import { useEffect, useState } from 'react'

type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'intella_theme'

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement
  if (preference === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', preference)
  }
}

const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
applyTheme(saved ?? 'system')

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemePreference) ?? 'system',
  )

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (next: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
    applyTheme(next)
  }

  return { theme, setTheme }
}
