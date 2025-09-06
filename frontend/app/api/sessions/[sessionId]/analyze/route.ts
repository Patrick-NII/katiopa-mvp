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

// Fonction pour récupérer les données d'une session enfant
async function getSessionData(sessionId: string) {
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
      take: 20
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

    // Calculer les statistiques
    const totalTime = learningSessions.reduce((sum, session) => 
      sum + (session.endTime ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime() : 0), 0
    )

    const averageScore = activities.length > 0 
      ? activities.reduce((sum, activity) => sum + (activity.score || 0), 0) / activities.length 
      : 0

    return {
      child: {
        name: `${childSession.account.firstName} ${childSession.account.lastName}`,
        age: childSession.account.age || 8,
        grade: childSession.account.grade || 'CE2'
      },
      activities: activities.map(activity => ({
        title: activity.title,
        domain: activity.domain,
        score: activity.score,
        duration: activity.durationMs ? Math.round(activity.durationMs / 60000) : 0,
        createdAt: activity.createdAt
      })),
      learningSessions: learningSessions.map(session => ({
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.endTime 
          ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
          : 0
      })),
      cubeMatchScores: cubeMatchScores.map(score => ({
        score: score.score,
        level: score.level,
        operator: score.operator,
        accuracyRate: score.accuracyRate,
        createdAt: score.createdAt
      })),
      stats: {
        totalActivities: activities.length,
        totalTimeMinutes: Math.round(totalTime / 60000),
        averageScore: Math.round(averageScore),
        totalCubeMatchGames: cubeMatchScores.length,
        averageCubeMatchScore: cubeMatchScores.length > 0 
          ? Math.round(cubeMatchScores.reduce((sum, score) => sum + score.score, 0) / cubeMatchScores.length)
          : 0
      }
    }
  } catch (error) {
    console.error('❌ Erreur récupération données session:', error)
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
    const sessionData = await getSessionData(sessionId)

    // Construire le prompt pour l'IA
    const systemPrompt = `Tu es Bubix, l'expert pédagogique de CubeAI. Tu dois générer un compte rendu précis et concis de la session d'apprentissage de ${sessionData.child.name}.

INSTRUCTIONS:
- Sois précis et factuel
- Utilise les données réelles fournies
- Structure ta réponse en sections claires
- Propose des observations concrètes
- Reste professionnel et encourageant

DONNÉES DE LA SESSION:
- Enfant: ${sessionData.child.name} (${sessionData.child.age} ans, ${sessionData.child.grade})
- ${sessionData.stats.totalActivities} activités réalisées
- ${sessionData.stats.totalTimeMinutes} minutes de temps total
- Score moyen: ${sessionData.stats.averageScore}%
- ${sessionData.stats.totalCubeMatchGames} parties CubeMatch jouées
- Score moyen CubeMatch: ${sessionData.stats.averageCubeMatchScore}

ACTIVITÉS RÉCENTES:
${sessionData.activities.slice(0, 5).map(activity => 
  `- ${activity.title} (${activity.domain}): ${activity.score}% - ${activity.duration}min`
).join('\n')}

PARTIES CUBEMATCH RÉCENTES:
${sessionData.cubeMatchScores.slice(0, 3).map(score => 
  `- Niveau ${score.level} (${score.operator}): ${score.score} points - ${Math.round(score.accuracyRate * 100)}% précision`
).join('\n')}

Génère un compte rendu structuré et professionnel.`

    // Appeler l'IA
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Génère le compte rendu pour ${sessionData.child.name}` }
      ],
      max_tokens: 800,
      temperature: 0.7
    })

    const analysis = completion.choices[0]?.message?.content || 'Erreur lors de la génération de l\'analyse'

    // Sauvegarder l'analyse dans la base de données
    const savedAnalysis = await prisma.ParentPrompt.create({
      data: {
        content: analysis,
        type: 'ANALYSIS_REQUEST',
        status: 'COMPLETED',
        userSessionId: userInfo.id,
        childSessionId: sessionId,
        metadata: {
          analysisType: 'compte_rendu',
          childName: sessionData.child.name,
          stats: sessionData.stats
        }
      }
    })

    return NextResponse.json({
      success: true,
      analysis,
      sessionData: {
        childName: sessionData.child.name,
        stats: sessionData.stats,
        recentActivities: sessionData.activities.slice(0, 5),
        recentCubeMatch: sessionData.cubeMatchScores.slice(0, 3)
      },
      analysisId: savedAnalysis.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur analyse session:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'analyse',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
