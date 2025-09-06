// Services pour le tracking d'upgrade intelligent
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ===== SERVICE DE TRACKING COMPORTEMENTAL =====

export class BehavioralTrackingService {
  
  // Enregistrer une métrique comportementale
  static async recordMetric(
    userId: string,
    metricType: 'insistence' | 'performance' | 'engagement',
    metricValue: number,
    contextData?: any,
    sessionId?: string
  ) {
    try {
      return await prisma.behavioralMetrics.create({
        data: {
          userId,
          sessionId,
          metricType,
          metricValue: metricValue,
          contextData: contextData || {},
          recordedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la métrique:', error)
      throw error
    }
  }

  // Analyser l'insistance d'un enfant
  static async analyzeChildInsistence(childId: string, timeWindowHours: number = 24) {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000)
      
      const metrics = await prisma.behavioralMetrics.findMany({
        where: {
          userId: childId,
          metricType: 'insistence',
          recordedAt: {
            gte: cutoffTime
          }
        },
        orderBy: {
          recordedAt: 'desc'
        }
      })

      if (metrics.length === 0) {
        return {
          insistenceLevel: 'low',
          score: 0,
          frequency: 0,
          trend: 'stable'
        }
      }

      // Calculer le score d'insistance
      const totalScore = metrics.reduce((sum, metric) => sum + Number(metric.metricValue), 0)
      const averageScore = totalScore / metrics.length
      const frequency = metrics.length

      // Déterminer le niveau d'insistance
      let insistenceLevel = 'low'
      if (averageScore > 0.7 && frequency > 10) {
        insistenceLevel = 'high'
      } else if (averageScore > 0.4 && frequency > 5) {
        insistenceLevel = 'medium'
      }

      // Analyser la tendance
      const recentMetrics = metrics.slice(0, Math.floor(metrics.length / 2))
      const olderMetrics = metrics.slice(Math.floor(metrics.length / 2))
      
      const recentAvg = recentMetrics.reduce((sum, m) => sum + Number(m.metricValue), 0) / recentMetrics.length
      const olderAvg = olderMetrics.reduce((sum, m) => sum + Number(m.metricValue), 0) / olderMetrics.length
      
      let trend = 'stable'
      if (recentAvg > olderAvg * 1.2) {
        trend = 'increasing'
      } else if (recentAvg < olderAvg * 0.8) {
        trend = 'decreasing'
      }

      return {
        insistenceLevel,
        score: averageScore,
        frequency,
        trend,
        metrics: metrics.length
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'insistance:', error)
      throw error
    }
  }

  // Analyser les performances d'un enfant
  static async analyzeChildPerformance(childId: string, timeWindowDays: number = 7) {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000)
      
      const metrics = await prisma.behavioralMetrics.findMany({
        where: {
          userId: childId,
          metricType: 'performance',
          recordedAt: {
            gte: cutoffTime
          }
        },
        orderBy: {
          recordedAt: 'desc'
        }
      })

      if (metrics.length === 0) {
        return {
          performanceLevel: 'basic',
          score: 0,
          trend: 'stable',
          confidence: 0
        }
      }

      // Calculer le score de performance
      const totalScore = metrics.reduce((sum, metric) => sum + Number(metric.metricValue), 0)
      const averageScore = totalScore / metrics.length

      // Déterminer le niveau de performance
      let performanceLevel = 'basic'
      if (averageScore > 0.8) {
        performanceLevel = 'exceptional'
      } else if (averageScore > 0.6) {
        performanceLevel = 'elevated'
      }

      // Analyser la tendance
      const recentMetrics = metrics.slice(0, Math.floor(metrics.length / 2))
      const olderMetrics = metrics.slice(Math.floor(metrics.length / 2))
      
      const recentAvg = recentMetrics.reduce((sum, m) => sum + Number(m.metricValue), 0) / recentMetrics.length
      const olderAvg = olderMetrics.reduce((sum, m) => sum + Number(m.metricValue), 0) / olderMetrics.length
      
      let trend = 'stable'
      if (recentAvg > olderAvg * 1.15) {
        trend = 'improving'
      } else if (recentAvg < olderAvg * 0.85) {
        trend = 'declining'
      }

      // Calculer la confiance basée sur le nombre de métriques
      const confidence = Math.min(metrics.length / 20, 1) // Max 1.0 avec 20+ métriques

      return {
        performanceLevel,
        score: averageScore,
        trend,
        confidence,
        metrics: metrics.length
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la performance:', error)
      throw error
    }
  }
}

// ===== SERVICE DE TRACKING D'UPGRADE =====

