'use client'

import { useState, useEffect } from 'react'
import savedReportsService, { 
  type SavedReport, 
  type SaveReportRequest, 
  type UpdateReportRequest,
  type GetReportsParams 
} from '../lib/services/saved-reports'

interface UseSavedReportsProps {
  childId?: string
  autoLoad?: boolean
}

interface UseSavedReportsReturn {
  reports: SavedReport[]
  loading: boolean
  error: string | null
  total: number
  hasMore: boolean
  tags: string[]
  saveReport: (request: SaveReportRequest) => Promise<SavedReport>
  updateReport: (id: string, request: UpdateReportRequest) => Promise<SavedReport>
  deleteReport: (id: string) => Promise<void>
  loadReports: (params?: GetReportsParams) => Promise<void>
  loadMoreReports: () => Promise<void>
  refreshReports: () => Promise<void>
  isReportSaved: (analysisId: string) => boolean
}

export function useSavedReports({
  childId,
  autoLoad = true
}: UseSavedReportsProps = {}): UseSavedReportsReturn {
  const [reports, setReports] = useState<SavedReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [currentParams, setCurrentParams] = useState<GetReportsParams>({})

  // Charger les rapports au montage
  useEffect(() => {
    if (autoLoad) {
      loadReports({ childId })
      loadTags()
    }
  }, [childId, autoLoad])

  /**
   * Charger les rapports
   */
  const loadReports = async (params: GetReportsParams = {}) => {
    try {
      setLoading(true)
      setError(null)
      setCurrentParams(params)

      const response = await savedReportsService.getReports(params)
      
      setReports(response.reports)
      setTotal(response.total)
      setHasMore(response.hasMore)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      console.error('Erreur loadReports:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Charger plus de rapports (pagination)
   */
  const loadMoreReports = async () => {
    if (!hasMore || loading) return

    try {
      setLoading(true)
      setError(null)

      const params = {
        ...currentParams,
        offset: reports.length
      }

      const response = await savedReportsService.getReports(params)
      
      setReports(prev => [...prev, ...response.reports])
      setHasMore(response.hasMore)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      console.error('Erreur loadMoreReports:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Actualiser les rapports
   */
  const refreshReports = async () => {
    await loadReports(currentParams)
    await loadTags()
  }

  /**
   * Sauvegarder un rapport
   */
  const saveReport = async (request: SaveReportRequest): Promise<SavedReport> => {
    try {
      setError(null)
      const savedReport = await savedReportsService.saveReport(request)
      
      // Ajouter le nouveau rapport en tête de liste
      setReports(prev => [savedReport, ...prev])
      setTotal(prev => prev + 1)
      
      return savedReport
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      setError(errorMessage)
      throw err
    }
  }

  /**
   * Mettre à jour un rapport
   */
  const updateReport = async (id: string, request: UpdateReportRequest): Promise<SavedReport> => {
    try {
      setError(null)
      const updatedReport = await savedReportsService.updateReport(id, request)
      
      // Mettre à jour le rapport dans la liste
      setReports(prev => prev.map(report => 
        report.id === id ? updatedReport : report
      ))
      
      return updatedReport
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      setError(errorMessage)
      throw err
    }
  }

  /**
   * Supprimer un rapport
   */
  const deleteReport = async (id: string): Promise<void> => {
    try {
      setError(null)
      await savedReportsService.deleteReport(id)
      
      // Supprimer le rapport de la liste
      setReports(prev => prev.filter(report => report.id !== id))
      setTotal(prev => prev - 1)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression'
      setError(errorMessage)
      throw err
    }
  }

  /**
   * Charger les tags
   */
  const loadTags = async () => {
    try {
      const allTags = await savedReportsService.getTags()
      setTags(allTags)
    } catch (err) {
      console.error('Erreur loadTags:', err)
    }
  }

  /**
   * Vérifier si un rapport est sauvegardé
   */
  const isReportSaved = (analysisId: string): boolean => {
    return reports.some(report => report.analysisId === analysisId)
  }

  return {
    reports,
    loading,
    error,
    total,
    hasMore,
    tags,
    saveReport,
    updateReport,
    deleteReport,
    loadReports,
    loadMoreReports,
    refreshReports,
    isReportSaved
  }
}

export default useSavedReports
