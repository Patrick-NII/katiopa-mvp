'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BUBIX_THEMES } from '@/lib/services/bubix-service'

interface BubixThemedContainerProps {
  children: React.ReactNode
  userType: 'PARENT' | 'CHILD'
  className?: string
  variant?: 'card' | 'modal' | 'button' | 'input'
}

/**
 * 🎨 Container thématisé pour les composants Bubix
 * Applique automatiquement le thème selon le type d'utilisateur
 */
export default function BubixThemedContainer({ 
  children, 
  userType, 
  className = '', 
  variant = 'card' 
}: BubixThemedContainerProps) {
  const theme = userType === 'CHILD' ? 'child' : 'parent'
  const themeConfig = BUBIX_THEMES[theme]

  const getVariantClasses = () => {
    const baseClasses = {
      card: `
        ${themeConfig.backgroundColor} 
        backdrop-blur-xl 
        rounded-2xl 
        shadow-xl 
        border 
        ${theme === 'child' ? 'border-emerald-200/50' : 'border-blue-200/50'}
        overflow-hidden
      `,
      modal: `
        ${themeConfig.backgroundColor} 
        backdrop-blur-xl 
        rounded-3xl 
        shadow-2xl 
        border 
        ${theme === 'child' ? 'border-emerald-300/50' : 'border-blue-300/50'}
        overflow-hidden
      `,
      button: `
        bg-gradient-to-r 
        ${themeConfig.primaryColor} 
        hover:scale-105 
        text-white 
        font-medium 
        rounded-xl 
        transition-all 
        duration-200 
        shadow-lg 
        hover:shadow-xl
      `,
      input: `
        border-2 
        ${theme === 'child' ? 'border-emerald-200 focus:border-emerald-500' : 'border-blue-200 focus:border-blue-500'}
        rounded-xl 
        ${theme === 'child' ? 'bg-emerald-50/30' : 'bg-blue-50/30'}
        focus:outline-none 
        focus:ring-2 
        ${theme === 'child' ? 'focus:ring-emerald-500' : 'focus:ring-blue-500'}
        transition-all
      `
    }

    return baseClasses[variant] || baseClasses.card
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${getVariantClasses()} ${className}`}
      style={{
        background: theme === 'child' 
          ? 'linear-gradient(135deg, #fef3c7 0%, #ecfdf5 50%, #dbeafe 100%)'
          : undefined
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * 🎯 Hook pour obtenir les classes CSS du thème actuel
 */
export function useBubixTheme(userType: 'PARENT' | 'CHILD') {
  const theme = userType === 'CHILD' ? 'child' : 'parent'
  const themeConfig = BUBIX_THEMES[theme]

  return {
    theme,
    themeConfig,
    getButtonClasses: (size: 'sm' | 'md' | 'lg' = 'md') => {
      const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
      }
      
      return `
        bg-gradient-to-r 
        ${themeConfig.primaryColor} 
        hover:scale-105 
        text-white 
        font-medium 
        rounded-xl 
        transition-all 
        duration-200 
        shadow-lg 
        hover:shadow-xl
        ${sizeClasses[size]}
      `
    },
    getCardClasses: () => `
      ${themeConfig.backgroundColor} 
      backdrop-blur-xl 
      rounded-2xl 
      shadow-xl 
      border 
      ${theme === 'child' ? 'border-emerald-200/50' : 'border-blue-200/50'}
      ${themeConfig.textColor}
    `,
    getInputClasses: () => `
      border-2 
      ${theme === 'child' ? 'border-emerald-200 focus:border-emerald-500' : 'border-blue-200 focus:border-blue-500'}
      rounded-xl 
      ${theme === 'child' ? 'bg-emerald-50/30' : 'bg-blue-50/30'}
      focus:outline-none 
      focus:ring-2 
      ${theme === 'child' ? 'focus:ring-emerald-500' : 'focus:ring-blue-500'}
      transition-all
      ${themeConfig.textColor}
    `,
    getIconColor: () => theme === 'child' ? 'text-emerald-600' : 'text-blue-600',
    getAccentColor: () => theme === 'child' ? 'emerald' : 'blue'
  }
}