export class UpgradeTrackingService {
  
  // Créer un événement de tracking d'upgrade
  static async createUpgradeEvent(
    userId: string,
    triggerType: 'child_insistence' | 'parent_analysis' | 'performance_level',
    triggerData?: any,
    childId?: string
  ) {
    try {
      return await prisma.upgradeTracking.create({
        data: {
          userId,
          childId,
          triggerType,
          triggerData: triggerData || {},
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement d\'upgrade:', error)
      throw error
    }
  }

  // Marquer qu'un popup a été affiché
  static async markPopupShown(trackingId: string) {
    try {
      return await prisma.upgradeTracking.update({
        where: { id: trackingId },
        data: {
          popupShownAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors du marquage du popup:', error)
      throw error
    }
  }

  // Enregistrer l'action du popup
  static async recordPopupAction(
    trackingId: string,
    action: 'upgrade' | 'remind_later' | 'dismiss'
  ) {
    try {
      return await prisma.upgradeTracking.update({
        where: { id: trackingId },
        data: {
          popupAction: action,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'action:', error)
      throw error
    }
  }

  // Marquer la visite de la page d'upgrade
  static async markUpgradePageVisited(trackingId: string) {
    try {
      return await prisma.upgradeTracking.update({
        where: { id: trackingId },
        data: {
          upgradePageVisitedAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors du marquage de la visite:', error)
      throw error
    }
  }

  // Enregistrer la conversion
  static async recordConversion(
    trackingId: string,
    subscriptionType: string
  ) {
    try {
      return await prisma.upgradeTracking.update({
        where: { id: trackingId },
        data: {
          conversionAt: new Date(),
          subscriptionType,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la conversion:', error)
      throw error
    }
  }

  // Obtenir les statistiques de conversion
  static async getConversionStats(timeWindowDays: number = 30) {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000)
      
      const stats = await prisma.upgradeTracking.groupBy({
        by: ['triggerType', 'popupAction'],
        where: {
          createdAt: {
            gte: cutoffTime
          }
        },
        _count: {
          id: true
        }
      })

      const conversions = await prisma.upgradeTracking.count({
        where: {
          conversionAt: {
            not: null,
            gte: cutoffTime
          }
        }
      })

      const totalEvents = await prisma.upgradeTracking.count({
        where: {
          createdAt: {
            gte: cutoffTime
          }
        }
      })

      return {
        totalEvents,
        conversions,
        conversionRate: totalEvents > 0 ? conversions / totalEvents : 0,
        statsByTrigger: stats
      }
    } catch (error) {
      console.error('Erreur lors de l\'obtention des statistiques:', error)
      throw error
    }
  }
}

// ===== SERVICE D'ANALYSE DE PERFORMANCE =====

export class ChildPerformanceAnalysisService {
  
  // Créer une analyse de performance
  static async createPerformanceAnalysis(
    childId: string,
    analysisType: 'level_assessment' | 'potential_detection' | 'progress_analysis',
    analysisData: any,
    performanceLevel: 'basic' | 'elevated' | 'exceptional',
    confidence: number,
    recommendations?: any
  ) {
    try {
      return await prisma.childPerformanceAnalysis.create({
        data: {
          childId,
          analysisType,
          analysisData,
          performanceLevel,
          confidence: confidence,
          recommendations: recommendations || {},
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors de la création de l\'analyse:', error)
      throw error
    }
  }

  // Obtenir la dernière analyse de performance
  static async getLatestPerformanceAnalysis(childId: string) {
    try {
      return await prisma.childPerformanceAnalysis.findFirst({
        where: {
          childId
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'analyse:', error)
      throw error
    }
  }

  // Analyser le niveau d'un enfant basé sur ses données
  static async analyzeChildLevel(childId: string) {
    try {
      // Récupérer les données récentes de l'enfant
      const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
      
      const [activities, cubeMatchScores, conversations] = await Promise.all([
        prisma.activity.findMany({
          where: {
            userSessionId: childId,
            createdAt: { gte: cutoffTime }
          }
        }),
        prisma.cubeMatchScore.findMany({
          where: {
            user_id: childId,
            created_at: { gte: cutoffTime }
          }
        }),
        prisma.conversation.findMany({
          where: {
            userSessionId: childId,
            createdAt: { gte: cutoffTime }
          }
        })
      ])

      // Analyser les performances
      const activityScores = activities.map(a => a.score || 0)
      const cubeMatchScores_values = cubeMatchScores.map(s => s.score || 0)
      
      const avgActivityScore = activityScores.length > 0 
        ? activityScores.reduce((sum, score) => sum + score, 0) / activityScores.length 
        : 0
      
      const avgCubeMatchScore = cubeMatchScores_values.length > 0 
        ? cubeMatchScores_values.reduce((sum, score) => sum + score, 0) / cubeMatchScores_values.length 
        : 0

      // Analyser la fréquence d'engagement
      const engagementFrequency = conversations.length / 7 // conversations par jour
      
      // Calculer le score global
      const performanceScore = (
        (avgActivityScore / 100) * 0.4 + // 40% activités
        (avgCubeMatchScore / 100) * 0.4 + // 40% CubeMatch
        Math.min(engagementFrequency / 5, 1) * 0.2 // 20% engagement (max 5 conv/jour)
      )

      // Déterminer le niveau
      let performanceLevel = 'basic'
      let confidence = 0.5

      if (performanceScore > 0.8) {
        performanceLevel = 'exceptional'
        confidence = 0.9
      } else if (performanceScore > 0.6) {
        performanceLevel = 'elevated'
        confidence = 0.7
      } else {
        confidence = Math.max(0.3, performanceScore)
      }

      // Créer l'analyse
      const analysis = await this.createPerformanceAnalysis(
        childId,
        'level_assessment',
        {
          activityScores: avgActivityScore,
          cubeMatchScores: avgCubeMatchScore,
          engagementFrequency,
          performanceScore,
          dataPoints: {
            activities: activities.length,
            cubeMatchGames: cubeMatchScores.length,
            conversations: conversations.length
          }
        },
        performanceLevel,
        confidence,
        {
          strengths: performanceLevel === 'exceptional' ? ['Excellence générale', 'Engagement élevé'] : 
                    performanceLevel === 'elevated' ? ['Bon niveau', 'Progression positive'] : 
                    ['Niveau standard', 'Potentiel à développer'],
          recommendations: performanceLevel === 'exceptional' ? 
            ['Accompagnement avancé recommandé', 'Défis supplémentaires'] :
            performanceLevel === 'elevated' ?
            ['Encouragement continu', 'Activités enrichies'] :
            ['Soutien personnalisé', 'Progression graduelle']
        }
      )

      return analysis
    } catch (error) {
      console.error('Erreur lors de l\'analyse du niveau:', error)
      throw error
    }
  }
}

// ===== SERVICE DE TRACKING DES POPUPS =====

export class PopupTrackingService {
  
  // Enregistrer une interaction avec un popup
  static async recordPopupInteraction(
    userId: string,
    popupType: 'limitation' | 'upgrade' | 'achievement',
    action: 'shown' | 'clicked' | 'dismissed' | 'upgraded',
    popupContent?: any,
    actionData?: any,
    sessionContext?: any
  ) {
    try {
      return await prisma.popupInteraction.create({
        data: {
          userId,
          popupType,
          action,
          popupContent: popupContent || {},
          actionData: actionData || {},
          sessionContext: sessionContext || {},
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'interaction:', error)
      throw error
    }
  }

  // Obtenir les statistiques des popups
  static async getPopupStats(timeWindowDays: number = 30) {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000)
      
      const stats = await prisma.popupInteraction.groupBy({
        by: ['popupType', 'action'],
        where: {
          createdAt: {
            gte: cutoffTime
          }
        },
        _count: {
          id: true
        }
      })

      return stats
    } catch (error) {
      console.error('Erreur lors de l\'obtention des statistiques:', error)
      throw error
    }
  }
}

// ===== SERVICE DE RÉCOMPENSES =====

export class RewardTrackingService {
  
  // Créer une récompense
  static async createReward(
    userId: string,
    rewardType: 'promo_code' | 'referral' | 'achievement',
    rewardCode?: string,
    rewardValue?: number,
    rewardData?: any,
    expiresAt?: Date
  ) {
    try {
      return await prisma.rewardTracking.create({
        data: {
          userId,
          rewardType,
          rewardCode,
          rewardValue: rewardValue ? rewardValue : null,
          rewardData: rewardData || {},
          expiresAt,
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors de la création de la récompense:', error)
      throw error
    }
  }

  // Utiliser une récompense
  static async useReward(rewardId: string) {
    try {
      return await prisma.rewardTracking.update({
        where: { id: rewardId },
        data: {
          usedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erreur lors de l\'utilisation de la récompense:', error)
      throw error
    }
  }

  // Obtenir les récompenses disponibles d'un utilisateur
  static async getAvailableRewards(userId: string) {
    try {
      return await prisma.rewardTracking.findMany({
        where: {
          userId,
          usedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des récompenses:', error)
      throw error
    }
  }
}
