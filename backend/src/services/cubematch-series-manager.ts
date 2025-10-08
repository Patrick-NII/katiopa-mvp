/**
 * 🎯 CUBEMATCH SERIES MANAGER
 * 
 * Service pour gérer les séries de calculs avec transactions Prisma
 * Assure la cohérence des données et optimise les performances
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SeriesData {
  attempts: number;
  correct: number;
  startTime: number;
  validationTimerMs: number;
  operator: string;
  target: number;
  difficulty: string;
  sessionId?: string;
}

export interface SeriesAttempt {
  selectedNumbers: number[];
  targetValue: number;
  operator: string;
  isCorrect: boolean;
  responseTimeMs: number;
  attemptType: 'correct' | 'incorrect' | 'timeout';
  numbersCount: number;
  isLongDecomposition: boolean;
}

export interface GameSessionData {
  userId: string;
  sessionId: string;
  score: number;
  level: number;
  timePlayedMs: number;
  operator: string;
  target: number;
  difficulty: string;
  gridSize: number;
  allowDiagonals: boolean;
  totalMoves: number;
  successfulMoves: number;
  failedMoves: number;
  accuracyRate: number;
  comboMax: number;
  cellsCleared: number;
  hintsUsed: number;
  consecutiveErrors: number;
  longDecompositionsCount: number;
  autoValidationEnabled: boolean;
  seriesData: SeriesData[];
  attemptsData: SeriesAttempt[][];
}

/**
 * 💾 Enregistrer une session complète avec toutes les séries
 * Utilise une transaction Prisma pour assurer la cohérence
 */
export async function saveGameSessionWithSeries(data: GameSessionData): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    console.log(`🎯 Enregistrement session complète pour ${data.userId}...`);
    
    // 1. Créer le score principal
    const score = await tx.cubeMatchScore.create({
      data: {
        user_id: data.userId,
        username: 'Utilisateur', // Sera mis à jour par l'API
        score: data.score,
        level: data.level,
        time_played_ms: BigInt(data.timePlayedMs),
        operator: data.operator,
        target: data.target,
        allow_diagonals: data.allowDiagonals,
        grid_size_rows: data.gridSize,
        grid_size_cols: data.gridSize,
        difficulty_level: data.difficulty,
        total_moves: data.totalMoves,
        successful_moves: data.successfulMoves,
        failed_moves: data.failedMoves,
        accuracy_rate: data.accuracyRate,
        combo_max: data.comboMax,
        cells_cleared: data.cellsCleared,
        hints_used: data.hintsUsed,
        session_id: data.sessionId,
        consecutive_errors: data.consecutiveErrors,
        long_decompositions_count: data.longDecompositionsCount,
        auto_validation_enabled: data.autoValidationEnabled,
        series_data: {
          totalSeries: data.seriesData.length,
          seriesSummary: data.seriesData.map(s => ({
            attempts: s.attempts,
            correct: s.correct,
            accuracy: s.attempts > 0 ? (s.correct / s.attempts) * 100 : 0,
            validationTimerMs: s.validationTimerMs
          }))
        }
      }
    });

    console.log(`✅ Score créé: ${score.id}`);

    // 2. Créer les séries détaillées
    const seriesPromises = data.seriesData.map(async (series, index) => {
      const seriesRecord = await tx.cubeMatchSeries.create({
        data: {
          user_id: data.userId,
          session_id: data.sessionId,
          score_id: score.id,
          series_number: index + 1,
          start_time: new Date(series.startTime),
          end_time: new Date(),
          validation_timer_ms: series.validationTimerMs,
          attempts: series.attempts,
          correct_answers: series.correct,
          incorrect_answers: series.attempts - series.correct,
          timeout_count: 0, // À calculer depuis les attempts
          series_accuracy: series.attempts > 0 ? (series.correct / series.attempts) * 100 : 0,
          operator_used: series.operator,
          target_value: series.target,
          difficulty_level: series.difficulty,
          long_decompositions: 0 // À calculer depuis les attempts
        }
      });

      // 3. Créer les tentatives détaillées pour cette série
      if (data.attemptsData[index]) {
        const attemptPromises = data.attemptsData[index].map(async (attempt, attemptIndex) => {
          await tx.cubeMatchSeriesAttempt.create({
            data: {
              series_id: seriesRecord.id,
              attempt_number: attemptIndex + 1,
              selected_numbers: attempt.selectedNumbers,
              target_value: attempt.targetValue,
              operator: attempt.operator,
              is_correct: attempt.isCorrect,
              response_time_ms: attempt.responseTimeMs,
              attempt_type: attempt.attemptType,
              numbers_count: attempt.numbersCount,
              is_long_decomposition: attempt.isLongDecomposition
            }
          });
        });

        await Promise.all(attemptPromises);
      }

      return seriesRecord;
    });

    const seriesRecords = await Promise.all(seriesPromises);
    console.log(`✅ ${seriesRecords.length} séries créées`);

    // 4. Mettre à jour les agrégations quotidiennes
    await updateDailyAggregates(tx, data);

    console.log(`🎯 Session complète enregistrée: ${score.id}`);
    return score.id;
  });
}

/**
 * 📊 Mettre à jour les agrégations quotidiennes
 */
