// Types d'abonnement
export type SubscriptionType = 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'

// Genre de l'utilisateur
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN'

// Type d'utilisateur
export type UserType = 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'

// Statut de facturation
export type BillingStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

// Compte principal (une adresse email = un compte)
export interface Account {
  id: string
  email: string
  subscriptionType: SubscriptionType
  maxSessions: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Session utilisateur (connexion avec ID/mot de passe)
export interface UserSession {
  id: string
  accountId: string
  sessionId: string // ID de connexion unique
  password: string // Mot de passe de cette session
  firstName: string
  lastName: string
  gender: Gender
  userType: UserType
  age?: number
  grade?: string
  country?: string
  timezone?: string
  preferences?: any // Préférences d'apprentissage
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

// Profil détaillé de l'utilisateur
export interface UserProfile {
  id: string
  userSessionId: string
  learningGoals: string[]
  preferredSubjects: string[]
  learningStyle?: string
  difficulty?: string
  sessionPreferences?: any
  interests: string[]
  specialNeeds: string[]
  customNotes?: string
  parentWishes?: string
  createdAt: string
  updatedAt: string
}

// Activités d'apprentissage
export interface Activity {
  id: string
  userSessionId: string
  domain: string // Mathématiques, Français, IA, etc.
  nodeKey: string // Clé du nœud d'apprentissage
  score: number // Score obtenu
  attempts: number // Nombre de tentatives
  durationMs: number // Durée en millisecondes
  createdAt: string
}

// Historique de facturation
export interface BillingRecord {
  id: string
  accountId: string
  amount: number
  currency: string
  description: string
  status: BillingStatus
  billingDate: string
  dueDate?: string
  paidAt?: string
  createdAt: string
}

// Résumé des statistiques
export interface Summary {
  domain: string
  count: number
  avgScore: number
  totalTime: number
}

// Réponse LLM
export interface LLMResponse {
  summary_child?: string
  summary_adult?: string
  insights?: string[]
  risks?: string[]
  recommended_exercises?: string[]
  schedule_plan?: string[]
  parent_notes?: string[]
  teacher_notes?: string[]
  missing_data?: string[]
}

// Informations de session
export interface SessionInfo {
  sessionStartTime: number
  currentSessionTime: number
  isActive: boolean
}

// Informations de temps global
export interface GlobalTimeInfo {
  totalTimeSinceRegistration: string
  daysSinceRegistration: number
  weeksSinceRegistration: number
  monthsSinceRegistration: number
  yearsSinceRegistration: number
  memberSinceFormatted: string
  isActive: boolean
}

// Onglets de navigation
export type NavigationTab = 
  | 'dashboard'
  | 'statistiques'
  | 'cubeai-experiences'
  | 'informations'
  | 'abonnements'
  | 'facturation'
  | 'reglages'
  | 'aide'

// Données utilisateur pour le dashboard
export interface DashboardUser {
  id: string
  firstName: string
  lastName: string
  email: string
  gender: Gender
  userType: UserType
  age?: number
  grade?: string
  subscriptionType: SubscriptionType
  createdAt: string
}

// Données de compte pour le dashboard
export interface DashboardAccount {
  id: string
  email: string
  subscriptionType: SubscriptionType
  maxSessions: number
  createdAt: string
}

// Props pour les composants
export interface UserHeaderProps {
  user: DashboardUser
  account: DashboardAccount
  onLogout: () => void
}

export interface PersonalizedWelcomeProps {
  firstName: string
  gender: Gender
  userType: UserType
  age?: number
  grade?: string
  memberSince: string
  daysSinceRegistration: number
}

export interface UserSessionInfoProps {
  currentSession: UserSession
  account: Account
  allSessions: UserSession[]
  onSwitchSession: (sessionId: string) => void
}

export interface AccountOverviewProps {
  account: Account
  currentSession: UserSession
  totalSessions: number
  onManageSessions: () => void
}

export interface DashboardTabProps {
  user: DashboardUser
  activities: Activity[]
  summary: Summary[]
  llmResponse: LLMResponse | null
  loading: boolean
  focus: string
  onFocusChange: (focus: string) => void
  onEvaluateLLM: () => void
  onExerciseSelect: (exercise: string) => void
}

export interface StatisticsTabProps {
  user: DashboardUser
  activities: Activity[]
  summary: Summary[]
}

export interface UserStatsProps {
  userId: string
  activities: Activity[]
  memberSince: string
}

export interface UserProfileProps {
  user: DashboardUser
  level: number
  experience: number
  totalTime: number
  subscription: any
  billing: any
} 