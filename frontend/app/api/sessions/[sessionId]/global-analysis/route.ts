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

// Fonction pour récupérer les données complètes d'une session enfant
async function getGlobalSessionData(sessionId: string) {
  try {
    // Récupérer la session enfant
    const childSession = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { account: true }
    })

    if (!childSession || childSession.userType !== 'CHILD') {
      throw new Error('Session enfant non trouvée')
    }

    // Récupérer toutes les activités
    const activities = await prisma.activity.findMany({
      where: { userSessionId: sessionId },
      orderBy: { createdAt: 'desc' }
    })

    // Récupérer toutes les sessions d'apprentissage
    const learningSessions = await prisma.learningSession.findMany({
      where: { userSessionId: sessionId },
      orderBy: { startTime: 'desc' }
    })

    // Récupérer toutes les données CubeMatch
    const cubeMatchScores = await prisma.CubeMatchScore.findMany({
      where: { userId: sessionId },
      orderBy: { createdAt: 'desc' }
    })

    // Calculer les statistiques avancées
    const totalTime = learningSessions.reduce((sum, session) => 
      sum + (session.endTime ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime() : 0), 0
    )

    const averageScore = activities.length > 0 
      ? activities.reduce((sum, activity) => sum + (activity.score || 0), 0) / activities.length 
      : 0

    // Analyse par domaine
    const domainAnalysis = activities.reduce((acc: any, activity) => {
      if (!acc[activity.domain]) {
        acc[activity.domain] = { count: 0, totalScore: 0, scores: [] }
      }
      acc[activity.domain].count++
      acc[activity.domain].totalScore += activity.score || 0
      acc[activity.domain].scores.push(activity.score || 0)
      return acc
    }, {})

    // Calculer les moyennes par domaine
    Object.keys(domainAnalysis).forEach(domain => {
      const scores = domainAnalysis[domain].scores.filter((s: number) => s > 0)
      domainAnalysis[domain].averageScore = scores.length > 0 
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) 
        : 0
      domainAnalysis[domain].bestScore = Math.max(...scores, 0)
    })

    // Analyse temporelle des sessions
    const sessionPatterns = learningSessions.reduce((acc: any, session) => {
      const hour = new Date(session.startTime).getHours()
      if (hour >= 6 && hour < 12) acc.morning++
      else if (hour >= 12 && hour < 18) acc.afternoon++
      else acc.evening++
      return acc
    }, { morning: 0, afternoon: 0, evening: 0 })

    // Calculer la fréquence d'apprentissage
    const daysSinceRegistration = childSession.account.createdAt 
      ? Math.floor((new Date().getTime() - new Date(childSession.account.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 30

    const learningFrequency = daysSinceRegistration > 0 
      ? Math.round((learningSessions.length / daysSinceRegistration) * 7) // sessions par semaine
      : 0

    return {
      child: {
        name: `${childSession.account.firstName} ${childSession.account.lastName}`,
        age: childSession.account.age || 8,
        grade: childSession.account.grade || 'CE2',
        createdAt: childSession.account.createdAt
      },
      stats: {
        totalActivities: activities.length,
        totalTimeMinutes: Math.round(totalTime / 60000),
        averageScore: Math.round(averageScore),
        totalCubeMatchGames: cubeMatchScores.length,
        averageCubeMatchScore: cubeMatchScores.length > 0 
          ? Math.round(cubeMatchScores.reduce((sum, score) => sum + score.score, 0) / cubeMatchScores.length)
          : 0,
        daysSinceRegistration,
        learningFrequency,
        averageSessionDuration: learningSessions.length > 0 
          ? Math.round(totalTime / learningSessions.length / 60000)
          : 0
      },
      domainAnalysis,
      sessionPatterns,
      preferredTimeSlots: Object.keys(sessionPatterns).reduce((a, b) => 
        sessionPatterns[a] > sessionPatterns[b] ? a : b
      ),
      recentActivities: activities.slice(0, 10),
      recentCubeMatch: cubeMatchScores.slice(0, 5)
    }
  } catch (error) {
    console.error('❌ Erreur récupération données globales:', error)
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

    // Récupérer les données complètes de la session
    const sessionData = await getGlobalSessionData(sessionId)

    // Construire le prompt pour l'IA
    const systemPrompt = `Tu es Bubix, l'expert pédagogique de CubeAI. Tu dois générer une appréciation détaillée et complète de l'apprentissage de ${sessionData.child.name}.

INSTRUCTIONS:
- Analyse en profondeur les performances et le comportement d'apprentissage
- Identifie les forces et les domaines d'amélioration
- Propose des recommandations personnalisées
- Structure ta réponse de manière professionnelle
- Sois encourageant tout en restant factuel

DONNÉES COMPLÈTES:
- Enfant: ${sessionData.child.name} (${sessionData.child.age} ans, ${sessionData.child.grade})
- Inscrit depuis: ${sessionData.stats.daysSinceRegistration} jours
- ${sessionData.stats.totalActivities} activités réalisées
- ${sessionData.stats.totalTimeMinutes} minutes de temps total
- Score moyen: ${sessionData.stats.averageScore}%
- Fréquence: ${sessionData.stats.learningFrequency} sessions/semaine
- Durée moyenne session: ${sessionData.stats.averageSessionDuration} minutes

ANALYSE PAR DOMAINE:
${Object.entries(sessionData.domainAnalysis).map(([domain, data]: [string, any]) => 
  `- ${domain}: ${data.count} activités, score moyen ${data.averageScore}%, meilleur score ${data.bestScore}%`
).join('\n')}

PATTERNS TEMPORELS:
- Matin: ${sessionData.sessionPatterns.morning} sessions
- Après-midi: ${sessionData.sessionPatterns.afternoon} sessions  
- Soir: ${sessionData.sessionPatterns.evening} sessions
- Période préférée: ${sessionData.preferredTimeSlots}

PERFORMANCES CUBEMATCH:
- ${sessionData.stats.totalCubeMatchGames} parties jouées
- Score moyen: ${sessionData.stats.averageCubeMatchScore}

Génère une appréciation détaillée avec:
1. Évaluation générale des performances
2. Analyse des forces identifiées
3. Domaines nécessitant une attention particulière
4. Recommandations personnalisées
5. Plan d'action pour les prochaines semaines`

    // Appeler l'IA
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Génère l'appréciation détaillée pour ${sessionData.child.name}` }
      ],
      max_tokens: 1200,
      temperature: 0.7
    })

    const analysis = completion.choices[0]?.message?.content || 'Erreur lors de la génération de l\'appréciation'

    // Sauvegarder l'analyse dans la base de données
    const savedAnalysis = await prisma.ParentPrompt.create({
      data: {
        content: analysis,
        type: 'ANALYSIS_REQUEST',
        status: 'COMPLETED',
        userSessionId: userInfo.id,
        childSessionId: sessionId,
        metadata: {
          analysisType: 'appreciation',
          childName: sessionData.child.name,
          stats: sessionData.stats,
          domainAnalysis: sessionData.domainAnalysis
        }
      }
    })

    return NextResponse.json({
      success: true,
      analysis: {
        aiAnalysis: analysis,
        context: {
          daysSinceRegistration: sessionData.stats.daysSinceRegistration,
          totalLearningTime: sessionData.stats.totalTimeMinutes,
          averageSessionDuration: sessionData.stats.averageSessionDuration,
          learningFrequency: sessionData.stats.learningFrequency,
          sessionPatterns: sessionData.sessionPatterns,
          preferredTimeSlots: sessionData.preferredTimeSlots,
          age: sessionData.child.age,
          grade: sessionData.child.grade,
          totalActivities: sessionData.stats.totalActivities,
          averageScore: sessionData.stats.averageScore
        }
      },
      sessionData: {
        childName: sessionData.child.name,
        stats: sessionData.stats,
        domainAnalysis: sessionData.domainAnalysis,
        sessionPatterns: sessionData.sessionPatterns
      },
      analysisId: savedAnalysis.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur analyse globale:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'analyse globale',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
