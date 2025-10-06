import { Router } from 'express'

const router = Router()

/**
 * GET /api/bubix/test
 * Route de test simple
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Service Bubix Analysis fonctionnel',
    timestamp: new Date().toISOString()
  })
})

/**
 * GET /api/bubix/can-generate/:childId/:competence
 * Version simplifiée pour tester
 */
router.get('/can-generate/:childId/:competence', (req, res) => {
  try {
    const { childId, competence } = req.params
    
    // Pour l'instant, on autorise toujours la génération
    res.json({
      canGenerate: true,
      reason: 'Test - Nouvelle analyse disponible',
      childId,
      competence
    })

  } catch (error) {
    console.error('Erreur vérification génération:', error)
    res.status(500).json({
      error: 'CHECK_FAILED',
      message: 'Erreur lors de la vérification'
    })
  }
})

/**
 * POST /api/bubix/analyze
 * Version de test pour générer une analyse
 */
router.post('/analyze', (req, res) => {
  try {
    const { childProfile, competence, competenceScore, competenceLevel } = req.body
    
    // Analyse de test personnalisée
    const analysisText = `J'ai le plaisir de vous faire part de mes observations concernant ${childProfile.name} en ${competence}.

Dans l'ensemble, je constate que ${childProfile.name} montre une belle progression dans ce domaine. Avec un score de ${competenceScore}/10, ${childProfile.name} se situe à un niveau ${competenceLevel.toLowerCase()}.

Ce qui me frappe particulièrement, c'est sa capacité à progresser de manière constante. ${childProfile.name} fait preuve d'une bonne compréhension des concepts fondamentaux.

Pour continuer à l'accompagner à la maison, je vous suggère de maintenir un environnement d'apprentissage stimulant et bienveillant.

Je suis confiant dans la progression de ${childProfile.name}. Avec votre soutien, ${childProfile.name} devrait continuer à s'épanouir dans cette compétence.`

    // Simuler une réponse d'analyse
    const analysis = {
      id: `analysis-${Date.now()}`,
      childId: childProfile.id,
      competence,
      analysis: analysisText,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      metadata: {
        score: competenceScore,
        level: competenceLevel,
        childName: childProfile.name,
        age: childProfile.age
      }
    }

    res.json(analysis)

  } catch (error) {
    console.error('Erreur génération analyse:', error)
    res.status(500).json({
      error: 'GENERATION_FAILED',
      message: 'Erreur lors de la génération de l\'analyse'
    })
  }
})

export default router
