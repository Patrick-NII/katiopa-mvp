import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Routes de test sans authentification pour le développement

// GET /api/sessions-test/current - Récupérer la session actuelle (test)
router.get('/current', async (req, res) => {
  try {
    console.log('🔍 Récupération de la session actuelle (test)...')

    // Essayer de récupérer la session depuis les cookies ou headers
    let targetSessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string

    if (targetSessionId) {
      console.log('🎯 Session ID trouvé dans les cookies/headers:', targetSessionId)
      
      const session = await prisma.userSession.findUnique({
        where: { sessionId: targetSessionId },
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

      if (session && session.isActive) {
        console.log('✅ Session trouvée via cookies/headers:', session.firstName, session.sessionId)
        return res.json({
          success: true,
          data: session
        })
      }
    }

    // Fallback: Récupérer la session la plus récente (avec lastLoginAt le plus récent)
    console.log('⚠️ Aucune session dans les cookies, utilisation du fallback')
    const session = await prisma.userSession.findFirst({
      where: {
        userType: 'CHILD',
        isActive: true,
        lastLoginAt: { not: null }
      },
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
      },
      orderBy: { lastLoginAt: 'desc' }
    })

    if (!session) {
      // Si aucune session avec lastLoginAt, prendre la plus récente créée
      const fallbackSession = await prisma.userSession.findFirst({
        where: {
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
          userType: true,
          accountId: true,
          createdAt: true,
          lastLoginAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!fallbackSession) {
        return res.status(404).json({
          success: false,
          error: 'Aucune session enfant active trouvée'
        })
      }

      console.log('✅ Session de fallback trouvée:', fallbackSession.firstName, fallbackSession.sessionId)
      return res.json({
        success: true,
        data: fallbackSession
      })
    }

    console.log('✅ Session active trouvée:', session.firstName, session.sessionId, 'dernière connexion:', session.lastLoginAt)

    res.json({
      success: true,
      data: session
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la session actuelle:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de la session'
    })
  }
})

// GET /api/sessions-test/children - Récupérer les sessions enfants (test)
router.get('/children', async (req, res) => {
  try {
    console.log('🔍 Récupération des sessions enfants (test)...')

    // Récupérer toutes les sessions enfants
    const childSessions = await prisma.userSession.findMany({
      where: {
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

    console.log(`✅ Trouvé ${childSessions.length} sessions enfants`)

    res.json({
      success: true,
      data: childSessions
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des sessions enfants:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des sessions enfants'
    })
  }
})

// GET /api/sessions-test/:id/competences - Récupérer les compétences d'une session (test)
router.get('/:id/competences', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`🔍 Récupération des compétences pour la session: ${id}`)

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

    console.log(`📊 Trouvé ${assessments.length} évaluations pour la session ${id}`)

    // Si aucune évaluation, créer des évaluations par défaut
    if (assessments.length === 0) {
      console.log('⚠️ Aucune évaluation trouvée, création des évaluations par défaut...')
      
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

    console.log('✅ Données radar générées:', radarData.length, 'compétences')

    res.json({
      success: true,
      data: {
        assessments,
        radarData
      }
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des compétences:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des compétences'
    })
  }
})

export default router