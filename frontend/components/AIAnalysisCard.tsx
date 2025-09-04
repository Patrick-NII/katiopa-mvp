'use client'

import { useState } from 'react'
import { Brain, Plus, X, Printer, Copy, Calendar, ChevronDown, ChevronUp, Bookmark, Share2, Download, Star, MessageSquare } from 'lucide-react'

interface AIAnalysisCardProps {
  type: 'progress' | 'exercise' | 'global' | 'compte_rendu' | 'appreciation' | 'conseils'
  title: string
  content: string
  childName: string
  isExpanded: boolean
  onToggle: () => void
  onClose: () => void
  showDate?: boolean
  onSave?: () => void
  onShare?: () => void
  isSaved?: boolean
  rating?: number
  onRate?: (rating: number) => void
}

export default function AIAnalysisCard({ 
  type, 
  title, 
  content, 
  childName, 
  isExpanded, 
  onToggle, 
  onClose,
  showDate = true,
  onSave,
  onShare,
  isSaved = false,
  rating = 0,
  onRate
}: AIAnalysisCardProps) {
  const [copied, setCopied] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [saved, setSaved] = useState(isSaved)
  const [downloaded, setDownloaded] = useState(false)
  const [shared, setShared] = useState(false)
  const [printed, setPrinted] = useState(false)
  const [closed, setClosed] = useState(false)

  const getCardStyle = () => {
    switch (type) {
      case 'progress':
      case 'compte_rendu':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900'
      case 'exercise':
      case 'conseils':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-900'
      case 'global':
      case 'appreciation':
        return 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 text-purple-900'
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-900'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'progress':
      case 'compte_rendu':
        return <Brain className="w-4 h-4" />
      case 'exercise':
      case 'conseils':
        return <Plus className="w-4 h-4" />
      case 'global':
      case 'appreciation':
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

  const downloadAnalysis = () => {
    const blob = new Blob([`${title}\n\n${content}\n\nAnalyse générée le ${new Date().toLocaleString('fr-FR')}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analyse_${childName}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Confirmation visuelle
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const shareAnalysis = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - ${childName}`,
          text: content,
          url: window.location.href
        })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch (error) {
        console.error('Erreur lors du partage:', error)
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API de partage
      copyToClipboard()
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleRate = (newRating: number) => {
    if (onRate) {
      onRate(newRating)
      setShowRating(false)
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
              Généré le ${new Date().toLocaleString('fr-FR')} par CubeAI
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      
      // Confirmation visuelle
      setPrinted(true)
      setTimeout(() => setPrinted(false), 2000)
    }
  }

  const handleClose = () => {
    setClosed(true)
    setTimeout(() => {
      onClose()
    }, 300)
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
          {/* Bouton d'évaluation */}
          <div className="relative">
            <button
              onClick={() => setShowRating(!showRating)}
              className="p-2 rounded-md hover:bg-white/50 transition-colors"
              title="Évaluer cette analyse"
            >
              <Star className={`w-4 h-4 ${rating > 0 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </button>
            
            {/* Menu d'évaluation */}
            {showRating && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border p-2 z-10">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Star className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bouton de sauvegarde */}
          {onSave && (
            <button
              onClick={handleSave}
              className={`p-2 rounded-md transition-colors ${saved ? 'bg-green-100 text-green-600' : 'hover:bg-white/50'}`}
              title={saved ? "Analyse sauvegardée !" : "Sauvegarder cette analyse"}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Bouton de partage */}
          <button
            onClick={shareAnalysis}
            className={`p-2 rounded-md transition-colors ${shared ? 'bg-blue-100 text-blue-600' : 'hover:bg-white/50'}`}
            title={shared ? "Partagé !" : "Partager cette analyse"}
          >
            <Share2 className={`w-4 h-4 ${shared ? 'fill-current' : ''}`} />
          </button>

          {/* Bouton de téléchargement */}
          <button
            onClick={downloadAnalysis}
            className={`p-2 rounded-md transition-colors ${downloaded ? 'bg-green-100 text-green-600' : 'hover:bg-white/50'}`}
            title={downloaded ? "Téléchargé !" : "Télécharger cette analyse"}
          >
            <Download className={`w-4 h-4 ${downloaded ? 'fill-current' : ''}`} />
          </button>
          
          {/* Bouton d'impression */}
          <button
            onClick={printAnalysis}
            className={`p-2 rounded-md transition-colors ${printed ? 'bg-blue-100 text-blue-600' : 'hover:bg-white/50'}`}
            title={printed ? "Imprimé !" : "Imprimer"}
          >
            <Printer className={`w-4 h-4 ${printed ? 'fill-current' : ''}`} />
          </button>
          
          {/* Bouton de copie */}
          <button
            onClick={copyToClipboard}
            className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-100 text-green-600' : 'hover:bg-white/50'}`}
            title={copied ? "Copié !" : "Copier"}
          >
            <Copy className={`w-4 h-4 ${copied ? 'fill-current' : ''}`} />
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
            onClick={handleClose}
            className={`p-2 rounded-md transition-colors ${closed ? 'bg-red-100 text-red-600' : 'hover:bg-white/50'}`}
            title={closed ? "Fermé !" : "Fermer"}
          >
            <X className={`w-4 h-4 ${closed ? 'fill-current' : ''}`} />
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
