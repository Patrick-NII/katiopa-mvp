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
  scoreId?: string; // 🎯 NOUVEAU: ID du score déjà créé pour éviter duplication
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
    console.log(`🎯 Enregistrement séries pour ${data.userId}...`);

    // Calculs agrégés sur les séries et tentatives
    const seriesSummaries = data.seriesData.map((series, index) => {
      const attempts = data.attemptsData[index] || [];
      const timeoutCount = attempts.filter(a => a.attemptType === 'timeout').length;
      const longDecompositions = attempts.filter(a => a.isLongDecomposition).length;
      const responseTimes = attempts.map(a => a.responseTimeMs);
      const averageResponseMs = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
        : 0;
      const fastestResponseMs = responseTimes.length > 0 ? Math.min(...responseTimes) : null;
      const slowestResponseMs = responseTimes.length > 0 ? Math.max(...responseTimes) : null;
      const accuracy = series.attempts > 0 ? (series.correct / series.attempts) * 100 : 0;

      return {
        seriesNumber: index + 1,
        attempts: series.attempts,
        correct: series.correct,
        accuracy,
        validationTimerMs: series.validationTimerMs,
        operator: series.operator,
        target: series.target,
        timeoutCount,
        longDecompositions,
        averageResponseMs,
        fastestResponseMs,
        slowestResponseMs
      };
    });

    const totalSeries = data.seriesData.length;
    const totalAttempts = data.seriesData.reduce((sum, series) => sum + series.attempts, 0);
    const totalCorrect = data.seriesData.reduce((sum, series) => sum + series.correct, 0);
    const totalTimeouts = seriesSummaries.reduce((sum, summary) => sum + summary.timeoutCount, 0);
    const totalLongDecompositions = seriesSummaries.reduce((sum, summary) => sum + summary.longDecompositions, 0);
    const averageAccuracyRaw = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const averageAccuracy = parseFloat(averageAccuracyRaw.toFixed(2));
    const allResponseTimes = seriesSummaries
      .flatMap(summary => {
        const attempts = data.attemptsData[summary.seriesNumber - 1] || [];
        return attempts.map(a => a.responseTimeMs);
      });
    const averageResponseTimeMs = allResponseTimes.length > 0
      ? Math.round(allResponseTimes.reduce((sum, value) => sum + value, 0) / allResponseTimes.length)
      : 0;
    const averageValidationTimer = totalSeries > 0
      ? Math.round(data.seriesData.reduce((sum, series) => sum + series.validationTimerMs, 0) / totalSeries)
      : null;

    const aggregatedSeriesPayload = {
      totalSeries,
      totalAttempts,
      totalCorrect,
      totalTimeouts,
      totalLongDecompositions,
      averageAccuracy,
      averageResponseMs: averageResponseTimeMs,
      series: seriesSummaries
    };
    
    let scoreId: string;
    
    // 🎯 CORRECTION: Utiliser le scoreId existant ou créer un nouveau score
    if (data.scoreId) {
      console.log(`✅ Utilisation du score existant: ${data.scoreId}`);
      scoreId = data.scoreId;
      
      // Mettre à jour le score avec les données de séries
      await tx.cubeMatchScore.update({
        where: { id: scoreId },
        data: {
          session_id: data.sessionId,
          series_data: aggregatedSeriesPayload,
          series_attempts: totalAttempts,
          series_correct: totalCorrect,
          series_accuracy: averageAccuracy,
          validation_timer_ms: averageValidationTimer ?? undefined,
          consecutive_errors: data.consecutiveErrors,
          long_decompositions_count: data.longDecompositionsCount ?? totalLongDecompositions,
          auto_validation_enabled: data.autoValidationEnabled
        }
      });
    } else {
      // Créer un nouveau score si aucun ID fourni (backward compatibility)
      console.log(`⚠️ Aucun scoreId fourni, création d'un nouveau score (legacy mode)`);
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
          series_data: aggregatedSeriesPayload,
          series_attempts: totalAttempts,
          series_correct: totalCorrect,
          series_accuracy: averageAccuracy,
          validation_timer_ms: averageValidationTimer ?? undefined,
          consecutive_errors: data.consecutiveErrors,
          long_decompositions_count: data.longDecompositionsCount ?? totalLongDecompositions,
          auto_validation_enabled: data.autoValidationEnabled
        }
      });

      console.log(`✅ Score créé: ${score.id}`);
      scoreId = score.id;
    }

    // 2. Créer les séries détaillées
    const seriesPromises = data.seriesData.map(async (series, index) => {
      const summary = seriesSummaries[index];
      const seriesRecord = await tx.cubeMatchSeries.create({
        data: {
          user_id: data.userId,
          session_id: data.sessionId,
          score_id: scoreId,
          series_number: index + 1,
          start_time: new Date(series.startTime),
          end_time: new Date(),
          validation_timer_ms: series.validationTimerMs,
          attempts: series.attempts,
          correct_answers: series.correct,
          incorrect_answers: series.attempts - series.correct,
          timeout_count: summary.timeoutCount,
          series_accuracy: summary.accuracy,
          average_response_time_ms: summary.attempts > 0 ? summary.averageResponseMs : null,
          fastest_response_ms: summary.fastestResponseMs,
          slowest_response_ms: summary.slowestResponseMs,
          operator_used: series.operator,
          target_value: series.target,
          difficulty_level: series.difficulty,
          long_decompositions: summary.longDecompositions
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

    console.log(`🎯 Session complète enregistrée: ${scoreId}`);
    return scoreId;
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
