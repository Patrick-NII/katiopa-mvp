'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, RefreshCw } from 'lucide-react'
import { useBubixTheme } from './BubixThemedContainer'

interface BubixActionButtonProps {
  onClick: () => void | Promise<void>
  children: React.ReactNode
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  userType: 'PARENT' | 'CHILD'
  className?: string
  title?: string
}

/**
 * 🎯 Bouton Bubix thématisé et actionnable
 * S'adapte automatiquement au type d'utilisateur (parent/enfant)
 */
export default function BubixActionButton({
  onClick,
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  userType,
  className = '',
  title
}: BubixActionButtonProps) {
  const { theme, themeConfig, getButtonClasses } = useBubixTheme(userType)

  const getVariantClasses = () => {
    const baseClasses = getButtonClasses(size)
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} ${themeConfig.primaryColor}`
      case 'secondary':
        return `px-4 py-2 border-2 ${theme === 'child' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-blue-300 text-blue-700 hover:bg-blue-50'} rounded-xl transition-all duration-200 font-medium`
      case 'success':
        return `px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:scale-105 transition-all shadow-lg`
      case 'warning':
        return `px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-medium hover:scale-105 transition-all shadow-lg`
      default:
        return baseClasses
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm px-3 py-1.5'
      case 'lg':
        return 'text-lg px-6 py-3'
      default:
        return 'text-base px-4 py-2'
    }
  }

  const handleClick = async () => {
    if (disabled || loading) return
    
    try {
      await onClick()
    } catch (error) {
      console.error('Erreur lors du clic sur le bouton Bubix:', error)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
      className={`
        inline-flex items-center gap-2 
        ${getVariantClasses()} 
        ${getSizeClasses()}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      
      <span>{children}</span>
      
      {userType === 'CHILD' && variant === 'primary' && !loading && (
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-yellow-300"
        >
          ✨
        </motion.span>
      )}
    </motion.button>
  )
}

/**
 * 📋 Bouton spécialisé pour les comptes rendus Bubix
 */
export function BubixCompteRenduButton({
  sessionId,
  sessionName,
  onGenerate,
  loading = false,
  userType
}: {
  sessionId: string
  sessionName: string
  onGenerate: (sessionId: string) => void | Promise<void>
  loading?: boolean
  userType: 'PARENT' | 'CHILD'
}) {
  return (
    <BubixActionButton
      onClick={() => onGenerate(sessionId)}
      loading={loading}
      userType={userType}
      variant="primary"
      title={userType === 'CHILD' 
        ? `Créer mon super rapport d'apprentissage !`
        : `Générer le compte rendu pour ${sessionName}`
      }
    >
      {userType === 'CHILD' ? '🎯 Mon rapport' : '📊 Compte rendu'}
    </BubixActionButton>
  )
}

/**
 * 💬 Bouton spécialisé pour les conversations Bubix
 */
export function BubixChatButton({
  onOpenChat,
  unreadCount = 0,
  userType
}: {
  onOpenChat: () => void
  unreadCount?: number
  userType: 'PARENT' | 'CHILD'
}) {
  return (
    <BubixActionButton
      onClick={onOpenChat}
      userType={userType}
      variant="secondary"
      className="relative"
      title={userType === 'CHILD' 
        ? 'Parler avec Bubix !'
        : 'Ouvrir la conversation avec Bubix'
      }
    >
      {userType === 'CHILD' ? '💬 Bubix' : '🤖 Assistant'}
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </BubixActionButton>
  )
}

/**
 * ⚙️ Bouton spécialisé pour les analyses avancées
 */
export function BubixAnalysisButton({
  analysisType,
  onAnalyze,
  loading = false,
  userType,
  disabled = false
}: {
  analysisType: 'competence' | 'global' | 'exercise'
  onAnalyze: () => void | Promise<void>
  loading?: boolean
  userType: 'PARENT' | 'CHILD'
  disabled?: boolean
}) {
  const getAnalysisText = () => {
    if (userType === 'CHILD') {
      switch (analysisType) {
        case 'competence':
          return '🎯 Mes compétences'
        case 'global':
          return '🌟 Vue d\'ensemble'
        case 'exercise':
          return '💪 Mes exercices'
        default:
          return '🔍 Analyser'
      }
    } else {
      switch (analysisType) {
        case 'competence':
          return '🎯 Analyse des compétences'
        case 'global':
          return '📊 Analyse globale'
        case 'exercise':
          return '📝 Recommandations d\'exercices'
        default:
          return '🔍 Analyser'
      }
    }
  }

  return (
    <BubixActionButton
      onClick={onAnalyze}
      loading={loading}
      disabled={disabled}
      userType={userType}
      variant="primary"
      size="sm"
    >
      {getAnalysisText()}
    </BubixActionButton>
  )
}

