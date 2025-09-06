import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Fonction pour vérifier l'authentification côté serveur
async function verifyAuthServerSide(request: NextRequest): Promise<any> {
  try {
    const token = request.cookies.get('authToken')?.value

    console.log('🔍 Vérification auth - token trouvé:', token ? 'Oui' : 'Non')
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV)

    // En mode développement, utiliser une approche simplifiée SEULEMENT si pas de token
    if (!token && process.env.NODE_ENV === 'development') {
      console.log('🔧 Mode développement - authentification simplifiée (pas de token)')
      
      // Récupérer directement le parent de test
      const parent = await prisma.userSession.findFirst({
        where: {
          userType: 'PARENT',
          isActive: true
        },
        include: {
          account: true
        }
      })
      
      if (parent) {
        console.log('✅ Parent trouvé en mode dev:', parent.firstName)
        return parent
      } else {
        console.log('❌ Aucun parent trouvé en mode dev')
        return null
      }
    }

    // Vérifier le token JWT (approche normale)
    let decoded: any
    try {
      decoded = jwt.verify(token!, process.env.JWT_SECRET || 'your-secret-key') as any
    } catch (error) {
      console.log('❌ Token JWT invalide:', error)
      return null
    }
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Token invalide ou pas de userId')
      return null
    }

    console.log('🔍 Recherche utilisateur avec userId:', decoded.userId)

    // Récupérer directement depuis la base de données avec Prisma
    const userSession = await prisma.userSession.findUnique({
      where: {
        id: decoded.userId
      },
      include: {
        account: true
      }
    })

    if (!userSession) {
      console.log('❌ Utilisateur non trouvé en base')
      return null
    }

    console.log('✅ Utilisateur trouvé:', userSession.firstName)
    return userSession
  } catch (error) {
    console.error('❌ Erreur auth:', error)
    return null
  }
}

