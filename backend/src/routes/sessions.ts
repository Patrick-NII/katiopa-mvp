import express from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/sessions/children - Récupérer les sessions enfants d'un compte parent
router.get('/children', requireAuth, async (req, res) => {
  try {
    const accountId = req.user.accountId

    // Récupérer toutes les sessions enfants du compte
    const childSessions = await prisma.userSession.findMany({
      where: {
        accountId,
        userType: 'CHILD',
        isActive: true
      },
      select: {
        id: true,
        sessionId: true,
        firstName: true,
        lastName: true,
        age: true,
        grade: true,
        gender: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { firstName: 'asc' }
    })

    res.json({
      success: true,
      data: childSessions
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions enfants:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des sessions enfants'
    })
  }
})

// GET /api/sessions/current - Récupérer la session actuelle
router.get('/current', requireAuth, async (req, res) => {
  try {
    const sessionId = req.user.sessionId

    const session = await prisma.userSession.findUnique({
      where: { sessionId },
      select: {
        id: true,
        sessionId: true,
        firstName: true,
        lastName: true,
        age: true,
        grade: true,
        gender: true,
        userType: true,
        accountId: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      })
    }

    res.json({
      success: true,
      data: session
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de la session actuelle:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de la session'
    })
  }
})

// GET /api/sessions/:id/competences - Récupérer les compétences d'une session spécifique
router.get('/:id/competences', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const requestingUser = req.user

    // Vérifier les permissions
    if (requestingUser.userType === 'CHILD' && requestingUser.sessionId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      })
    }

    if (requestingUser.userType === 'PARENT') {
      // Vérifier que la session appartient au même compte
      const targetSession = await prisma.userSession.findUnique({
        where: { id },
        select: { accountId: true }
      })

      if (!targetSession || targetSession.accountId !== requestingUser.accountId) {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé à cette session'
        })
      }
    }

    // Récupérer les évaluations de compétences
    const assessments = await prisma.competenceAssessment.findMany({
      where: { userSessionId: id },
      include: {
        competence: {
          select: {
            id: true,
            type: true,
            name: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { lastUpdated: 'desc' }
    })

    // Si aucune évaluation, créer des évaluations par défaut
    if (assessments.length === 0) {
      const competences = await prisma.competence.findMany()
      
      for (const competence of competences) {
        await prisma.competenceAssessment.create({
          data: {
            competenceId: competence.id,
            userSessionId: id,
            score: 0,
            level: 'Débutant',
            progress: 0,
            lastUpdated: new Date()
          }
        })
      }

      // Récupérer les évaluations créées
      const newAssessments = await prisma.competenceAssessment.findMany({
        where: { userSessionId: id },
        include: {
          competence: {
            select: {
              id: true,
              type: true,
              name: true,
              icon: true,
              color: true
            }
          }
        }
      })

      const radarData = newAssessments.map(assessment => ({
        competence: assessment.competence.type.toLowerCase(),
        score: assessment.score,
        maxScore: 10,
        level: assessment.level,
        progress: assessment.progress
      }))

      return res.json({
        success: true,
        data: {
          assessments: newAssessments,
          radarData
        }
      })
    }

    // Transformer les données pour le radar chart
    const radarData = assessments.map(assessment => ({
      competence: assessment.competence.type.toLowerCase(),
      score: assessment.score,
      maxScore: 10,
      level: assessment.level,
      progress: assessment.progress
    }))

    res.json({
      success: true,
      data: {
        assessments,
        radarData
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des compétences:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des compétences'
    })
  }
})

export default router