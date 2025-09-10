import express from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth'
import { generateAnalysis } from '../services/bubixAnalysisService'

const router = express.Router()
const prisma = new PrismaClient()

// POST /api/bubix/analyze - Route principale d'analyse Bubix (compatible frontend)
router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { prompt, sessionId, analysisType, context } = req.body
    const requestingUserSessionId = req.user.sessionId

    if (!prompt || !sessionId || !analysisType) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres manquants'
      })
    }

    // Vérifier les permissions
    const requestingUser = await prisma.userSession.findUnique({
      where: { id: requestingUserSessionId },
      select: { userType: true, accountId: true }
    })

    if (requestingUser?.userType !== 'PARENT') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé - Seuls les parents peuvent utiliser Bubix'
      })
    }

    // Vérifier que la session appartient au parent
    const targetSession = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        accountId: requestingUser.accountId
      },
      include: {
        account: true,
        activities: true,
        cubeMatchScores: true
      }
    })

    if (!targetSession) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée ou accès non autorisé'
      })
    }

    // Récupérer les données de l'enfant
    let childSession = targetSession
    if (targetSession.userType === 'PARENT') {
      // Si c'est une session parent, récupérer un enfant du même compte
      childSession = await prisma.userSession.findFirst({
        where: {
          accountId: requestingUser.accountId,
          userType: 'CHILD',
          isActive: true
        },
        include: {
          activities: true,
          cubeMatchScores: true
        }
      })
    }

    if (!childSession) {
      return res.status(404).json({
        success: false,
        error: 'Enfant non trouvé pour cette session'
      })
    }

    // Préparer les données pour l'analyse
    const activities = childSession.activities || []
    const cubeMatchScores = childSession.cubeMatchScores || []
    
    const totalActivities = activities.length
    const totalTime = activities.reduce((sum: number, activity: any) => sum + (activity.durationMs || 0), 0)
    
    const activityScores = activities.map(activity => activity.score).filter((score): score is number => score !== null && score !== undefined)
    const cubeMatchScoreValues = cubeMatchScores.map(score => score.score).filter((score): score is number => score !== null && score !== undefined)
    
    const activityAverage = activityScores.length > 0 ? 
      activityScores.reduce((sum: number, score: number) => sum + score, 0) / activityScores.length : 0
    
    const cubeMatchAverage = cubeMatchScoreValues.length > 0 ? 
      cubeMatchScoreValues.reduce((sum: number, score: number) => sum + score, 0) / cubeMatchScoreValues.length : 0
    
    const totalActivitiesCount = activityScores.length + cubeMatchScoreValues.length
    const averageScore = totalActivitiesCount > 0 ? 
      ((activityAverage * activityScores.length) + (cubeMatchAverage * cubeMatchScoreValues.length)) / totalActivitiesCount : 0

    const domains = [...new Set(activities.map(activity => activity.domain).filter(Boolean))]

    const childData = {
      name: `${childSession.firstName} ${childSession.lastName}`,
      age: childSession.age,
      grade: childSession.grade || 'Non spécifié',
      totalActivities,
      averageScore: Math.round(averageScore * 100) / 100,
      totalTime,
      domains,
      sessionId: childSession.id,
      sessionStartTime: childSession.currentSessionStartTime,
      sessionEndTime: childSession.lastLoginAt,
      cubeMatchAnalysis: {
        totalGames: cubeMatchScores.length,
        bestScore: cubeMatchScores.length > 0 ? Math.max(...cubeMatchScoreValues) : 0,
        averageScore: cubeMatchAverage,
        highestLevel: cubeMatchScores.length > 0 ? Math.max(...cubeMatchScores.map(s => s.level)) : 0,
        totalTimePlayed: cubeMatchScores.reduce((sum, score) => sum + Number(score.time_played_ms), 0)
      }
    }

    // Générer l'analyse avec OpenAI (simulation pour l'instant)
    const analysisPrompt = `
Tu es Bubix, l'assistant IA éducatif de CubeAI.

DONNÉES RÉELLES DE L'ENFANT :
- Nom : ${childData.name}
- Âge : ${childData.age} ans
- Classe : ${childData.grade}
- Activités totales : ${childData.totalActivities}
- Score moyen : ${childData.averageScore.toFixed(1)}%
- Temps d'apprentissage : ${Math.round(childData.totalTime / (1000 * 60))} minutes
- Domaines étudiés : ${childData.domains.join(', ') || 'Aucun'}
- Parties CubeMatch : ${childData.cubeMatchAnalysis.totalGames}
- Meilleur score CubeMatch : ${childData.cubeMatchAnalysis.bestScore.toLocaleString()} points
- Score moyen CubeMatch : ${Math.round(childData.cubeMatchAnalysis.averageScore).toLocaleString()} points

PROMPT UTILISATEUR : ${prompt}

Génère une analyse pédagogique constructive et encourageante basée sur ces données réelles.
`

    // Simulation de réponse OpenAI (à remplacer par un vrai appel)
    const bubixResponse = `Analyse pédagogique pour ${childData.name} (${childData.age} ans)

📊 PERFORMANCES GÉNÉRALES
- Score moyen : ${childData.averageScore.toFixed(1)}%
- Temps d'apprentissage : ${Math.round(childData.totalTime / (1000 * 60))} minutes
- Activités réalisées : ${childData.totalActivities}

🎮 PERFORMANCES CUBEMATCH
- Parties jouées : ${childData.cubeMatchAnalysis.totalGames}
- Meilleur score : ${childData.cubeMatchAnalysis.bestScore.toLocaleString()} points
- Score moyen : ${Math.round(childData.cubeMatchAnalysis.averageScore).toLocaleString()} points
- Niveau maximum : ${childData.cubeMatchAnalysis.highestLevel}

💡 RECOMMANDATIONS
- Continuer les activités dans les domaines : ${childData.domains.join(', ') || 'Tous les domaines'}
- Maintenir la régularité dans l'apprentissage
- Encourager la progression dans CubeMatch

Cordialement, Bubix, Assistant IA Éducatif CubeAI`

    res.json({
      success: true,
      response: bubixResponse,
      analysisType,
      sessionId,
      childName: childData.name,
      timestamp: new Date().toISOString(),
      dataUsed: {
        totalActivities: childData.totalActivities,
        averageScore: childData.averageScore,
        totalTimeMinutes: Math.round(childData.totalTime / (1000 * 60)),
        domains: childData.domains,
        cubeMatchAnalysis: childData.cubeMatchAnalysis
      },
      securityInfo: {
        parentVerified: true,
        childVerified: true,
        accountId: requestingUser.accountId,
        childId: childSession.id,
        verificationTimestamp: new Date().toISOString(),
        dataSource: 'database_real_data'
      }
    })

  } catch (error) {
    console.error('Erreur API Bubix:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse par Bubix',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

// POST /api/bubix/analyze-competence - Générer une analyse Bubix pour une compétence
router.post('/analyze-competence', requireAuth, async (req, res) => {
  try {
    const { competenceId, userSessionId } = req.body
    const requestingUserSessionId = req.user.sessionId

    // Vérifier que l'utilisateur peut analyser cette session
    if (requestingUserSessionId !== userSessionId) {
      // Si c'est un parent, vérifier qu'il a accès à cette session enfant
      const requestingUser = await prisma.userSession.findUnique({
        where: { id: requestingUserSessionId },
        select: { userType: true, accountId: true }
      })

      if (requestingUser?.userType !== 'PARENT') {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé'
        })
      }

      const targetUser = await prisma.userSession.findUnique({
        where: { id: userSessionId },
        select: { accountId: true }
      })

      if (targetUser?.accountId !== requestingUser.accountId) {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé à cette session'
        })
      }
    }

    // Vérifier qu'il n'y a pas déjà une analyse aujourd'hui pour cette compétence
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingAnalysis = await prisma.bubixAnalysis.findFirst({
      where: {
        userSessionId,
        competenceId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (existingAnalysis) {
      return res.json({
        success: true,
        data: existingAnalysis,
        message: 'Analyse déjà générée aujourd\'hui pour cette compétence'
      })
    }

    // Récupérer les données nécessaires pour l'analyse
    const analysisData = await getAnalysisData(userSessionId, competenceId)

    // Générer l'analyse avec Bubix
    const analysis = await generateAnalysis(analysisData)

    // Sauvegarder l'analyse
    const savedAnalysis = await prisma.bubixAnalysis.create({
      data: {
        userSessionId,
        competenceId,
        analysis: analysis.text,
        recommendations: analysis.recommendations,
        date: new Date()
      },
      include: {
        competence: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: savedAnalysis,
      message: 'Analyse générée avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la génération de l\'analyse:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la génération de l\'analyse'
    })
  }
})

// GET /api/bubix/analyses/:userSessionId - Récupérer toutes les analyses d'un utilisateur
router.get('/analyses/:userSessionId', requireAuth, async (req, res) => {
  try {
    const { userSessionId } = req.params
    const requestingUserSessionId = req.user.sessionId

    // Vérifier les permissions
    if (requestingUserSessionId !== userSessionId) {
      const requestingUser = await prisma.userSession.findUnique({
        where: { id: requestingUserSessionId },
        select: { userType: true, accountId: true }
      })

      if (requestingUser?.userType !== 'PARENT') {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé'
        })
      }

      const targetUser = await prisma.userSession.findUnique({
        where: { id: userSessionId },
        select: { accountId: true }
      })

      if (targetUser?.accountId !== requestingUser.accountId) {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé à cette session'
        })
      }
    }

    const analyses = await prisma.bubixAnalysis.findMany({
      where: { userSessionId },
      include: {
        competence: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    res.json({
      success: true,
      data: analyses
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des analyses'
    })
  }
})

// GET /api/bubix/competence/:competenceId/analysis/:userSessionId - Récupérer l'analyse d'une compétence spécifique
router.get('/competence/:competenceId/analysis/:userSessionId', requireAuth, async (req, res) => {
  try {
    const { competenceId, userSessionId } = req.params
    const requestingUserSessionId = req.user.sessionId

    // Vérifier les permissions (même logique que ci-dessus)
    if (requestingUserSessionId !== userSessionId) {
      const requestingUser = await prisma.userSession.findUnique({
        where: { id: requestingUserSessionId },
        select: { userType: true, accountId: true }
      })

      if (requestingUser?.userType !== 'PARENT') {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé'
        })
      }

      const targetUser = await prisma.userSession.findUnique({
        where: { id: userSessionId },
        select: { accountId: true }
      })

      if (targetUser?.accountId !== requestingUser.accountId) {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé à cette session'
        })
      }
    }

    const analysis = await prisma.bubixAnalysis.findFirst({
      where: {
        userSessionId,
        competenceId
      },
      include: {
        competence: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Aucune analyse trouvée pour cette compétence'
      })
    }

    res.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'analyse:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'analyse'
    })
  }
})

