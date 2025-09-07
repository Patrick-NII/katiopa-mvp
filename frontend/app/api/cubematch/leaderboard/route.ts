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

// GET /api/cubematch/leaderboard - Récupérer le classement
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
    const type = searchParams.get('type') || 'best_score' // best_score, total_games, average_score

    let orderBy: any = {}
    let selectFields: any = {}

    switch (type) {
      case 'best_score':
        orderBy = { best_score: 'desc' }
        selectFields = {
          username: true,
          best_score: true,
          highest_level: true,
          total_games: true,
          last_played: true
        }
        break
      case 'total_games':
        orderBy = { total_games: 'desc' }
        selectFields = {
          username: true,
          total_games: true,
          best_score: true,
          average_score: true,
          last_played: true
        }
        break
      case 'average_score':
        orderBy = { average_score: 'desc' }
        selectFields = {
          username: true,
          average_score: true,
          best_score: true,
          total_games: true,
          last_played: true
        }
        break
      default:
        orderBy = { best_score: 'desc' }
        selectFields = {
          username: true,
          best_score: true,
          highest_level: true,
          total_games: true,
          last_played: true
        }
    }

    // Récupérer le classement
    const leaderboard = await prisma.cubeMatchUserStats.findMany({
      select: selectFields,
      orderBy: orderBy,
      take: limit
    })

    // Si pas assez de données dans les stats, calculer depuis les scores
    if (leaderboard.length < limit) {
      const scores = await prisma.cubeMatchScore.findMany({
        orderBy: { created_at: 'desc' },
        take: limit * 10 // Prendre plus pour calculer les stats
      })

      if (scores.length > 0) {
        // Grouper par utilisateur et calculer les stats
        const userStats = scores.reduce((acc, score) => {
          const userId = score.user_id
          if (!acc[userId]) {
            acc[userId] = {
              username: score.username,
              scores: [],
              bestScore: 0,
              totalGames: 0,
              totalScore: 0,
              highestLevel: 1,
              lastPlayed: score.created_at
            }
          }
          acc[userId].scores.push(score)
          acc[userId].bestScore = Math.max(acc[userId].bestScore, score.score)
          acc[userId].totalGames++
          acc[userId].totalScore += score.score
          acc[userId].highestLevel = Math.max(acc[userId].highestLevel, score.level)
          if (score.created_at > acc[userId].lastPlayed) {
            acc[userId].lastPlayed = score.created_at
          }
          return acc
        }, {} as Record<string, any>)

        // Convertir en array et trier selon le type
        const calculatedLeaderboard = Object.values(userStats).map((stats: any) => ({
          username: stats.username,
          best_score: stats.bestScore,
          total_games: stats.totalGames,
          average_score: stats.totalGames > 0 ? stats.totalScore / stats.totalGames : 0,
          highest_level: stats.highestLevel,
          last_played: stats.lastPlayed
        }))

        // Trier selon le type demandé
        calculatedLeaderboard.sort((a, b) => {
          switch (type) {
            case 'best_score':
              return b.best_score - a.best_score
            case 'total_games':
              return b.total_games - a.total_games
            case 'average_score':
              return b.average_score - a.average_score
            default:
              return b.best_score - a.best_score
          }
        })

        return NextResponse.json({
          success: true,
          data: {
            type,
            leaderboard: calculatedLeaderboard.slice(0, limit).map((entry, index) => ({
              rank: index + 1,
              username: entry.username,
              bestScore: entry.best_score,
              totalGames: entry.total_games,
              averageScore: Math.round(entry.average_score * 100) / 100,
              highestLevel: entry.highest_level,
              lastPlayed: entry.last_played
            }))
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          username: entry.username,
          bestScore: entry.best_score || 0,
          totalGames: entry.total_games || 0,
          averageScore: entry.average_score ? Math.round(Number(entry.average_score) * 100) / 100 : 0,
          highestLevel: entry.highest_level || 1,
          lastPlayed: entry.last_played
        }))
      }
    })

  } catch (error) {
    console.error('❌ Erreur récupération leaderboard CubeMatch:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