async function updateDailyAggregates(tx: any, data: GameSessionData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculer les métriques agrégées
  const totalSeries = data.seriesData.length;
  const totalAttempts = data.seriesData.reduce((sum, s) => sum + s.attempts, 0);
  const totalCorrect = data.seriesData.reduce((sum, s) => sum + s.correct, 0);
  const averageAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
  
  // Calculer les temps de réponse moyens
  const allResponseTimes = data.attemptsData.flat().map(a => a.responseTimeMs);
  const averageResponseTime = allResponseTimes.length > 0 
    ? allResponseTimes.reduce((sum, t) => sum + t, 0) / allResponseTimes.length 
    : 0;

  // Compter les décompositions longues
  const longDecompositions = data.attemptsData.flat()
    .filter(a => a.isLongDecomposition).length;

  // Compter les timeouts
  const timeouts = data.attemptsData.flat()
    .filter(a => a.attemptType === 'timeout').length;

  // Opérateurs utilisés
  const operatorsUsed = [...new Set(data.seriesData.map(s => s.operator))];

  await tx.cubeMatchDailyAggregate.upsert({
    where: {
      user_id_date: {
        user_id: data.userId,
        date: today
      }
    },
    update: {
      total_games: { increment: 1 },
      total_score: { increment: BigInt(data.score) },
      average_score: {
        // Recalculer la moyenne
        set: await calculateNewAverage(tx, data.userId, today, data.score)
      },
      best_score: {
        set: Math.max(await getCurrentBestScore(tx, data.userId, today), data.score)
      },
      total_time_played_ms: { increment: BigInt(data.timePlayedMs) },
      average_accuracy: {
        // Recalculer la précision moyenne
        set: await calculateNewAverageAccuracy(tx, data.userId, today, averageAccuracy)
      },
      total_series: { increment: totalSeries },
      total_attempts: { increment: totalAttempts },
      total_correct_answers: { increment: totalCorrect },
      average_response_time_ms: {
        // Recalculer le temps de réponse moyen
        set: await calculateNewAverageResponseTime(tx, data.userId, today, averageResponseTime)
      },
      long_decompositions_count: { increment: longDecompositions },
      timeout_count: { increment: timeouts },
      operators_used: operatorsUsed,
      difficulty_levels: [data.difficulty],
      updated_at: new Date()
    },
    create: {
      user_id: data.userId,
      date: today,
      total_games: 1,
      total_score: BigInt(data.score),
      average_score: data.score,
      best_score: data.score,
      total_time_played_ms: BigInt(data.timePlayedMs),
      average_accuracy: averageAccuracy,
      total_series: totalSeries,
      total_attempts: totalAttempts,
      total_correct_answers: totalCorrect,
      average_response_time_ms: averageResponseTime,
      long_decompositions_count: longDecompositions,
      timeout_count: timeouts,
      operators_used: operatorsUsed,
      difficulty_levels: [data.difficulty]
    }
  });

  console.log(`📊 Agrégations quotidiennes mises à jour pour ${data.userId}`);
}

/**
 * 🧮 Fonctions utilitaires pour les calculs d'agrégation
 */
async function calculateNewAverage(tx: any, userId: string, date: Date, newScore: number): Promise<number> {
  const aggregate = await tx.cubeMatchDailyAggregate.findUnique({
    where: {
      user_id_date: { user_id: userId, date }
    }
  });

  if (!aggregate) return newScore;

  const currentTotal = Number(aggregate.total_score);
  const currentGames = aggregate.total_games;
  const newTotal = currentTotal + newScore;
  const newGames = currentGames + 1;

  return newTotal / newGames;
}

async function getCurrentBestScore(tx: any, userId: string, date: Date): Promise<number> {
  const aggregate = await tx.cubeMatchDailyAggregate.findUnique({
    where: {
      user_id_date: { user_id: userId, date }
    }
  });

  return aggregate?.best_score || 0;
}

async function calculateNewAverageAccuracy(tx: any, userId: string, date: Date, newAccuracy: number): Promise<number> {
  const aggregate = await tx.cubeMatchDailyAggregate.findUnique({
    where: {
      user_id_date: { user_id: userId, date }
    }
  });

  if (!aggregate) return newAccuracy;

  const currentGames = aggregate.total_games;
  const currentAvg = Number(aggregate.average_accuracy);
  const newGames = currentGames + 1;

  return ((currentAvg * currentGames) + newAccuracy) / newGames;
}

async function calculateNewAverageResponseTime(tx: any, userId: string, date: Date, newResponseTime: number): Promise<number> {
  const aggregate = await tx.cubeMatchDailyAggregate.findUnique({
    where: {
      user_id_date: { user_id: userId, date }
    }
  });

  if (!aggregate) return newResponseTime;

  const currentGames = aggregate.total_games;
  const currentAvg = aggregate.average_response_time_ms;
  const newGames = currentGames + 1;

  return ((currentAvg * currentGames) + newResponseTime) / newGames;
}

/**
 * 📈 Récupérer les statistiques d'une session
 */
export async function getSessionStats(userId: string, sessionId: string) {
  return await prisma.cubeMatchScore.findMany({
    where: {
      user_id: userId,
      session_id: sessionId
    },
    include: {
      series: {
        include: {
          attempts_detail: true
        }
      }
    },
    orderBy: {
      created_at: 'asc'
    }
  });
}

/**
 * 📊 Récupérer les agrégations quotidiennes
 */
export async function getDailyAggregates(userId: string, startDate: Date, endDate: Date) {
  return await prisma.cubeMatchDailyAggregate.findMany({
    where: {
      user_id: userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  });
}
