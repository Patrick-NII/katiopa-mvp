import { Router } from 'express'
import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const router = Router()
const prisma = new PrismaClient()

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Interface pour les données d'analyse
interface AnalysisRequest {
  childProfile: {
    id: string
    name: string
    age?: number
    data: Array<{
      competence: string
      score: number
      maxScore: number
      level: string
    }>
  }
  competence: string
  competenceScore: number
  competenceLevel: string
  contextData?: {
    recentSessions?: any[]
    progressHistory?: any[]
    parentConcerns?: string[]
  }
}

/**
 * Génère le prompt pédagogique pour OpenAI
 */
function generatePedagogicalPrompt(request: AnalysisRequest): string {
  const { childProfile, competence, competenceScore, competenceLevel } = request
  
  return `Tu es un enseignant expérimenté et bienveillant qui rédige un rapport personnalisé pour les parents de ${childProfile.name}${childProfile.age ? `, ${childProfile.age} ans` : ''}.

CONTEXTE :
- Compétence analysée : ${competence}
- Score actuel : ${competenceScore}/10 (niveau ${competenceLevel})
- Profil global de l'enfant : ${JSON.stringify(childProfile.data, null, 2)}

CONSIGNES IMPORTANTES :
1. Écris comme si tu parlais directement aux parents lors d'une réunion
2. Ton doit être chaleureux, rassurant et professionnel
3. Utilise le prénom de l'enfant naturellement dans le texte
4. Évite le jargon technique, privilégie un langage accessible
5. Donne des conseils concrets et réalisables à la maison
6. Sois encourageant même si des difficultés sont identifiées
7. Contextualise par rapport à l'âge de l'enfant
8. Maximum 300 mots pour rester digeste

STRUCTURE SOUHAITÉE :
- Observation générale positive
- Analyse spécifique de la compétence
- Conseils pratiques pour les parents
- Perspective d'évolution encourageante

Exemple de ton : "J'ai le plaisir de vous faire part de mes observations concernant ${childProfile.name}. Dans l'ensemble, je constate que..."

Rédige maintenant le rapport :`
}

/**
 * POST /api/bubix/analyze
 * Génère une nouvelle analyse pédagogique
 */
router.post('/analyze', async (req, res) => {
  try {
    const analysisRequest: AnalysisRequest = req.body

    // 1. Vérifier les limitations quotidiennes
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingAnalysis = await prisma.bubixAnalysis.findFirst({
      where: {
        childId: analysisRequest.childProfile.id,
        competence: analysisRequest.competence,
        createdAt: {
          gte: today
        }
      }
    })

    if (existingAnalysis) {
      return res.status(429).json({
        error: 'DAILY_LIMIT_REACHED',
        message: 'Une analyse a déjà été générée aujourd\'hui pour cette compétence',
        existingAnalysis: {
          id: existingAnalysis.id,
          analysis: existingAnalysis.analysis,
          createdAt: existingAnalysis.createdAt
        }
      })
    }

    // 2. Générer l'analyse avec OpenAI
    const prompt = generatePedagogicalPrompt(analysisRequest)
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modèle économique mais performant
      messages: [
        {
          role: "system",
          content: "Tu es un enseignant expert en pédagogie, spécialisé dans l'évaluation des compétences des enfants. Tu rédiges des rapports clairs et bienveillants pour les parents."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7, // Créativité modérée pour un ton naturel
    })

    const generatedAnalysis = completion.choices[0]?.message?.content

    if (!generatedAnalysis) {
      throw new Error('Aucune analyse générée par OpenAI')
    }

    // 3. Sauvegarder l'analyse en BDD
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 1) // Expire dans 24h

    const savedAnalysis = await prisma.bubixAnalysis.create({
      data: {
        childId: analysisRequest.childProfile.id,
        competence: analysisRequest.competence,
        analysis: generatedAnalysis,
        metadata: {
          score: analysisRequest.competenceScore,
          level: analysisRequest.competenceLevel,
          childName: analysisRequest.childProfile.name,
          age: analysisRequest.childProfile.age,
          fullProfile: analysisRequest.childProfile.data
        },
        expiresAt: expiresAt
      }
    })

    // 4. Retourner la réponse
    res.json({
      id: savedAnalysis.id,
      childId: savedAnalysis.childId,
      competence: savedAnalysis.competence,
      analysis: savedAnalysis.analysis,
      createdAt: savedAnalysis.createdAt,
      expiresAt: savedAnalysis.expiresAt,
      metadata: savedAnalysis.metadata
    })

  } catch (error) {
    console.error('Erreur génération analyse Bubix:', error)
    res.status(500).json({
      error: 'GENERATION_FAILED',
      message: 'Erreur lors de la génération de l\'analyse',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/bubix/analysis/:childId/:competence
 * Récupère l'analyse du jour si elle existe
 */
router.get('/analysis/:childId/:competence', async (req, res) => {
  try {
    const { childId, competence } = req.params
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const analysis = await prisma.bubixAnalysis.findFirst({
      where: {
        childId: childId,
        competence: competence,
        createdAt: {
          gte: today
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!analysis) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Aucune analyse trouvée pour aujourd\'hui'
      })
    }

    res.json({
      id: analysis.id,
      childId: analysis.childId,
      competence: analysis.competence,
      analysis: analysis.analysis,
      createdAt: analysis.createdAt,
      expiresAt: analysis.expiresAt,
      metadata: analysis.metadata
    })

  } catch (error) {
    console.error('Erreur récupération analyse:', error)
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Erreur lors de la récupération de l\'analyse'
    })
  }
})

/**
 * GET /api/bubix/history/:childId
 * Récupère l'historique des analyses (boîte mail des bulletins)
 */
router.get('/history/:childId', async (req, res) => {
  try {
    const { childId } = req.params
    const limit = parseInt(req.query.limit as string) || 20
    
    const analyses = await prisma.bubixAnalysis.findMany({
      where: {
        childId: childId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    const formattedAnalyses = analyses.map(analysis => ({
      id: analysis.id,
      childId: analysis.childId,
      competence: analysis.competence,
      analysis: analysis.analysis,
      createdAt: analysis.createdAt,
      expiresAt: analysis.expiresAt,
      metadata: analysis.metadata
    }))

    res.json(formattedAnalyses)

  } catch (error) {
    console.error('Erreur récupération historique:', error)
    res.status(500).json({
      error: 'HISTORY_FETCH_FAILED',
      message: 'Erreur lors de la récupération de l\'historique'
    })
  }
})

/**
 * GET /api/bubix/can-generate/:childId/:competence
 * Vérifie si une nouvelle analyse peut être générée
 */
router.get('/can-generate/:childId/:competence', async (req, res) => {
  try {
    const { childId, competence } = req.params
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingAnalysis = await prisma.bubixAnalysis.findFirst({
      where: {
        childId: childId,
        competence: competence,
        createdAt: {
          gte: today
        }
      }
    })

    if (existingAnalysis) {
      const nextAvailable = new Date(today)
      nextAvailable.setDate(nextAvailable.getDate() + 1)
      
      return res.json({
        canGenerate: false,
        reason: 'Une analyse a déjà été générée aujourd\'hui pour cette compétence',
        nextAvailableAt: nextAvailable.toISOString()
      })
    }

    res.json({
      canGenerate: true,
      reason: 'Nouvelle analyse disponible'
    })

  } catch (error) {
    console.error('Erreur vérification génération:', error)
    res.status(500).json({
      error: 'CHECK_FAILED',
      message: 'Erreur lors de la vérification'
    })
  }
})

export default router
