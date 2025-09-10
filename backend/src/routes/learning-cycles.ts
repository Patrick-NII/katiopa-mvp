import express from 'express'

const router = express.Router()

// Route temporaire pour les cycles d'apprentissage
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Route /learning-cycles appelée (temporaire)')
    
    // Retourner des données de test pour éviter l'erreur 500
    const mockCycle = {
      id: 'test-cycle',
      weekStart: new Date().toISOString(),
      weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedDays: [],
      totalProgress: 0,
      childInfo: {
        name: 'Milan Test',
        sessionId: 'milan-session',
        age: 8
      },
      preferences: {
        learningStyle: ['visuel'],
        interests: ['mathématiques'],
        preferredModules: ['calcul'],
        communicationStyle: 'encouragement',
        difficultyPreference: 'moyen',
        sessionLength: 15,
        timeOfDay: ['matin'],
        weeklyGoals: {}
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    res.json({
      success: true,
      data: mockCycle
    })
  } catch (error) {
    console.error('❌ Erreur dans /learning-cycles:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    })
  }
})

// Route PUT pour les préférences
router.put('/', async (req, res) => {
  try {
    console.log('🔍 Route PUT /learning-cycles appelée (temporaire)')
    
    res.json({
      success: true,
      data: { message: 'Préférences mises à jour (simulation)' }
    })
  } catch (error) {
    console.error('❌ Erreur dans PUT /learning-cycles:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    })
  }
})

export default router

