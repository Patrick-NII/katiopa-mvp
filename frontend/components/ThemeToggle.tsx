'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />
      case 'dark':
        return <Moon className="w-4 h-4" />
      case 'auto':
        return <Monitor className="w-4 h-4" />
      default:
        return <Sun className="w-4 h-4" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Mode clair'
      case 'dark':
        return 'Mode sombre'
      case 'auto':
        return 'Mode auto'
      default:
        return 'Mode clair'
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className="fixed top-4 right-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-200 hover:scale-105"
      title={getLabel()}
    >
      {getIcon()}
    </button>
  )
}
