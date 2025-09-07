import { apiFetch } from '../api'

// Types pour les sessions enfants
export interface ChildSession {
  id: string
  sessionId: string
  name: string
  emoji: string
  isOnline: boolean
  lastActivity: Date
  totalTime: number
  userType: 'CHILD'
}

export interface ChildActivity {
  id: string
  sessionId: string
  type: 'MATH' | 'READING' | 'SCIENCE' | 'CODING' | 'GAME'
  title: string
  score: number
  duration: number
  completedAt: Date
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

export interface SessionAnalysis {
  sessionId: string
  analysis: string // Réponse IA complète
}

export interface ExerciseResponse {
  sessionId: string
  exercise: string // Réponse IA complète
}

export interface GlobalAnalysis {
  sessionId: string
  childName: string
  context: {
    daysSinceRegistration: number
    totalLearningTime: number
    averageSessionDuration: number
    learningFrequency: string
    sessionPatterns: {
      morning: number
      afternoon: number
      evening: number
    }
    preferredTimeSlots: string
    age: number
    grade: string
    totalActivities: number
    averageScore: number
  }
  analysis: {
    engagement: string
    progression: string
    rythme: string
    recommandations: Array<{
      type: string
      message: string
      action: string
    }>
    aiAnalysis: string // Réponse IA complète
  }
  recommendations: Array<{
    type: string
    message: string
    action: string
  }>
}

export interface ParentPreferences {
  id: string
  userSessionId: string
  childStrengths: string[]
  focusAreas: string[]
  learningGoals: string[]
  concerns: string[]
  preferredSchedule: any
  studyDuration: number
  breakFrequency: number
  learningStyle?: string
  motivationFactors: string[]
  createdAt: Date
  updatedAt: Date
}

// API pour les sessions enfants
export const childSessionsAPI = {
  // Récupérer toutes les sessions enfants
  getChildSessions: async (): Promise<ChildSession[]> => {
    const response = await apiFetch('/api/sessions/children')
    return response.json()
  },

  // Récupérer les activités d'une session
  getSessionActivities: async (sessionId: string): Promise<ChildActivity[]> => {
    const response = await apiFetch(`/api/sessions/${sessionId}/activities`)
    return response.json()
  },

  // Analyser les performances d'une session
  analyzeSession: async (sessionId: string): Promise<SessionAnalysis> => {
    const response = await apiFetch(`/api/sessions/${sessionId}/analyze`, {
      method: 'POST'
    })
    return response.json()
  },

  // Générer un nouvel exercice
  generateExercise: async (sessionId: string): Promise<ExerciseResponse> => {
    const response = await apiFetch(`/api/sessions/${sessionId}/exercise`, {
      method: 'POST'
    })
    return response.json()
  },

  // Enregistrer une nouvelle activité
  recordActivity: async (sessionId: string, activity: Omit<ChildActivity, 'id' | 'completedAt'>): Promise<ChildActivity> => {
    const response = await apiFetch(`/api/sessions/${sessionId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activity)
    })
    return response.json()
  },

  // Mettre à jour le statut en ligne/hors ligne
  updateOnlineStatus: async (sessionId: string, isOnline: boolean): Promise<void> => {
    await apiFetch(`/api/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isOnline })
    })
  },

  // NOUVELLES ROUTES POUR L'ANALYSE GLOBALE ET LES PRÉFÉRENCES

  // Récupérer l'analyse globale d'une session
  getGlobalAnalysis: async (sessionId: string): Promise<GlobalAnalysis> => {
    const response = await apiFetch(`/api/sessions/${sessionId}/global-analysis`, {
      method: 'POST'
    })
    return response.json()
  },

  // Sauvegarder les préférences parentales
  saveParentPreferences: async (sessionId: string, preferences: {
    childStrengths: string[]
    focusAreas: string[]
    learningGoals: string[]
    concerns: string[]
    preferredSchedule: any
    studyDuration: number
    breakFrequency: number
    learningStyle?: string
    motivationFactors: string[]
  }): Promise<{ success: boolean; preferences: ParentPreferences }> => {
    const response = await apiFetch(`/api/sessions/${sessionId}/preferences`, {
      method: 'POST',
      body: JSON.stringify(preferences)
    })
    return response.json()
  },

  // Récupérer les préférences parentales
  getParentPreferences: async (sessionId: string): Promise<{ preferences: ParentPreferences | null }> => {
    const response = await apiFetch(`/api/sessions/${sessionId}/preferences`)
    return response.json()
  }
}

// export type { ChildSession, ChildActivity, SessionAnalysis }
