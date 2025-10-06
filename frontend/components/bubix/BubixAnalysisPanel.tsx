'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, RefreshCw, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { useBubixAnalysis } from '../../hooks/useBubixAnalysis'

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rapport Pédagogique
          </h3>
        </div>
        
        {/* Bouton d'actualisation */}
        <button
          onClick={refreshAnalysis}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
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
              <MessageCircle className="w-6 h-6 text-blue-600" />
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
    </div>
  )
}
