// lib/chatbot/auth.ts
import { authAPI } from '@/lib/api'

export interface UserSubscription {
  subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
  userType: 'PARENT' | 'CHILD'
  isActive: boolean
}

export interface UserInfo {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  email?: string
  userType: 'PARENT' | 'CHILD'
  subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
  isActive: boolean
}

// Fonction améliorée pour récupérer les informations utilisateur complètes
export async function getUserInfo(): Promise<UserInfo | null> {
  try {
    const response = await authAPI.verify()
    if (response.success && response.user) {
      return {
        id: response.user.id,
        sessionId: response.user.sessionId,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        userType: response.user.userType as 'PARENT' | 'CHILD',
        subscriptionType: response.user.subscriptionType as 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE',
        isActive: true
      }
    }
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error)
    return null
  }
}

// Fonction pour vérifier si l'utilisateur est connecté
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const userInfo = await getUserInfo()
    return userInfo !== null
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error)
    return false
  }
}

// Fonction pour obtenir les informations de profil formatées
export async function getUserProfileInfo(): Promise<string | null> {
  try {
    const userInfo = await getUserInfo()
    if (!userInfo) return null
    
    return `👤 **Profil Utilisateur :**
📧 Email : ${userInfo.email || 'Non renseigné'}
👨‍👩‍👧‍👦 Type : ${userInfo.userType === 'PARENT' ? 'Parent' : 'Enfant'}
📋 Nom : ${userInfo.firstName} ${userInfo.lastName}
🆔 Session ID : ${userInfo.sessionId}
💎 Abonnement : ${userInfo.subscriptionType}
✅ Statut : Actif`
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
    return null
  }
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const userInfo = await getUserInfo()
    if (!userInfo) return null
    
    return {
      subscriptionType: userInfo.subscriptionType,
      userType: userInfo.userType,
      isActive: userInfo.isActive
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error)
    return null
  }
}

export function getModelForSubscription(subscriptionType: string): string {
  // Configuration normale selon l'abonnement
  switch (subscriptionType) {
    case 'FREE':
      return 'gpt-3.5-turbo' // Modèle de base pour les abonnements gratuits
    case 'PRO':
      return 'gpt-4o-mini' // Modèle intermédiaire pour PRO
    case 'PRO_PLUS':
      return 'gpt-4o' // Modèle premium pour PRO_PLUS
    case 'ENTERPRISE':
      return 'gpt-4o' // Modèle premium pour ENTERPRISE
    default:
      return 'gpt-3.5-turbo' // Fallback par défaut
  }
}

export function isLLMEnabled(subscriptionType: string): boolean {
  // Seuls les abonnements payants ont accès au LLM
  return subscriptionType !== 'FREE'
}

export function getMaxTokensForSubscription(subscriptionType: string): number {
  // Limitation selon l'abonnement
  switch (subscriptionType) {
    case 'FREE':
      return 0 // Pas de LLM pour les abonnements gratuits
    case 'PRO':
      return 400 // Limitation pour PRO
    case 'PRO_PLUS':
      return 800 // Plus de tokens pour PRO_PLUS
    case 'ENTERPRISE':
      return 1000 // Maximum pour ENTERPRISE
    default:
      return 0
  }
}
