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

// GET /api/cubematch/stats - Récupérer les statistiques personnelles
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
    const childId = searchParams.get('childId') // Optionnel pour les parents

    // Si c'est un parent et qu'un childId est spécifié
    if (userInfo.userType === 'PARENT' && childId) {
      // Vérifier que l'enfant appartient au parent
      const child = await prisma.userSession.findFirst({
        where: {
          id: childId,
          accountId: userInfo.accountId,
          userType: 'CHILD',
          isActive: true
        }
      })

      if (!child) {
        return NextResponse.json({
          error: 'CHILD_NOT_FOUND',
          message: 'Enfant non trouvé ou non autorisé'
        }, { status: 404 })
      }

      // Récupérer les statistiques de l'enfant
      const stats = await prisma.cubeMatchUserStats.findUnique({
        where: {
          user_id: childId
        }
      })

      // Si pas de stats, calculer depuis les scores
      if (!stats) {
        const scores = await prisma.cubeMatchScore.findMany({
          where: { user_id: childId },
          orderBy: { created_at: 'desc' }
        })

        if (scores.length === 0) {
          return NextResponse.json({
            success: true,
            data: {
              childName: `${child.firstName} ${child.lastName}`,
              stats: {
                totalGames: 0,
                totalScore: 0,
                bestScore: 0,
                averageScore: 0,
                highestLevel: 1,
                totalTimePlayed: 0,
                averageTimePlayed: 0,
                favoriteOperator: 'ADD',
                lastPlayed: null
              }
            }
          })
        }

        // Calculer les stats depuis les scores
        const totalGames = scores.length
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
        const bestScore = Math.max(...scores.map(s => s.score))
        const averageScore = totalScore / totalGames
        const highestLevel = Math.max(...scores.map(s => s.level))
        const totalTimePlayed = scores.reduce((sum, s) => sum + Number(s.time_played_ms), 0)
        const averageTimePlayed = totalTimePlayed / totalGames

        // Opérateur le plus utilisé
        const operatorCounts = scores.reduce((acc, s) => {
          acc[s.operator] = (acc[s.operator] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        const favoriteOperator = Object.keys(operatorCounts).reduce((a, b) => 
          operatorCounts[a] > operatorCounts[b] ? a : b
        )

        return NextResponse.json({
          success: true,
          data: {
            childName: `${child.firstName} ${child.lastName}`,
            stats: {
              totalGames,
              totalScore,
              bestScore,
              averageScore: Math.round(averageScore * 100) / 100,
              highestLevel,
              totalTimePlayed,
              averageTimePlayed: Math.round(averageTimePlayed),
              favoriteOperator,
              lastPlayed: scores[0]?.created_at
            }
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          childName: `${child.firstName} ${child.lastName}`,
          stats: {
            totalGames: stats.total_games,
            totalScore: Number(stats.total_score),
            bestScore: stats.best_score,
            averageScore: Number(stats.average_score),
            highestLevel: stats.highest_level,
            totalTimePlayed: Number(stats.total_time_played),
            averageTimePlayed: Number(stats.average_time_played),
            favoriteOperator: stats.favorite_operator,
            lastPlayed: stats.last_played
          }
        }
      })
    }

    // Si c'est un enfant ou parent sans childId spécifique
    const targetUserId = childId || userInfo.userId

    const stats = await prisma.cubeMatchUserStats.findUnique({
      where: {
        user_id: targetUserId
      }
    })

    // Si pas de stats, calculer depuis les scores
    if (!stats) {
      const scores = await prisma.cubeMatchScore.findMany({
        where: { user_id: targetUserId },
        orderBy: { created_at: 'desc' }
      })

      if (scores.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            stats: {
              totalGames: 0,
              totalScore: 0,
              bestScore: 0,
              averageScore: 0,
              highestLevel: 1,
              totalTimePlayed: 0,
              averageTimePlayed: 0,
              favoriteOperator: 'ADD',
              lastPlayed: null
            }
          }
        })
      }

      // Calculer les stats depuis les scores
      const totalGames = scores.length
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
      const bestScore = Math.max(...scores.map(s => s.score))
      const averageScore = totalScore / totalGames
      const highestLevel = Math.max(...scores.map(s => s.level))
      const totalTimePlayed = scores.reduce((sum, s) => sum + Number(s.time_played_ms), 0)
      const averageTimePlayed = totalTimePlayed / totalGames

      // Opérateur le plus utilisé
      const operatorCounts = scores.reduce((acc, s) => {
        acc[s.operator] = (acc[s.operator] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const favoriteOperator = Object.keys(operatorCounts).reduce((a, b) => 
        operatorCounts[a] > operatorCounts[b] ? a : b
      )

      return NextResponse.json({
        success: true,
        data: {
          stats: {
            totalGames,
            totalScore,
            bestScore,
            averageScore: Math.round(averageScore * 100) / 100,
            highestLevel,
            totalTimePlayed,
            averageTimePlayed: Math.round(averageTimePlayed),
            favoriteOperator,
            lastPlayed: scores[0]?.created_at
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalGames: stats.total_games,
          totalScore: Number(stats.total_score),
          bestScore: stats.best_score,
          averageScore: Number(stats.average_score),
          highestLevel: stats.highest_level,
          totalTimePlayed: Number(stats.total_time_played),
          averageTimePlayed: Number(stats.average_time_played),
          favoriteOperator: stats.favorite_operator,
          lastPlayed: stats.last_played
        }
      }
    })

  } catch (error) {
    console.error('❌ Erreur récupération stats CubeMatch:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
