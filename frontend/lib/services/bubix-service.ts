/**
 * 🤖 SERVICE BUBIX CENTRALISÉ - GOUVERNANCE DES DONNÉES
 * 
 * Service unifié pour toutes les interactions Bubix avec :
 * - Gestion des sessions parent/enfant
 * - Thématisation automatique selon le type d'utilisateur
 * - Cache intelligent et sécurité renforcée
 * - API unifiée pour tous les composants frontend
 */

export interface BubixSession {
  sessionId: string
  childName: string
  userType: 'PARENT' | 'CHILD'
  isActive: boolean
  lastActivity?: Date
}

export interface BubixAnalysisRequest {
  prompt: string
  sessionId: string
  analysisType: 'compte_rendu' | 'exercice' | 'global_analysis' | 'competence_analysis'
  context?: {
    subscriptionType?: string
    domain?: string
    difficulty?: string
    childName?: string
    activities?: any[]
  }
}

export interface BubixAnalysisResponse {
  success: boolean
  response: string
  analysisType: string
  sessionId: string
  childName: string
  timestamp: string
  dataUsed: any
  securityInfo: any
  theme?: 'parent' | 'child'
  recommendations?: any[]
  error?: string
}

export interface BubixTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  iconStyle: string
  language: 'formal' | 'friendly'
  emojis: boolean
}

// 🎨 Thèmes par type de session
export const BUBIX_THEMES: Record<'parent' | 'child', BubixTheme> = {
  parent: {
    primaryColor: 'from-blue-600 to-purple-600',
    secondaryColor: 'from-gray-100 to-blue-50',
    accentColor: 'blue-500',
    backgroundColor: 'bg-white/90 dark:bg-gray-900/90',
    textColor: 'text-gray-900 dark:text-white',
    iconStyle: 'professional',
    language: 'formal',
    emojis: false
  },
  child: {
    primaryColor: 'from-emerald-500 to-cyan-500',
    secondaryColor: 'from-yellow-50 to-green-50',
    accentColor: 'emerald-500',
    backgroundColor: 'bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50',
    textColor: 'text-gray-800 dark:text-gray-100',
    iconStyle: 'playful',
    language: 'friendly',
    emojis: true
  }
}

class BubixService {
  private static instance: BubixService
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static getInstance(): BubixService {
    if (!BubixService.instance) {
      BubixService.instance = new BubixService()
    }
    return BubixService.instance
  }

  /**
   * 🎯 Analyse Bubix principale - API centralisée
   */
  async analyzeSession(request: BubixAnalysisRequest): Promise<BubixAnalysisResponse> {
    try {
      console.log('🤖 Bubix Service - Analyse session:', request.sessionId)

      // Vérifier le cache
      const cacheKey = `${request.sessionId}_${request.analysisType}_${JSON.stringify(request.context)}`
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        console.log('📦 Cache hit - Bubix analysis')
        return { ...cached, theme: this.detectTheme(request.sessionId) }
      }

      // Appel API centralisé
      const response = await fetch('/api/bubix/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Erreur API Bubix: ${response.status}`)
      }

      const data = await response.json()
      
      // Ajouter la thématisation
      const theme = this.detectTheme(request.sessionId)
      const themedResponse = {
        ...data,
        theme,
        response: this.applyThemeToResponse(data.response, theme)
      }

      // Mettre en cache
      this.setCache(cacheKey, themedResponse)

      return themedResponse
    } catch (error) {
      console.error('❌ Erreur Bubix Service:', error)
      throw error
    }
  }

  /**
   * 🎨 Détection automatique du thème selon le type de session
   */
  private detectTheme(sessionId: string): 'parent' | 'child' {
    // Logique de détection basée sur l'ID de session ou contexte utilisateur
    // Pour l'instant, on peut détecter via les patterns de nommage ou localStorage
    const userType = localStorage.getItem('userType')
    return userType === 'CHILD' ? 'child' : 'parent'
  }

  /**
   * 🎭 Application du thème à la réponse Bubix
   */
  private applyThemeToResponse(response: string, theme: 'parent' | 'child'): string {
    const themeConfig = BUBIX_THEMES[theme]
    
    if (theme === 'child' && themeConfig.emojis) {
      // Ajouter des emojis pour les enfants
      return response
        .replace(/📊/g, '🎯')
        .replace(/💡/g, '✨')
        .replace(/🎮/g, '🎯')
        .replace(/Cordialement, Bubix/g, '🤖 Ton assistant Bubix')
    } else {
      // Garder un ton plus formel pour les parents
      return response
        .replace(/🤖 Ton assistant/g, 'Cordialement,')
        .replace(/✨/g, '💡')
    }
  }

  /**
   * 🎨 Obtenir les classes CSS pour un thème
   */
  getThemeClasses(theme: 'parent' | 'child'): BubixTheme {
    return BUBIX_THEMES[theme]
  }

  /**
   * 💬 Analyser une conversation (pour les ChildPrompts)
   */
  async analyzeConversation(childMessage: string, sessionId: string): Promise<{
    bubixResponse: string
    engagement: 'LOW' | 'MEDIUM' | 'HIGH'
    activityType?: string
  }> {
    try {
      const response = await fetch('/api/childprompts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          childMessage,
          sessionId,
          promptType: 'CHILD_CHAT'
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur conversation Bubix: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur conversation Bubix:', error)
      throw error
    }
  }

  /**
   * 📊 Obtenir les statistiques de session
   */
  async getSessionStats(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          analysisType: 'session_stats'
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur stats session: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur stats session:', error)
      throw error
    }
  }

  /**
   * 🔄 Gestion du cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    })
  }

  /**
   * 🗑️ Nettoyer le cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 📝 Obtenir les analyses sauvegardées
   */
  async getSavedAnalyses(sessionId?: string): Promise<any[]> {
    try {
      const url = sessionId ? `/api/analyses/history?sessionId=${sessionId}` : '/api/analyses/history'
      const response = await fetch(url, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Erreur analyses sauvegardées: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur analyses sauvegardées:', error)
      return []
    }
  }

  /**
   * 💾 Sauvegarder une analyse
   */
  async saveAnalysis(analysis: any): Promise<boolean> {
    try {
      const response = await fetch('/api/analyses/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(analysis)
      })

      return response.ok
    } catch (error) {
      console.error('❌ Erreur sauvegarde analyse:', error)
      return false
    }
  }
}

// Export de l'instance singleton
export const bubixService = BubixService.getInstance()
export default bubixService
