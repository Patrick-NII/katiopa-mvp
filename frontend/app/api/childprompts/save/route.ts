import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fonction pour vérifier l'authentification
async function verifyAuth(): Promise<any> {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get('authToken')?.value

    if (!authToken) {
      return null
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    console.error('Erreur vérification auth:', error)
    return null
  }
}

// POST /api/childprompts/save - Sauvegarder une conversation enfant-Bubix
export async function POST(request: NextRequest) {
  try {
    const userInfo = await verifyAuth()
    
    if (!userInfo) {
      return NextResponse.json({
        error: 'UNAUTHORIZED',
        message: 'Token d\'authentification manquant ou invalide'
      }, { status: 401 })
    }

    const body = await request.json()
    const {
      childMessage,
      bubixResponse,
      promptType = 'CHILD_CHAT',
      activityType,
      difficulty = 'MEDIUM',
      engagement,
      childSessionId
    } = body

    // Validation des données requises
    if (!childMessage || !bubixResponse) {
      return NextResponse.json({
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Message enfant et réponse Bubix requis'
      }, { status: 400 })
    }

    // Si childSessionId n'est pas fourni, utiliser l'userId (cas d'un enfant connecté)
    const targetChildSessionId = childSessionId || userInfo.userId

    // Vérifier que la session enfant appartient au compte parent
    if (userInfo.userType === 'PARENT') {
      const childSession = await prisma.userSession.findFirst({
        where: {
          id: targetChildSessionId,
          accountId: userInfo.accountId,
          userType: 'CHILD',
          isActive: true
        }
      })

      if (!childSession) {
        return NextResponse.json({
          error: 'CHILD_SESSION_NOT_FOUND',
          message: 'Session enfant non trouvée ou non autorisée'
        }, { status: 404 })
      }
    }

    // Créer le prompt enfant
    const childPrompt = await prisma.childPrompt.create({
      data: {
        childMessage,
        bubixResponse,
        promptType,
        activityType,
        difficulty,
        engagement,
        childSessionId: targetChildSessionId,
        accountId: userInfo.accountId,
        status: 'PROCESSED'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation sauvegardée avec succès',
      data: {
        id: childPrompt.id,
        childMessage: childPrompt.childMessage,
        bubixResponse: childPrompt.bubixResponse,
        promptType: childPrompt.promptType,
        createdAt: childPrompt.createdAt
      }
    })

  } catch (error) {
    console.error('❌ Erreur sauvegarde ChildPrompt:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

// GET /api/childprompts/save - Récupérer les conversations récentes (pour debug)
export async function GET(request: NextRequest) {
  try {
    const userInfo = await verifyAuth()
    
    if (!userInfo) {
      return NextResponse.json({
        error: 'UNAUTHORIZED',
        message: 'Token d\'authentification manquant ou invalide'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const childSessionId = searchParams.get('childSessionId')

    let whereClause: any = {
      accountId: userInfo.accountId
    }

    // Si un childSessionId spécifique est demandé
    if (childSessionId) {
      whereClause.childSessionId = childSessionId
    }

    const prompts = await prisma.childPrompt.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        childSession: {
          select: {
            firstName: true,
            lastName: true,
            sessionId: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        prompts: prompts.map(prompt => ({
          id: prompt.id,
          childMessage: prompt.childMessage,
          bubixResponse: prompt.bubixResponse,
          promptType: prompt.promptType,
          activityType: prompt.activityType,
          difficulty: prompt.difficulty,
          engagement: prompt.engagement,
          status: prompt.status,
          childName: `${prompt.childSession.firstName} ${prompt.childSession.lastName}`,
          childSessionId: prompt.childSession.sessionId,
          createdAt: prompt.createdAt
        }))
      }
    })

  } catch (error) {
    console.error('❌ Erreur récupération ChildPrompts:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
