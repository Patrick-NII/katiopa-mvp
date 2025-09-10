import express from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/competences - Récupérer toutes les compétences
router.get('/', async (req, res) => {
  try {
    const competences = await prisma.competence.findMany({
      include: {
        exercises: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            difficulty: true,
            estimatedTime: true
          }
        },
        _count: {
          select: {
            exercises: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    res.json({
      success: true,
      data: competences
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des compétences:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des compétences'
    })
  }
})

// GET /api/competences/:id/exercises - Récupérer les exercices d'une compétence
router.get('/:id/exercises', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { difficulty, type } = req.query

    const whereClause = {
      competenceId: id,
      isActive: true
    }

    if (difficulty) {
      whereClause.difficulty = parseInt(difficulty)
    }

    if (type) {
      whereClause.type = type
    }

    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        difficulty: true,
        estimatedTime: true,
        instructions: true,
        content: true
      },
      orderBy: { difficulty: 'asc' }
    })

    res.json({
      success: true,
      data: exercises
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des exercices'
    })
  }
})


// GET /api/user-sessions/:id/competences - Récupérer les compétences d'un utilisateur
router.get('/:id/competences', async (req, res) => {
  try {
    const { id } = req.params

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
    console.error('Erreur lors de la récupération des compétences utilisateur:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des compétences'
    })
  }
})


export default router
