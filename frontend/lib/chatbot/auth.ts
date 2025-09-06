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
      const user = response.user as any; // Cast pour accéder aux propriétés supplémentaires
      return {
        id: user.id,
        sessionId: user.sessionId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || 'Non renseigné',
        userType: user.userType as 'PARENT' | 'CHILD',
        subscriptionType: user.subscriptionType as 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE',
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
  // Découverte (FREE) → gpt-3.5, Explorateur (PRO) → gpt-4o-mini, Maître (PRO_PLUS) → gpt-4o
  switch (subscriptionType) {
    case 'FREE':
      return 'gpt-3.5-turbo'
    case 'PRO':
      return 'gpt-4o-mini'
    case 'PRO_PLUS':
      return 'gpt-4o'
    case 'ENTERPRISE':
      return 'gpt-4o'
    default:
      return 'gpt-3.5-turbo' // Fallback par défaut
  }
}

export function isLLMEnabled(subscriptionType: string): boolean {
  // LLM disponible pour tous, mais fortement limité en Découverte
  return true
}

export function getMaxTokensForSubscription(subscriptionType: string): number {
  // Découverte (limité), Explorateur (analyses confortables), Maître (très généreux)
  switch (subscriptionType) {
    case 'FREE':
      return 300
    case 'PRO':
      return 1200
    case 'PRO_PLUS':
      return 2500
    case 'ENTERPRISE':
      return 4000
    default:
      return 300
  }
}
