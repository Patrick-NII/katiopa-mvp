'use client'

import { useState, useEffect } from 'react'
import { Brain, Loader2 } from 'lucide-react'

interface AIWritingAnimationProps {
  isWriting: boolean
  childName: string
  analysisType: 'compte_rendu' | 'appreciation' | 'conseils' | 'vigilance'
}

export default function AIWritingAnimation({ isWriting, childName, analysisType }: AIWritingAnimationProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isWriting) return

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [isWriting])

  if (!isWriting) return null

  const getMessage = () => {
    switch (analysisType) {
      case 'compte_rendu':
        return `Je rédige un compte rendu précis pour ${childName}`
      case 'appreciation':
        return `J'analyse en détail les performances de ${childName}`
      case 'conseils':
        return `Je prépare des conseils personnalisés pour ${childName}`
      case 'vigilance':
        return `Je surveille les alertes et la vigilance pour ${childName}`
      default:
        return `Je réfléchis à propos de ${childName}`
    }
  }

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
          <Loader2 className="w-3 h-3 text-blue-400 absolute -top-1 -right-1 animate-spin" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">
            {getMessage()}
            <span className="text-blue-600 font-bold">{dots}</span>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            L'IA pédagogique rédige une analyse personnalisée...
          </p>
        </div>
      </div>
    </div>
  )
}