// Fonction utilitaire pour récupérer les données d'analyse
async function getAnalysisData(userSessionId, competenceId) {
  // Récupérer les informations de l'utilisateur
  const user = await prisma.userSession.findUnique({
    where: { id: userSessionId },
    select: {
      firstName: true,
      lastName: true,
      age: true,
      grade: true,
      gender: true
    }
  })

  // Récupérer la compétence
  const competence = await prisma.competence.findUnique({
    where: { id: competenceId },
    select: {
      name: true,
      type: true,
      description: true
    }
  })

  // Récupérer l'évaluation de compétence
  const assessment = await prisma.competenceAssessment.findUnique({
    where: {
      competenceId_userSessionId: {
        competenceId,
        userSessionId
      }
    }
  })

  // Récupérer les tentatives d'exercices récentes
  const recentAttempts = await prisma.exerciseAttempt.findMany({
    where: {
      userSessionId,
      exercise: {
        competenceId
      },
      completedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
      }
    },
    include: {
      exercise: {
        select: {
          title: true,
          type: true,
          difficulty: true
        }
      }
    },
    orderBy: { completedAt: 'desc' },
    take: 10
  })

  // Récupérer les analyses précédentes pour contexte
  const previousAnalyses = await prisma.bubixAnalysis.findMany({
    where: {
      userSessionId,
      competenceId
    },
    orderBy: { date: 'desc' },
    take: 3
  })

  return {
    user,
    competence,
    assessment,
    recentAttempts,
    previousAnalyses
  }
}

export default router
