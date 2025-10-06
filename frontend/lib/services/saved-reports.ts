'use client'

export interface SavedReport {
  id: string
  parentId: string
  childId: string
  analysisId: string
  title: string
  notes?: string
  tags: string[]
  isFavorite: boolean
  savedAt: string
  updatedAt: string
  analysis?: {
    id: string
    childId: string
    competence: string
    analysis: string
    metadata: any
    createdAt: string
    expiresAt: string
  }
}

export interface SaveReportRequest {
  childId: string
  analysisId: string
  title: string
  notes?: string
  tags?: string[]
}

export interface UpdateReportRequest {
  title?: string
  notes?: string
  tags?: string[]
  isFavorite?: boolean
}

export interface GetReportsParams {
  childId?: string
  limit?: number
  offset?: number
  tags?: string[]
  favorite?: boolean
}

export interface GetReportsResponse {
  reports: SavedReport[]
  total: number
  hasMore: boolean
}

class SavedReportsService {
  private baseUrl = '/api/saved-reports'

  /**
   * Récupérer les rapports sauvegardés
   */
  async getReports(params: GetReportsParams = {}): Promise<GetReportsResponse> {
    try {
      const searchParams = new URLSearchParams()
      
      if (params.childId) searchParams.set('childId', params.childId)
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.offset) searchParams.set('offset', params.offset.toString())
      if (params.tags && params.tags.length > 0) searchParams.set('tags', params.tags.join(','))
      if (params.favorite !== undefined) searchParams.set('favorite', params.favorite.toString())

      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la récupération des rapports')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur SavedReportsService.getReports:', error)
      throw error
    }
  }

  /**
   * Sauvegarder un rapport
   */
  async saveReport(request: SaveReportRequest): Promise<SavedReport> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la sauvegarde')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur SavedReportsService.saveReport:', error)
      throw error
    }
  }

  /**
   * Mettre à jour un rapport
   */
  async updateReport(id: string, request: UpdateReportRequest): Promise<SavedReport> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la mise à jour')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur SavedReportsService.updateReport:', error)
      throw error
    }
  }

  /**
   * Supprimer un rapport
   */
  async deleteReport(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur SavedReportsService.deleteReport:', error)
      throw error
    }
  }

  /**
   * Récupérer tous les tags
   */
  async getTags(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la récupération des tags')
      }

      const data = await response.json()
      return data.tags || []
    } catch (error) {
      console.error('Erreur SavedReportsService.getTags:', error)
      throw error
    }
  }

  /**
   * Vérifier si un rapport est déjà sauvegardé
   */
  async isReportSaved(analysisId: string): Promise<boolean> {
    try {
      const response = await this.getReports({ limit: 1000 }) // TODO: optimiser avec une route dédiée
      return response.reports.some(report => report.analysisId === analysisId)
    } catch (error) {
      console.error('Erreur SavedReportsService.isReportSaved:', error)
      return false
    }
  }
}

export const savedReportsService = new SavedReportsService()
export default savedReportsService
