'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Brain, RefreshCw, Calendar, User } from 'lucide-react'

interface BubixAnalysis {
  id: string
  analysis: string
  recommendations: any[]
  date: string
  competence: {
    id: string
    name: string
    type: string
    icon?: string
    color?: string
  }
}

interface CompetenceBubixProps {
  userSessionId: string
  competenceId?: string
  className?: string
}

export default function CompetenceBubix({ userSessionId, competenceId, className = '' }: CompetenceBubixProps) {
  const [analyses, setAnalyses] = useState<BubixAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchAnalyses()
  }, [userSessionId])

  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/bubix/analyses/${userSessionId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des analyses')
      }

      const data = await response.json()
      setAnalyses(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const generateAnalysis = async (targetCompetenceId: string) => {
    try {
      setGenerating(true)
      setError('')

      const response = await fetch('/api/bubix/analyze-competence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          competenceId: targetCompetenceId,
          userSessionId
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération de l\'analyse')
      }

      const data = await response.json()
      
      if (data.success) {
        // Rafraîchir la liste des analyses
        await fetchAnalyses()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analyses Bubix
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Comptes rendus pédagogiques par compétence
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchAnalyses}
          disabled={loading}
          className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-purple-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* Erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <div className="w-5 h-5">⚠️</div>
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      {/* Liste des analyses */}
      <div className="space-y-4">
        {analyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucune analyse disponible pour le moment.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Les analyses sont générées automatiquement après les exercices.
            </p>
          </motion.div>
        ) : (
          analyses.map((analysis, index) => (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-600/50 p-4"
            >
              {/* En-tête de l'analyse */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: analysis.competence.color || '#8B5CF6' }}
                  >
                    {analysis.competence.icon || '🧠'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {analysis.competence.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(analysis.date)}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => generateAnalysis(analysis.competence.id)}
                  disabled={generating}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors text-sm font-medium"
                >
                  {generating ? 'Génération...' : 'Nouvelle analyse'}
                </button>
              </div>

              {/* Contenu de l'analyse */}
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {analysis.analysis}
                </p>
              </div>

              {/* Recommandations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Recommandations :
                  </h4>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, recIndex) => (
                      <div key={recIndex} className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          rec.priority === 'high' ? 'bg-red-500' :
                          rec.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {rec.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {rec.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

