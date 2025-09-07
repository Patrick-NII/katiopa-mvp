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

// GET /api/childprompts/history - Récupérer l'historique des conversations
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const childSessionId = searchParams.get('childSessionId')
    const promptType = searchParams.get('promptType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Construire les conditions de filtrage
    let whereClause: any = {
      accountId: userInfo.accountId
    }

    // Filtre par session enfant
    if (childSessionId) {
      whereClause.childSessionId = childSessionId
    }

    // Filtre par type de prompt
    if (promptType) {
      whereClause.promptType = promptType
    }

    // Filtre par date
    if (dateFrom || dateTo) {
      whereClause.createdAt = {}
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo)
      }
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
            sessionId: true,
            emoji: true
          }
        }
      }
    })

    // Grouper par session enfant pour faciliter l'affichage
    const promptsByChild = prompts.reduce((acc, prompt) => {
      const childKey = prompt.childSessionId
      if (!acc[childKey]) {
        acc[childKey] = {
          childName: `${prompt.childSession.firstName} ${prompt.childSession.lastName}`,
          childSessionId: prompt.childSession.sessionId,
          emoji: prompt.childSession.emoji,
          prompts: []
        }
      }
      acc[childKey].prompts.push({
        id: prompt.id,
        childMessage: prompt.childMessage,
        bubixResponse: prompt.bubixResponse,
        promptType: prompt.promptType,
        activityType: prompt.activityType,
        difficulty: prompt.difficulty,
        engagement: prompt.engagement,
        status: prompt.status,
        createdAt: prompt.createdAt
      })
      return acc
    }, {} as Record<string, any>)

    // Calculer des statistiques
    const stats = {
      totalPrompts: prompts.length,
      totalChildren: Object.keys(promptsByChild).length,
      promptTypes: prompts.reduce((acc, prompt) => {
        acc[prompt.promptType] = (acc[prompt.promptType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      averageEngagement: prompts.filter(p => p.engagement).length / prompts.length * 100,
      recentActivity: prompts.length > 0 ? prompts[0].createdAt : null
    }

    return NextResponse.json({
      success: true,
      data: {
        promptsByChild: Object.values(promptsByChild),
        stats,
        filters: {
          limit,
          childSessionId,
          promptType,
          dateFrom,
          dateTo
        }
      }
    })

  } catch (error) {
    console.error('❌ Erreur récupération historique ChildPrompts:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

// DELETE /api/childprompts/history - Supprimer des conversations (pour les parents)
export async function DELETE(request: NextRequest) {
  try {
    const userInfo = await verifyAuth()
    
    if (!userInfo || userInfo.userType !== 'PARENT') {
      return NextResponse.json({
        error: 'UNAUTHORIZED',
        message: 'Accès réservé aux parents'
      }, { status: 401 })
    }

    const body = await request.json()
    const { promptIds, childSessionId } = body

    let whereClause: any = {
      accountId: userInfo.accountId
    }

    // Si des IDs spécifiques sont fournis
    if (promptIds && promptIds.length > 0) {
      whereClause.id = {
        in: promptIds
      }
    }

    // Si une session enfant spécifique est fournie
    if (childSessionId) {
      whereClause.childSessionId = childSessionId
    }

    const deletedPrompts = await prisma.childPrompt.deleteMany({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      message: `${deletedPrompts.count} conversation(s) supprimée(s) avec succès`,
      data: {
        deletedCount: deletedPrompts.count
      }
    })

  } catch (error) {
    console.error('❌ Erreur suppression ChildPrompts:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
