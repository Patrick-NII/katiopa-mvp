import { apiFetch } from '../api'

export interface UserSettings {
  id?: string
  notifications: {
    email: boolean
    push: boolean
    daily: boolean
    weekly: boolean
    achievements: boolean
    reminders: boolean
    social: boolean
  }
  privacy: {
    profileVisible: boolean
    activityVisible: boolean
    allowMessages: boolean
    showProgress: boolean
    shareStats: boolean
    allowFriendRequests: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'auto'
    language: 'fr' | 'en' | 'es'
    fontSize: 'small' | 'medium' | 'large'
    colorBlind: boolean
    highContrast: boolean
    reduceAnimations: boolean
    compactMode: boolean
  }
  accessibility: {
    screenReader: boolean
    keyboardNavigation: boolean
    voiceCommands: boolean
    textToSpeech: boolean
    audioDescriptions: boolean
    focusIndicators: boolean
    motionReduction: boolean
    colorBlindSupport: boolean
    dyslexiaFriendly: boolean
    largeCursors: boolean
  }
  learning: {
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive'
    autoSave: boolean
    hints: boolean
    explanations: boolean
    practiceMode: boolean
    timeLimit: boolean
    soundEffects: boolean
    backgroundMusic: boolean
  }
  performance: {
    autoOptimize: boolean
    cacheData: boolean
    preloadContent: boolean
    lowBandwidth: boolean
    offlineMode: boolean
  }
}

export const settingsAPI = {
  // Récupérer les réglages d'un utilisateur
  async getSettings(sessionId: string): Promise<UserSettings> {
    try {
      const response = await apiFetch(`/api/settings/${sessionId}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des réglages')
      }
      const data = await response.json()
      return data.settings
    } catch (error) {
      console.error('Erreur API getSettings:', error)
      throw error
    }
  },

  // Mettre à jour les réglages d'un utilisateur
  async updateSettings(sessionId: string, settings: UserSettings): Promise<UserSettings> {
    try {
      const response = await apiFetch(`/api/settings/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des réglages')
      }
      
      const data = await response.json()
      return data.settings
    } catch (error) {
      console.error('Erreur API updateSettings:', error)
      throw error
    }
  },

  // Réinitialiser les réglages aux valeurs par défaut
  async resetSettings(sessionId: string): Promise<UserSettings> {
    try {
      const response = await apiFetch(`/api/settings/${sessionId}/reset`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation des réglages')
      }
      
      const data = await response.json()
      return data.settings
    } catch (error) {
      console.error('Erreur API resetSettings:', error)
      throw error
    }
  }
}
