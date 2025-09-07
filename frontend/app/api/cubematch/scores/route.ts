import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Interface pour les scores CubeMatch
interface CubeMatchScore {
  id: string
  score: number
  level: number
  timePlayedMs: number
  operator: string
  target: number
  allowDiagonals: boolean
  comboMax: number
  cellsCleared: number
  hintsUsed: number
  gameDurationSeconds: number
  createdAt: Date
}

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

// GET /api/cubematch/scores - Récupérer les scores d'un utilisateur
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
    const limit = parseInt(searchParams.get('limit') || '20')
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

      // Récupérer les scores de l'enfant
      const scores = await prisma.cubeMatchScore.findMany({
        where: {
          user_id: childId
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit
      })

      return NextResponse.json({
        success: true,
        data: {
          childName: `${child.firstName} ${child.lastName}`,
          scores: scores.map(score => ({
            id: score.id,
            score: score.score,
            level: score.level,
            timePlayedMs: Number(score.time_played_ms),
            operator: score.operator,
            target: score.target,
            allowDiagonals: score.allow_diagonals,
            createdAt: score.created_at
          }))
        }
      })
    }

    // Si c'est un enfant ou parent sans childId spécifique
    const targetUserId = childId || userInfo.userId

    const scores = await prisma.cubeMatchScore.findMany({
      where: {
        user_id: targetUserId
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: {
        scores: scores.map(score => ({
          id: score.id,
          score: score.score,
          level: score.level,
          timePlayedMs: Number(score.time_played_ms),
          operator: score.operator,
          target: score.target,
          allowDiagonals: score.allow_diagonals,
          createdAt: score.created_at
        }))
      }
    })

  } catch (error) {
    console.error('❌ Erreur récupération scores CubeMatch:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

// POST /api/cubematch/scores - Enregistrer un nouveau score
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
      score,
      level,
      timePlayedMs,
      operator,
      target,
      allowDiagonals,
      comboMax,
      cellsCleared,
      hintsUsed,
      gameDurationSeconds,
      gridSizeRows,
      gridSizeCols,
      maxSize,
      spawnRateMin,
      spawnRateMax,
      tickMs,
      gameMode,
      difficultyLevel,
      totalMoves,
      successfulMoves,
      failedMoves,
      accuracyRate,
      averageMoveTimeMs,
      fastestMoveTimeMs,
      slowestMoveTimeMs,
      additionsCount,
      subtractionsCount,
      multiplicationsCount,
      divisionsCount,
      additionsScore,
      subtractionsScore,
      multiplicationsScore,
      divisionsScore,
      gridCompletionRate,
      maxConsecutiveHits,
      maxConsecutiveMisses,
      longestComboChain,
      targetNumbersUsed,
      operatorSequence,
      timeSpentOnAdditionsMs,
      timeSpentOnSubtractionsMs,
      timeSpentOnMultiplicationsMs,
      timeSpentOnDivisionsMs,
      sessionStartTime,
      sessionEndTime,
      breaksTaken,
      totalBreakTimeMs,
      engagementScore,
      focusTimePercentage,
      difficultyAdjustments,
      themeUsed,
      soundEnabled,
      assistEnabled,
      hintsEnabled
    } = body

    // Validation des données requises
    if (!score || !level || !operator || !target) {
      return NextResponse.json({
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Champs requis manquants: score, level, operator, target'
      }, { status: 400 })
    }

    // Récupérer les infos de l'utilisateur pour le username
    const user = await prisma.userSession.findUnique({
      where: { id: userInfo.userId },
      select: { firstName: true, lastName: true }
    })

    if (!user) {
      return NextResponse.json({
        error: 'USER_NOT_FOUND',
        message: 'Utilisateur non trouvé'
      }, { status: 404 })
    }

    // Créer le score
    const newScore = await prisma.cubeMatchScore.create({
      data: {
        user_id: userInfo.userId,
        username: `${user.firstName} ${user.lastName}`,
        score: parseInt(score),
        level: parseInt(level),
        time_played_ms: BigInt(timePlayedMs || 0),
        operator: operator,
        target: parseInt(target),
        allow_diagonals: allowDiagonals || false,
        combo_max: comboMax || 0,
        cells_cleared: cellsCleared || 0,
        hints_used: hintsUsed || 0,
        game_duration_seconds: gameDurationSeconds || 0,
        grid_size_rows: gridSizeRows || 10,
        grid_size_cols: gridSizeCols || 10,
        max_size: maxSize || 9,
        spawn_rate_min: spawnRateMin || 3,
        spawn_rate_max: spawnRateMax || 5,
        tick_ms: tickMs || 12000,
        game_mode: gameMode || 'classic',
        difficulty_level: difficultyLevel || 'normal',
        total_moves: totalMoves || 0,
        successful_moves: successfulMoves || 0,
        failed_moves: failedMoves || 0,
        accuracy_rate: accuracyRate || 0,
        average_move_time_ms: averageMoveTimeMs || 0,
        fastest_move_time_ms: fastestMoveTimeMs || 0,
        slowest_move_time_ms: slowestMoveTimeMs || 0,
        additions_count: additionsCount || 0,
        subtractions_count: subtractionsCount || 0,
        multiplications_count: multiplicationsCount || 0,
        divisions_count: divisionsCount || 0,
        additions_score: additionsScore || 0,
        subtractions_score: subtractionsScore || 0,
        multiplications_score: multiplicationsScore || 0,
        divisions_score: divisionsScore || 0,
        grid_completion_rate: gridCompletionRate || 0,
        max_consecutive_hits: maxConsecutiveHits || 0,
        max_consecutive_misses: maxConsecutiveMisses || 0,
        longest_combo_chain: longestComboChain || 0,
        target_numbers_used: targetNumbersUsed || null,
        operator_sequence: operatorSequence || null,
        time_spent_on_additions_ms: BigInt(timeSpentOnAdditionsMs || 0),
        time_spent_on_subtractions_ms: BigInt(timeSpentOnSubtractionsMs || 0),
        time_spent_on_multiplications_ms: BigInt(timeSpentOnMultiplicationsMs || 0),
        time_spent_on_divisions_ms: BigInt(timeSpentOnDivisionsMs || 0),
        session_start_time: sessionStartTime ? new Date(sessionStartTime) : null,
        session_end_time: sessionEndTime ? new Date(sessionEndTime) : null,
        breaks_taken: breaksTaken || 0,
        total_break_time_ms: BigInt(totalBreakTimeMs || 0),
        engagement_score: engagementScore || 0,
        focus_time_percentage: focusTimePercentage || 0,
        difficulty_adjustments: difficultyAdjustments || 0,
        theme_used: themeUsed || 'classic',
        sound_enabled: soundEnabled !== undefined ? soundEnabled : true,
        assist_enabled: assistEnabled !== undefined ? assistEnabled : true,
        hints_enabled: hintsEnabled !== undefined ? hintsEnabled : true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Score enregistré avec succès',
      data: {
        id: newScore.id,
        score: newScore.score,
        level: newScore.level,
        createdAt: newScore.created_at
      }
    })

  } catch (error) {
    console.error('❌ Erreur enregistrement score CubeMatch:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
