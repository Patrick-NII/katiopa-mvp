import express from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { generateAnalysis } from '../services/bubixAnalysisService.js'

const router = express.Router()
const prisma = new PrismaClient()

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
