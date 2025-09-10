import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Route de test simple pour les compétences
router.get('/test-competences', async (req, res) => {
  try {
    const competences = await prisma.competence.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        icon: true,
        color: true
      }
    })

    res.json({
      success: true,
      data: competences,
      message: 'Compétences chargées avec succès'
    })
  } catch (error) {
    console.error('Erreur lors du chargement des compétences:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du chargement des compétences'
    })
  }
})

// Route de test pour les données radar
router.get('/test-radar/:userSessionId', async (req, res) => {
  try {
    const { userSessionId } = req.params

    // Créer des données de test si aucune évaluation n'existe
    const assessments = await prisma.competenceAssessment.findMany({
      where: { userSessionId },
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

    // Si aucune donnée, créer des données de test
    if (assessments.length === 0) {
      const competences = await prisma.competence.findMany()
      
      for (const competence of competences) {
        await prisma.competenceAssessment.create({
          data: {
            competenceId: competence.id,
            userSessionId,
            score: Math.random() * 10, // Score aléatoire entre 0 et 10
            level: 'Débutant',
            progress: Math.random() * 100,
            lastUpdated: new Date()
          }
        })
      }
    }

    // Récupérer les données mises à jour
    const updatedAssessments = await prisma.competenceAssessment.findMany({
      where: { userSessionId },
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

    // Transformer les données pour le radar chart
    const radarData = updatedAssessments.map(assessment => ({
      competence: assessment.competence.type.toLowerCase(),
      score: assessment.score,
      maxScore: 10,
      level: assessment.level,
      progress: assessment.progress
    }))

    res.json({
      success: true,
      data: {
        assessments: updatedAssessments,
        radarData
      }
    })
  } catch (error) {
    console.error('Erreur lors du chargement des données radar:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du chargement des données radar'
    })
  }
})

export default router

