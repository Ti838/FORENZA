'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const themeRef = useRef<Theme>('system')

  const applyTheme = useCallback((t: Theme) => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    let effective: 'light' | 'dark' = 'dark'

    if (t === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      effective = isSystemDark ? 'dark' : 'light'
    } else {
      effective = t
    }

    if (effective === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
      root.style.colorScheme = 'light'
    }

    setResolvedTheme(effective)
  }, [])

  useEffect(() => {
    const stored = (localStorage.getItem('forenza-theme') as Theme) || 'system'
    themeRef.current = stored
    setThemeState(stored)
    applyTheme(stored)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      if (themeRef.current === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleMediaChange)
    return () => mediaQuery.removeEventListener('change', handleMediaChange)
  }, [applyTheme])

  const setTheme = (newTheme: Theme) => {
    themeRef.current = newTheme
    setThemeState(newTheme)
    localStorage.setItem('forenza-theme', newTheme)
    applyTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
