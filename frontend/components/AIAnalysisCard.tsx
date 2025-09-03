'use client'

import { useState } from 'react'
import { Brain, Plus, X, Printer, Copy, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

interface AIAnalysisCardProps {
  type: 'progress' | 'exercise' | 'global'
  title: string
  content: string
  childName: string
  isExpanded: boolean
  onToggle: () => void
  onClose: () => void
  showDate?: boolean
}

export default function AIAnalysisCard({ 
  type, 
  title, 
  content, 
  childName, 
  isExpanded, 
  onToggle, 
  onClose,
  showDate = true
}: AIAnalysisCardProps) {
  const [copied, setCopied] = useState(false)

  const getCardStyle = () => {
    switch (type) {
      case 'progress':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900'
      case 'exercise':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-900'
      case 'global':
        return 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 text-purple-900'
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-900'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'progress':
        return <Brain className="w-4 h-4" />
      case 'exercise':
        return <Plus className="w-4 h-4" />
      case 'global':
        return <Brain className="w-4 h-4" />
      default:
        return <Brain className="w-4 h-4" />
    }
  }

  const copyToClipboard = async () => {
    try {
      const textToCopy = `${title}\n\n${content}\n\nAnalyse générée le ${new Date().toLocaleString('fr-FR')}`
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
    }
  }

  const printAnalysis = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Analyse ${childName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .subtitle { font-size: 14px; color: #666; }
              .content { line-height: 1.6; white-space: pre-wrap; }
              .footer { margin-top: 30px; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${title}</div>
              <div class="subtitle">Analyse pour ${childName}</div>
            </div>
            <div class="content">${content}</div>
            <div class="footer">
              Généré le ${new Date().toLocaleString('fr-FR')} par Katiopa
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className={`mb-4 rounded-lg border ${getCardStyle()} shadow-sm`}>
      {/* En-tête avec boutons */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm opacity-75">Analyse pour {childName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bouton d'impression */}
          <button
            onClick={printAnalysis}
            className="p-2 rounded-md hover:bg-white/50 transition-colors"
            title="Imprimer"
          >
            <Printer className="w-4 h-4" />
          </button>
          
          {/* Bouton de copie */}
          <button
            onClick={copyToClipboard}
            className="p-2 rounded-md hover:bg-white/50 transition-colors"
            title={copied ? "Copié !" : "Copier"}
          >
            <Copy className="w-4 h-4" />
          </button>
          
          {/* Date et heure */}
          {showDate && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/30 rounded-md text-xs">
              <Calendar className="w-3 h-3" />
              <span>{new Date().toLocaleString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          )}
          
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/50 transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-4 pb-4">
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}
