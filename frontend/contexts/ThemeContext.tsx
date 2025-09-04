'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
  isLight: boolean
  isAuto: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('auto')
  const [isDark, setIsDark] = useState(false)

  // Détecter la préférence système
  const getSystemTheme = (): boolean => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Appliquer le thème
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    const isDarkMode = newTheme === 'dark' || (newTheme === 'auto' && getSystemTheme())

    if (isDarkMode) {
      root.classList.add('dark')
      setIsDark(true)
    } else {
      root.classList.remove('dark')
      setIsDark(false)
    }

    // Sauvegarder dans localStorage
    localStorage.setItem('theme', newTheme)
  }

  // Initialiser le thème
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'auto'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  // Écouter les changements de préférence système
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('auto')
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Gérer le changement de thème
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  const value: ThemeContextType = {
    theme,
    setTheme: handleThemeChange,
    isDark,
    isLight: !isDark,
    isAuto: theme === 'auto'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
