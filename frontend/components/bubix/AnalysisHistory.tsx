'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Calendar, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Archive,
  Clock,
  User
} from 'lucide-react'
import { useAnalysisHistory } from '../../hooks/useBubixAnalysis'
import { bubixAnalysisService, type AnalysisResponse } from '../../lib/services/bubix-analysis'

interface AnalysisHistoryProps {
  childId: string
  childName?: string
  className?: string
}

export default function AnalysisHistory({ 
  childId, 
  childName = 'Enfant',
  className = '' 
}: AnalysisHistoryProps) {
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null)
  
  const {
    analyses,
    loading,
    error,
    refreshHistory
  } = useAnalysisHistory({
    childId,
    limit: 50,
    autoLoad: true
  })

  const toggleAnalysis = (analysisId: string) => {
    setExpandedAnalysis(expandedAnalysis === analysisId ? null : analysisId)
  }

  // Grouper les analyses par date
  const groupedAnalyses = analyses.reduce((groups, analysis) => {
    const date = new Date(analysis.createdAt).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(analysis)
    return groups
  }, {} as Record<string, AnalysisResponse[]>)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Bulletins Pédagogiques
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Historique des analyses de {childName}
            </p>
          </div>
        </div>
        
        <button
          onClick={refreshHistory}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Actualiser"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Contenu */}
      <div className="p-6">
        {/* État de chargement */}
        {loading && analyses.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm">Chargement de l'historique...</span>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Aucune analyse */}
        {!loading && analyses.length === 0 && !error && (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun bulletin disponible
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Les analyses pédagogiques apparaîtront ici une fois générées
            </p>
          </div>
        )}

        {/* Liste des analyses groupées par date */}
        {Object.entries(groupedAnalyses).map(([dateString, dayAnalyses]) => (
          <div key={dateString} className="mb-6 last:mb-0">
            {/* Séparateur de date */}
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {new Date(dateString).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>

            {/* Analyses du jour */}
            <div className="space-y-3">
              {dayAnalyses.map((analysis) => {
                const isExpanded = expandedAnalysis === analysis.id
                const formatted = bubixAnalysisService.formatAnalysisForDisplay(analysis)
                
                return (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* En-tête cliquable */}
                    <button
                      onClick={() => toggleAnalysis(analysis.id)}
                      className="w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {analysis.competence}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(analysis.createdAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {analysis.metadata?.score && (
                                <>
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Score: {analysis.metadata.score}/10
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {analysis.metadata?.level && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                              {analysis.metadata.level}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Contenu développable */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <div className="p-4 bg-white dark:bg-gray-800">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {analysis.analysis}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
