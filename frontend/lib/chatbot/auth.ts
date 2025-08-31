// lib/chatbot/auth.ts
import { authAPI } from '@/lib/api'

export interface UserSubscription {
  subscriptionType: 'STARTER' | 'PRO' | 'PREMIUM'
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
  subscriptionType: 'STARTER' | 'PRO' | 'PREMIUM'
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
        subscriptionType: response.user.subscriptionType as 'STARTER' | 'PRO' | 'PREMIUM',
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
  // Débloquer le meilleur modèle pour le compte Aylon-007
  // Pour les autres comptes, modèle selon l'abonnement
  switch (subscriptionType) {
    case 'STARTER':
      return 'gpt-4o' // Débloqué pour Aylon-007
    case 'PRO':
      return 'gpt-4o' // Débloqué pour Aylon-007
    case 'PREMIUM':
      return 'gpt-4o' // Débloqué pour Aylon-007
    default:
      return 'gpt-4o' // Débloqué pour Aylon-007
  }
}

export function isLLMEnabled(subscriptionType: string): boolean {
  // Débloquer tous les accès pour le compte Aylon-007
  // Pour les autres comptes, seuls les abonnements payants ont accès au LLM
  return true // Temporairement débloqué pour tous
}

export function getMaxTokensForSubscription(subscriptionType: string): number {
  // Débloquer tous les accès pour le compte Aylon-007
  // Pour les autres comptes, limitation selon l'abonnement
  switch (subscriptionType) {
    case 'STARTER':
      return 800 // Débloqué pour Aylon-007
    case 'PRO':
      return 800 // Débloqué pour Aylon-007
    case 'PREMIUM':
      return 800 // Débloqué pour Aylon-007
    default:
      return 800 // Débloqué pour Aylon-007
  }
}
