'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, RefreshCw, Clock, CheckCircle, AlertCircle, Sparkles, Save, Trash2, MessageSquare, Heart, HeartOff } from 'lucide-react'
import { useBubixAnalysis } from '../../hooks/useBubixAnalysis'
import { useSavedReports } from '../../hooks/useSavedReports'
import { useRouter } from 'next/navigation'

interface BubixAnalysisPanelProps {
  childId: string
  competence: string
  competenceLabel: string
  childProfile: any
  competenceScore: number
  competenceLevel: string
  isChild: boolean
}

export default function BubixAnalysisPanel({
  childId,
  competence,
  competenceLabel,
  childProfile,
  competenceScore,
  competenceLevel,
  isChild
}: BubixAnalysisPanelProps) {
  
  const router = useRouter()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveNotes, setSaveNotes] = useState('')
  const [saveTags, setSaveTags] = useState<string[]>([])

  const {
    analysis,
    loading,
    error,
    isNew,
    canGenerate,
    message,
    generateAnalysis,
    refreshAnalysis
  } = useBubixAnalysis({
    childId,
    competence,
    childProfile,
    competenceScore,
    competenceLevel,
    autoLoad: true
  })

  const {
    saveReport,
    deleteReport,
    isReportSaved,
    reports,
    loading: savedReportsLoading
  } = useSavedReports({ childId, autoLoad: true })

  // Vérifier si ce rapport est déjà sauvegardé
  const isSaved = analysis ? isReportSaved(analysis.id) : false
  const savedReport = reports.find(r => r.analysisId === analysis?.id)

  // Gérer la sauvegarde
  const handleSave = async () => {
    if (!analysis) return

    try {
      const title = saveTitle || `${competenceLabel} - ${new Date().toLocaleDateString('fr-FR')}`
      await saveReport({
        childId,
        analysisId: analysis.id,
        title,
        notes: saveNotes || undefined,
        tags: saveTags
      })
      
      setShowSaveDialog(false)
      setSaveTitle('')
      setSaveNotes('')
      setSaveTags([])
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    }
  }

  // Gérer la suppression
  const handleDelete = async () => {
    if (!savedReport) return

    if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport sauvegardé ?')) {
      try {
        await deleteReport(savedReport.id)
      } catch (error) {
        console.error('Erreur suppression:', error)
      }
    }
  }

  // Rediriger vers Bubix avec le contexte de l'analyse
  const handleTalkWithBubix = () => {
    if (!analysis) return

    // Encoder les données pour les passer en paramètres
    const contextData = {
      analysisId: analysis.id,
      competence: competenceLabel,
      childName: childProfile?.name || 'Enfant',
      analysis: analysis.analysis,
      score: competenceScore,
      level: competenceLevel
    }

    const encodedContext = encodeURIComponent(JSON.stringify(contextData))
    router.push(`/dashboard/bubix?context=${encodedContext}`)
  }

  // Version simplifiée pour les enfants
  if (isChild) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Ton rapport Bubix
          </h3>
        </div>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          Bravo pour tes progrès en {competenceLabel} ! Continue comme ça, tu fais du super travail ! 🌟
        </p>
      </div>
    )
  }

  // Interface complète pour les parents
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-3">
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Talk with Bubix */}
          {analysis && (
            <button
              onClick={handleTalkWithBubix}
              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
              title="Discuter avec Bubix de cette analyse"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </button>
          )}

          {/* Save/Delete */}
          {analysis && (
            <>
              {isSaved ? (
                <button
                  onClick={handleDelete}
                  disabled={savedReportsLoading}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  title="Supprimer de mes rapports sauvegardés"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={savedReportsLoading}
                  className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                  title="Sauvegarder ce rapport"
                >
                  <Save className="w-4 h-4 text-green-600" />
                </button>
              )}
            </>
          )}

          {/* Refresh */}
          <button
            onClick={refreshAnalysis}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm">Génération de l'analyse...</span>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Erreur</span>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Analyse disponible */}
      {analysis && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* En-tête de l'analyse */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-600">
            <div className="flex-shrink-0">
              <h3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                {competenceLabel}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                {isNew ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    <span>Nouvelle analyse</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>Analyse du jour</span>
                  </div>
                )}
                <span className="text-gray-400 text-xs">
                  {new Date(analysis.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Contenu de l'analyse */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {analysis.analysis}
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          {analysis.metadata && (
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
              <span>Score: {analysis.metadata.score}/10</span>
              <span>Niveau: {analysis.metadata.level}</span>
              <span>Enfant: {analysis.metadata.childName}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Pas d'analyse disponible */}
      {!analysis && !loading && !error && (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {canGenerate 
                ? 'Génération de l\'analyse en cours...'
                : message || 'Analyse non disponible pour aujourd\'hui'
              }
            </p>
          </div>
        </div>
      )}

      {/* Dialog de sauvegarde */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sauvegarder le rapport
            </h3>

            <div className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre du rapport
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder={`${competenceLabel} - ${new Date().toLocaleDateString('fr-FR')}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes personnelles (optionnel)
                </label>
                <textarea
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="Ajoutez vos observations ou commentaires..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (optionnel)
                </label>
                <input
                  type="text"
                  value={saveTags.join(', ')}
                  onChange={(e) => setSaveTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="mathématiques, progrès, difficultés..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Séparez les tags par des virgules
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false)
                  setSaveTitle('')
                  setSaveNotes('')
                  setSaveTags([])
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
