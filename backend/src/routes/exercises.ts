import express from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// POST /api/exercises/:id/attempt - Soumettre une tentative d'exercice
router.post('/:id/attempt', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { score, timeSpent, answers, feedback } = req.body
    const userSessionId = req.user.sessionId

    // Vérifier que l'exercice existe
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: { competence: true }
    })

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercice non trouvé'
      })
    }

    // Créer la tentative
    const attempt = await prisma.exerciseAttempt.create({
      data: {
        exerciseId: id,
        userSessionId,
        score: Math.max(0, Math.min(100, score || 0)),
        timeSpent: timeSpent || 0,
        answers: answers || null,
        feedback: feedback || null,
        completedAt: new Date()
      }
    })

    // Mettre à jour l'évaluation de compétence
    await updateCompetenceAssessment(userSessionId, exercise.competenceId)

    res.json({
      success: true,
      data: attempt,
      message: 'Tentative enregistrée avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la tentative:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'enregistrement de la tentative'
    })
  }
})

// Fonction utilitaire pour mettre à jour l'évaluation de compétence
async function updateCompetenceAssessment(userSessionId, competenceId) {
  try {
    // Calculer le score moyen des tentatives récentes
    const recentAttempts = await prisma.exerciseAttempt.findMany({
      where: {
        userSessionId,
        exercise: {
          competenceId
        },
        completedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
        }
      },
      include: {
        exercise: true
      },
      orderBy: { completedAt: 'desc' },
      take: 10 // 10 dernières tentatives
    })

    if (recentAttempts.length === 0) return

    // Calculer le score moyen pondéré par la difficulté
    const totalWeightedScore = recentAttempts.reduce((sum, attempt) => {
      const weight = attempt.exercise.difficulty / 5 // Poids basé sur la difficulté
      return sum + (attempt.score * weight)
    }, 0)

    const totalWeight = recentAttempts.reduce((sum, attempt) => {
      return sum + (attempt.exercise.difficulty / 5)
    }, 0)

    const averageScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0
    const normalizedScore = Math.min(10, Math.max(0, averageScore / 10)) // Normaliser sur 10

    // Déterminer le niveau
    const level = getLevelFromScore(normalizedScore)
    const progress = (normalizedScore / 10) * 100

    // Upsert l'évaluation
    await prisma.competenceAssessment.upsert({
      where: {
        competenceId_userSessionId: {
          competenceId,
          userSessionId
        }
      },
      update: {
        score: normalizedScore,
        level,
        progress,
        lastUpdated: new Date()
      },
      create: {
        competenceId,
        userSessionId,
        score: normalizedScore,
        level,
        progress,
        lastUpdated: new Date()
      }
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'évaluation:', error)
  }
}

// Fonction utilitaire pour déterminer le niveau
function getLevelFromScore(score) {
  if (score >= 9) return 'Maître'
  if (score >= 7.5) return 'Expert'
  if (score >= 6) return 'Avancé'
  if (score >= 4) return 'Intermédiaire'
  return 'Débutant'
}

export default router
