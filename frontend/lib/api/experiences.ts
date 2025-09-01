import { apiFetch } from '../api'

// Types pour les expériences CubeAI
export interface Game {
  id: string
  title: string
  description: string
  domain: string
  type: 'PUZZLE' | 'ADVENTURE' | 'SIMULATION' | 'QUIZ' | 'MEMORY' | 'LOGIC' | 'STRATEGY' | 'ACTION' | 'CREATIVE' | 'EDUCATIONAL' | 'OTHER'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
  estimatedTime: number
  minAge?: number
  maxAge?: number
  tags: string[]
  thumbnail?: string
  gameUrl?: string
  isActive: boolean
  rating: number
  totalPlays: number
  completionRate: number
  createdAt: string
  updatedAt: string
}

export interface Exercise {
  id: string
  title: string
  description: string
  domain: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
  estimatedTime: number
  content: any
  tags: string[]
  isActive: boolean
  rating: number
  totalAttempts: number
  successRate: number
  createdAt: string
  updatedAt: string
}

export interface Schedule {
  id: string
  userSessionId: string
  accountId: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  type: 'COURSE' | 'EXERCISE' | 'PROJECT' | 'REVISION' | 'BREAK' | 'GAME' | 'ASSESSMENT' | 'SUPPORT' | 'OTHER'
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isRecurring: boolean
  recurrenceRule?: string
  metadata?: any
  createdAt: string
  updatedAt: string
}

export interface WelcomeMessage {
  id: string
  userSessionId: string
  accountId: string
  messageType: 'DAILY_GREETING' | 'WEEKLY_SUMMARY' | 'ACHIEVEMENT' | 'MOTIVATION' | 'RECOMMENDATION' | 'REMINDER' | 'WELCOME_NEW_USER' | 'OTHER'
  content: string
  context?: any
  isActive: boolean
  expiresAt?: string
  createdAt: string
}

export interface Recommendation {
  id: string
  userSessionId: string
  accountId: string
  type: 'GAME' | 'EXERCISE' | 'SCHEDULE' | 'LEARNING_PATH' | 'BREAK' | 'OTHER'
  targetId?: string
  targetType?: string
  score: number
  reason: string
  isViewed: boolean
  isAccepted: boolean
  expiresAt?: string
  createdAt: string
}

export interface ActivityStats {
  totalGameTime: number
  totalExerciseTime: number
  totalTime: number
  gamesPlayed: number
  exercisesCompleted: number
  averageGameScore: number
  averageExerciseScore: number
}

// API pour les jeux
export const gamesAPI = {
  // Récupérer tous les jeux actifs
  getAll: async (): Promise<Game[]> => {
    const response = await apiFetch('/api/experiences/games')
    const data = await response.json()
    return data.games || []
  },

  // Récupérer les jeux recommandés
  getRecommended: async (): Promise<Game[]> => {
    const response = await apiFetch('/api/experiences/games/recommended')
    const data = await response.json()
    return data.games || []
  },

  // Récupérer les top jeux par domaine
  getTopByDomain: async (domain: string): Promise<Game[]> => {
    const response = await apiFetch(`/api/experiences/games/top/${domain}`)
    const data = await response.json()
    return data.games || []
  }
}

// API pour les exercices
export const exercisesAPI = {
  // Récupérer tous les exercices actifs
  getAll: async (): Promise<Exercise[]> => {
    const response = await apiFetch('/api/experiences/exercises')
    const data = await response.json()
    return data.exercises || []
  },

  // Récupérer les exercices recommandés
  getRecommended: async (): Promise<Exercise[]> => {
    const response = await apiFetch('/api/experiences/exercises/recommended')
    const data = await response.json()
    return data.exercises || []
  },

  // Récupérer les top exercices par domaine
  getTopByDomain: async (domain: string): Promise<Exercise[]> => {
    const response = await apiFetch(`/api/experiences/exercises/top/${domain}`)
    const data = await response.json()
    return data.exercises || []
  }
}

// API pour le planning
export const scheduleAPI = {
  // Récupérer le planning de l'utilisateur
  getUserSchedule: async (): Promise<Schedule[]> => {
    const response = await apiFetch('/api/experiences/schedule')
    const data = await response.json()
    return data.schedules || []
  },

  // Créer un nouvel événement
  createEvent: async (eventData: {
    title: string
    description?: string
    startTime: string
    endTime: string
    type: Schedule['type']
    priority?: Schedule['priority']
  }): Promise<Schedule> => {
    const response = await apiFetch('/api/experiences/schedule', {
      method: 'POST',
      body: JSON.stringify(eventData)
    })
    const data = await response.json()
    return data.schedule
  }
}

// API pour les messages d'accueil
export const welcomeMessageAPI = {
  // Récupérer le message d'accueil personnalisé
  getPersonalized: async (): Promise<WelcomeMessage | { content: string; messageType: string; isGenerated: boolean }> => {
    const response = await apiFetch('/api/experiences/welcome-message')
    const data = await response.json()
    return data.message || { content: "Bienvenue !", messageType: "greeting", isGenerated: false }
  }
}

// API pour les recommandations
export const recommendationsAPI = {
  // Récupérer les recommandations personnalisées
  getPersonalized: async (): Promise<Recommendation[]> => {
    const response = await apiFetch('/api/experiences/recommendations')
    const data = await response.json()
    return data.recommendations || []
  }
}

// API pour les statistiques
export const statsAPI = {
  // Récupérer les statistiques d'activité
  getActivityStats: async (): Promise<ActivityStats> => {
    const response = await apiFetch('/api/experiences/stats/activity')
    const data = await response.json()
    return data.stats || {
      totalActivities: 0,
      totalDuration: 0,
      averageScore: 0,
      topDomains: [],
      recentActivities: []
    }
  }
}

// Fonction utilitaire pour formater la durée
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h${remainingMinutes}`
}

// Fonction utilitaire pour formater le score
export const formatScore = (score: number): string => {
  return score.toFixed(1)
}

// Fonction utilitaire pour obtenir la couleur de difficulté
export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'EASY':
      return 'text-green-600 bg-green-100'
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-100'
    case 'HARD':
      return 'text-orange-600 bg-orange-100'
    case 'EXPERT':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

// Fonction utilitaire pour obtenir l'icône de type de jeu
export const getGameTypeIcon = (type: string): string => {
  switch (type) {
    case 'PUZZLE':
      return '🧩'
    case 'ADVENTURE':
      return '🗺️'
    case 'SIMULATION':
      return '🔬'
    case 'QUIZ':
      return '❓'
    case 'MEMORY':
      return '🧠'
    case 'LOGIC':
      return '⚡'
    case 'STRATEGY':
      return '🎯'
    case 'ACTION':
      return '⚔️'
    case 'CREATIVE':
      return '🎨'
    case 'EDUCATIONAL':
      return '📚'
    default:
      return '🎮'
  }
}
