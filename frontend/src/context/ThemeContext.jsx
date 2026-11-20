import { createContext, useContext, useEffect, useState, useMemo } from 'react'

const THEME_STORAGE_KEY = 'campushub_theme'

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function getStoredTheme() {
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY)
    if (val === 'light' || val === 'dark' || val === 'system') {
      return val
    }
  } catch {
    // localStorage may be disabled or restricted in private browsing
  }
  return 'system'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getStoredTheme())
  const [systemTheme, setSystemTheme] = useState(() => getSystemTheme())

  // Listen to system preference changes when in system mode
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    try {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } catch {
      try {
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      } catch {
        // Ignored
      }
    }
  }, [])

  const resolvedTheme = useMemo(() => {
    if (theme === 'system') return systemTheme
    return theme === 'dark' ? 'dark' : 'light'
  }, [theme, systemTheme])

  // Synchronize documentElement attributes and colorScheme
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.setAttribute('data-theme', resolvedTheme)
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [resolvedTheme])

  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') {
      return
    }
    setThemeState(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch {
      // Storage access error handling
    }
  }

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