// Fonction pour récupérer les données d'une session enfant pour les conseils
async function getSessionDataForAdvice(sessionId: string) {
  try {
    // Récupérer la session enfant
    const childSession = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { account: true }
    })

    if (!childSession || childSession.userType !== 'CHILD') {
      throw new Error('Session enfant non trouvée')
    }

    // Récupérer les activités récentes
    const activities = await prisma.activity.findMany({
      where: { userSessionId: sessionId },
      orderBy: { createdAt: 'desc' },
      take: 15
    })

    // Récupérer les sessions d'apprentissage
    const learningSessions = await prisma.learningSession.findMany({
      where: { userSessionId: sessionId },
      orderBy: { startTime: 'desc' },
      take: 10
    })

    // Récupérer les données CubeMatch
    const cubeMatchScores = await prisma.CubeMatchScore.findMany({
      where: { userId: sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Récupérer les préférences parentales si elles existent
    const parentPreferences = await prisma.ParentPreferences.findFirst({
      where: { userSessionId: sessionId }
    })

    // Calculer les statistiques
    const totalTime = learningSessions.reduce((sum, session) => 
      sum + (session.endTime ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime() : 0), 0
    )

    const averageScore = activities.length > 0 
      ? activities.reduce((sum, activity) => sum + (activity.score || 0), 0) / activities.length 
      : 0

    // Identifier les domaines faibles et forts
    const domainScores = activities.reduce((acc: any, activity) => {
      if (!acc[activity.domain]) {
        acc[activity.domain] = { scores: [], count: 0 }
      }
      acc[activity.domain].scores.push(activity.score || 0)
      acc[activity.domain].count++
      return acc
    }, {})

    const domainAnalysis = Object.entries(domainScores).map(([domain, data]: [string, any]) => ({
      domain,
      averageScore: Math.round(data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length),
      count: data.count,
      needsImprovement: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length < 70
    }))

    const weakDomains = domainAnalysis.filter(d => d.needsImprovement).map(d => d.domain)
    const strongDomains = domainAnalysis.filter(d => !d.needsImprovement).map(d => d.domain)

    return {
      child: {
        name: `${childSession.account.firstName} ${childSession.account.lastName}`,
        age: childSession.account.age || 8,
        grade: childSession.account.grade || 'CE2'
      },
      stats: {
        totalActivities: activities.length,
        totalTimeMinutes: Math.round(totalTime / 60000),
        averageScore: Math.round(averageScore),
        totalCubeMatchGames: cubeMatchScores.length,
        averageCubeMatchScore: cubeMatchScores.length > 0 
          ? Math.round(cubeMatchScores.reduce((sum, score) => sum + score.score, 0) / cubeMatchScores.length)
          : 0
      },
      domainAnalysis,
      weakDomains,
      strongDomains,
      recentActivities: activities.slice(0, 8),
      recentCubeMatch: cubeMatchScores.slice(0, 5),
      parentPreferences: parentPreferences ? {
        focusAreas: parentPreferences.focusAreas || [],
        learningGoals: parentPreferences.learningGoals || [],
        concerns: parentPreferences.concerns || []
      } : null
    }
  } catch (error) {
    console.error('❌ Erreur récupération données conseils:', error)
    throw error
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    // Vérifier l'authentification
    const userInfo = await verifyAuthServerSide(request)
    if (!userInfo || userInfo.userType !== 'PARENT') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les données de la session
    const sessionData = await getSessionDataForAdvice(sessionId)

    // Construire le prompt pour l'IA
    const systemPrompt = `Tu es Bubix, l'expert pédagogique de CubeAI. Tu dois générer des conseils personnalisés et des exercices adaptés pour ${sessionData.child.name}.

INSTRUCTIONS:
- Analyse les performances et identifie les besoins spécifiques
- Propose des conseils pratiques et réalisables
- Crée des exercices concrets et adaptés à l'âge
- Structure ta réponse de manière claire et actionnable
- Reste encourageant et motivant

DONNÉES DE L'ENFANT:
- Nom: ${sessionData.child.name} (${sessionData.child.age} ans, ${sessionData.child.grade})
- ${sessionData.stats.totalActivities} activités réalisées
- Score moyen: ${sessionData.stats.averageScore}%
- ${sessionData.stats.totalCubeMatchGames} parties CubeMatch jouées
- Score moyen CubeMatch: ${sessionData.stats.averageCubeMatchScore}

ANALYSE PAR DOMAINE:
${sessionData.domainAnalysis.map(d => 
  `- ${d.domain}: ${d.averageScore}% (${d.count} activités) ${d.needsImprovement ? '⚠️ À améliorer' : '✅ Bien maîtrisé'}`
).join('\n')}

DOMAINES À AMÉLIORER: ${sessionData.weakDomains.join(', ') || 'Aucun identifié'}
DOMAINES FORTS: ${sessionData.strongDomains.join(', ') || 'Aucun identifié'}

PRÉFÉRENCES PARENTALES:
${sessionData.parentPreferences ? `
- Domaines d'attention: ${sessionData.parentPreferences.focusAreas.join(', ')}
- Objectifs d'apprentissage: ${sessionData.parentPreferences.learningGoals.join(', ')}
- Préoccupations: ${sessionData.parentPreferences.concerns.join(', ')}
` : 'Aucune préférence spécifiée'}

ACTIVITÉS RÉCENTES:
${sessionData.recentActivities.map(activity => 
  `- ${activity.title} (${activity.domain}): ${activity.score}%`
).join('\n')}

Génère une réponse structurée avec:
1. **DIAGNOSTIC** - Analyse des forces et faiblesses
2. **CONSEILS PRATIQUES** - Recommandations spécifiques pour les parents
3. **EXERCICES ADAPTÉS** - Activités concrètes à proposer à l'enfant
4. **PLAN D'ACTION** - Étapes à suivre pour les prochaines semaines
5. **MOTIVATION** - Encouragements et objectifs réalistes`

    // Appeler l'IA
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Génère les conseils et exercices pour ${sessionData.child.name}` }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const exercise = completion.choices[0]?.message?.content || 'Erreur lors de la génération des conseils'

    // Sauvegarder l'analyse dans la base de données
    const savedAnalysis = await prisma.ParentPrompt.create({
      data: {
        content: exercise,
        type: 'ANALYSIS_REQUEST',
        status: 'COMPLETED',
        userSessionId: userInfo.id,
        childSessionId: sessionId,
        metadata: {
          analysisType: 'conseils_exercices',
          childName: sessionData.child.name,
          stats: sessionData.stats,
          weakDomains: sessionData.weakDomains,
          strongDomains: sessionData.strongDomains
        }
      }
    })

    return NextResponse.json({
      success: true,
      exercise,
      sessionData: {
        childName: sessionData.child.name,
        stats: sessionData.stats,
        weakDomains: sessionData.weakDomains,
        strongDomains: sessionData.strongDomains,
        domainAnalysis: sessionData.domainAnalysis
      },
      analysisId: savedAnalysis.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur génération conseils:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération des conseils',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
