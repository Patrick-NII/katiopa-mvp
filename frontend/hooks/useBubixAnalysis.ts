'use client'

import { useState, useEffect } from 'react'
import { bubixAnalysisService, type AnalysisRequest, type AnalysisResponse } from '../lib/services/bubix-analysis'

interface UseBubixAnalysisProps {
  childId: string
  competence: string
  childProfile?: any
  competenceScore?: number
  competenceLevel?: string
  autoLoad?: boolean
}

interface UseBubixAnalysisReturn {
  analysis: AnalysisResponse | null
  loading: boolean
  error: string | null
  isNew: boolean
  canGenerate: boolean
  message: string | null
  generateAnalysis: () => Promise<void>
  refreshAnalysis: () => Promise<void>
}

export function useBubixAnalysis({
  childId,
  competence,
  childProfile,
  competenceScore,
  competenceLevel,
  autoLoad = true
}: UseBubixAnalysisProps): UseBubixAnalysisReturn {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [canGenerate, setCanGenerate] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Charger l'analyse existante au montage et générer si nécessaire
  useEffect(() => {
    if (autoLoad && childId && competence) {
      loadOrGenerateAnalysis()
    }
  }, [childId, competence, autoLoad, childProfile, competenceScore, competenceLevel])

  /**
   * Charge l'analyse existante ou la génère automatiquement
   */
  const loadOrGenerateAnalysis = async () => {
    if (!childProfile || competenceScore === undefined || !competenceLevel) {
      // Si on n'a pas toutes les données, on charge juste l'existant
      await loadExistingAnalysis()
      return
    }

    try {
      setLoading(true)
      setError(null)

      const request: AnalysisRequest = {
        childProfile: {
          id: childId,
          name: childProfile.name || 'Enfant',
          age: childProfile.age,
          data: childProfile.data || []
        },
        competence,
        competenceScore,
        competenceLevel
      }

      const result = await bubixAnalysisService.getOrGenerateAnalysis(request)
      
      if (result.analysis) {
        setAnalysis(result.analysis)
        setIsNew(result.isNew)
        setCanGenerate(result.canGenerate)
        setMessage(result.message || null)
      } else {
        setCanGenerate(result.canGenerate)
        setMessage(result.message || 'Aucune analyse disponible')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      console.error('Erreur loadOrGenerateAnalysis:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Charge l'analyse existante du jour
   */
  const loadExistingAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      const existingAnalysis = await bubixAnalysisService.getExistingAnalysis(childId, competence)
      
      if (existingAnalysis) {
        setAnalysis(existingAnalysis)
        setIsNew(false)
        setCanGenerate(false)
        setMessage('Analyse du jour disponible')
      } else {
        // Vérifier si on peut générer une nouvelle analyse
        const canGenerateResult = await bubixAnalysisService.canGenerateAnalysis(childId, competence)
        setCanGenerate(canGenerateResult.canGenerate)
        setMessage(canGenerateResult.reason || null)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      console.error('Erreur loadExistingAnalysis:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Génère une nouvelle analyse
   */
  const generateAnalysis = async () => {
    if (!childProfile || competenceScore === undefined || !competenceLevel) {
      setError('Données insuffisantes pour générer l\'analyse')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const request: AnalysisRequest = {
        childProfile: {
          id: childId,
          name: childProfile.name || 'Enfant',
          age: childProfile.age,
          data: childProfile.data || []
        },
        competence,
        competenceScore,
        competenceLevel
      }

      const result = await bubixAnalysisService.getOrGenerateAnalysis(request)
      
      if (result.analysis) {
        setAnalysis(result.analysis)
        setIsNew(result.isNew)
        setCanGenerate(result.canGenerate)
        setMessage(result.message || null)
      } else {
        setError(result.message || 'Impossible de générer l\'analyse')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
      console.error('Erreur generateAnalysis:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Actualise l'analyse (recharge depuis le serveur)
   */
  const refreshAnalysis = async () => {
    await loadExistingAnalysis()
  }

  return {
    analysis,
    loading,
    error,
    isNew,
    canGenerate,
    message,
    generateAnalysis,
    refreshAnalysis
  }
}

/**
 * Hook pour l'historique des analyses (boîte mail des bulletins)
 */
interface UseAnalysisHistoryProps {
  childId: string
  limit?: number
  autoLoad?: boolean
}

interface UseAnalysisHistoryReturn {
  analyses: AnalysisResponse[]
  loading: boolean
  error: string | null
  loadHistory: () => Promise<void>
  refreshHistory: () => Promise<void>
}

export function useAnalysisHistory({
  childId,
  limit = 20,
  autoLoad = true
}: UseAnalysisHistoryProps): UseAnalysisHistoryReturn {
  const [analyses, setAnalyses] = useState<AnalysisResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (autoLoad && childId) {
      loadHistory()
    }
  }, [childId, autoLoad])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const history = await bubixAnalysisService.getAnalysisHistory(childId, limit)
      setAnalyses(history)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique')
      console.error('Erreur loadHistory:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshHistory = async () => {
    await loadHistory()
  }

  return {
    analyses,
    loading,
    error,
    loadHistory,
    refreshHistory
  }
}
