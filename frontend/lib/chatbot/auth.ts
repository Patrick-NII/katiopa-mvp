// lib/chatbot/auth.ts
import { authAPI } from '@/lib/api'

export interface UserSubscription {
  subscriptionType: 'STARTER' | 'PRO' | 'PREMIUM'
  userType: 'PARENT' | 'CHILD'
  isActive: boolean
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const response = await authAPI.verify()
    if (response.success && response.user) {
      return {
        subscriptionType: response.user.subscriptionType as 'STARTER' | 'PRO' | 'PREMIUM',
        userType: response.user.userType as 'PARENT' | 'CHILD',
        isActive: true
      }
    }
    return null
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
