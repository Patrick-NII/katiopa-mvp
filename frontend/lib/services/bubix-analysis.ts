'use client'

interface CompetenceData {
  competence: string
  score: number
  maxScore: number
  level: string
}

interface ChildProfile {
  id: string
  name: string
  age?: number
  data: CompetenceData[]
}

interface AnalysisRequest {
  childProfile: ChildProfile
  competence: string
  competenceScore: number
  competenceLevel: string
  contextData?: {
    recentSessions?: any[]
    progressHistory?: any[]
    parentConcerns?: string[]
  }
}

interface AnalysisResponse {
  id: string
  childId: string
  competence: string
  analysis: string
  createdAt: string
  expiresAt: string
  metadata: {
    score: number
    level: string
    childName: string
    age?: number
  }
}

class BubixAnalysisService {
  private baseUrl = '/api/bubix'

  /**
   * Génère une nouvelle analyse pédagogique via OpenAI
   * Limité à 1 analyse par compétence par jour
   */
  async generateAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childProfile: request.childProfile,
          competence: request.competence,
          competenceScore: request.competenceScore,
          competenceLevel: request.competenceLevel,
          contextData: request.contextData || {}
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la génération de l\'analyse')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur BubixAnalysisService.generateAnalysis:', error)
      throw error
    }
  }

  /**
   * Récupère une analyse existante (cache quotidien)
   */
  async getExistingAnalysis(childId: string, competence: string): Promise<AnalysisResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/analysis/${childId}/${competence}`)
      
      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'analyse')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur BubixAnalysisService.getExistingAnalysis:', error)
      return null
    }
  }

  /**
   * Récupère l'historique des analyses (boîte mail des bulletins)
   */
  async getAnalysisHistory(childId: string, limit = 20): Promise<AnalysisResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/history/${childId}?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'historique')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur BubixAnalysisService.getAnalysisHistory:', error)
      return []
    }
  }

  /**
   * Vérifie si une nouvelle analyse peut être générée
   */
  async canGenerateAnalysis(childId: string, competence: string): Promise<{
    canGenerate: boolean
    reason?: string
    nextAvailableAt?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/can-generate/${childId}/${competence}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur BubixAnalysisService.canGenerateAnalysis:', error)
      return { canGenerate: false, reason: 'Erreur de connexion' }
    }
  }

  /**
   * Récupère ou génère une analyse (logique principale)
   */
  async getOrGenerateAnalysis(request: AnalysisRequest): Promise<{
    analysis: AnalysisResponse | null
    isNew: boolean
    canGenerate: boolean
    message?: string
  }> {
    try {
      // 1. Vérifier s'il existe une analyse récente
      const existing = await this.getExistingAnalysis(request.childProfile.id, request.competence)
      
      if (existing && !this.isAnalysisExpired(existing)) {
        return {
          analysis: existing,
          isNew: false,
          canGenerate: false,
          message: 'Analyse du jour déjà disponible'
        }
      }

      // 2. Vérifier si on peut générer une nouvelle analyse
      const canGenerate = await this.canGenerateAnalysis(request.childProfile.id, request.competence)
      
      if (!canGenerate.canGenerate) {
        return {
          analysis: existing,
          isNew: false,
          canGenerate: false,
          message: canGenerate.reason
        }
      }

      // 3. Générer une nouvelle analyse
      const newAnalysis = await this.generateAnalysis(request)
      
      return {
        analysis: newAnalysis,
        isNew: true,
        canGenerate: true,
        message: 'Nouvelle analyse générée'
      }

    } catch (error) {
      console.error('Erreur BubixAnalysisService.getOrGenerateAnalysis:', error)
      return {
        analysis: null,
        isNew: false,
        canGenerate: false,
        message: 'Erreur lors de la génération de l\'analyse'
      }
    }
  }

  /**
   * Vérifie si une analyse est expirée (plus de 24h)
   */
  private isAnalysisExpired(analysis: AnalysisResponse): boolean {
    const now = new Date()
    const expiresAt = new Date(analysis.expiresAt)
    return now > expiresAt
  }

  /**
   * Formate une analyse pour l'affichage
   */
  formatAnalysisForDisplay(analysis: AnalysisResponse): {
    title: string
    content: string
    date: string
    metadata: any
  } {
    const date = new Date(analysis.createdAt)
    
    return {
      title: `Rapport ${analysis.metadata.childName} - ${analysis.competence}`,
      content: analysis.analysis,
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      metadata: analysis.metadata
    }
  }
}

// Instance singleton
export const bubixAnalysisService = new BubixAnalysisService()

// Types exportés
export type { AnalysisRequest, AnalysisResponse, CompetenceData, ChildProfile }
