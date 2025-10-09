/**
 * 🎯 CUBEMATCH SERIES API
 * 
 * Gestion des séries de calculs avec tracking détaillé
 * Utilise des transactions Prisma pour assurer la cohérence
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { z } from 'zod';
import { 
  saveGameSessionWithSeries, 
  getSessionStats, 
  getDailyAggregates,
  GameSessionData,
  SeriesData,
  SeriesAttempt
} from '../../services/cubematch-series-manager';

const router = Router();
const prisma = new PrismaClient();

// 📋 Validation Schema pour les séries
const SeriesSchema = z.object({
  attempts: z.number().min(0),
  correct: z.number().min(0),
  startTime: z.number(),
  validationTimerMs: z.number().min(1000),
  operator: z.enum(['ADD', 'SUB', 'MUL', 'DIV', 'MIXED']),
  target: z.number().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  sessionId: z.string().optional()
});

const SeriesAttemptSchema = z.object({
  selectedNumbers: z.array(z.number()),
  targetValue: z.number().min(1),
  operator: z.enum(['ADD', 'SUB', 'MUL', 'DIV', 'MIXED']),
  isCorrect: z.boolean(),
  responseTimeMs: z.number().min(0),
  attemptType: z.enum(['correct', 'incorrect', 'timeout']),
  numbersCount: z.number().min(1),
  isLongDecomposition: z.boolean().default(false)
});

const GameSessionSchema = z.object({
  // Core game data
  sessionId: z.string(),
  scoreId: z.string().optional(), // 🎯 CORRECTION: Accepter le scoreId pour éviter double insertion
  score: z.number().min(0),
  level: z.number().min(1),
  timePlayedMs: z.number().min(0),
  operator: z.enum(['ADD', 'SUB', 'MUL', 'DIV', 'MIXED']),
  target: z.number().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  gridSize: z.number().min(3).max(15),
  allowDiagonals: z.boolean().default(false),
  
  // Performance metrics
  totalMoves: z.number().min(0),
  successfulMoves: z.number().min(0),
  failedMoves: z.number().min(0),
  accuracyRate: z.number().min(0).max(100),
  comboMax: z.number().min(0),
  cellsCleared: z.number().min(0),
  hintsUsed: z.number().min(0),
  consecutiveErrors: z.number().min(0),
  longDecompositionsCount: z.number().min(0),
  autoValidationEnabled: z.boolean().default(true),
  
  // Series data
  seriesData: z.array(SeriesSchema),
  attemptsData: z.array(z.array(SeriesAttemptSchema))
});

/**
 * 💾 POST /api/cubematch/series - Enregistrer une session complète avec séries
 * 
 * Enregistre une session de jeu complète avec toutes les séries et tentatives
 * Utilise une transaction Prisma pour assurer la cohérence des données
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('🎯 Enregistrement session complète avec séries...');
    
    // Validation des données
    const validatedData = GameSessionSchema.parse(req.body);
    
    // Récupération utilisateur authentifié
    const userId = req.user!.userId;
    const username = req.user!.sessionId || req.user!.firstName || req.user!.username || 'Utilisateur';
    
    console.log(`👤 Session pour ${username} (${userId}): ${validatedData.seriesData.length} séries`);
    
    // Préparer les données pour le service
  const gameSessionData: GameSessionData = {
    userId,
    sessionId: validatedData.sessionId,
    scoreId: validatedData.scoreId,
    score: validatedData.score,
    level: validatedData.level,
    timePlayedMs: validatedData.timePlayedMs,
    operator: validatedData.operator,
    target: validatedData.target,
    difficulty: validatedData.difficulty,
    gridSize: validatedData.gridSize,
    allowDiagonals: validatedData.allowDiagonals,
    totalMoves: validatedData.totalMoves,
    successfulMoves: validatedData.successfulMoves,
    failedMoves: validatedData.failedMoves,
    accuracyRate: validatedData.accuracyRate,
    comboMax: validatedData.comboMax,
    cellsCleared: validatedData.cellsCleared,
    hintsUsed: validatedData.hintsUsed,
    consecutiveErrors: validatedData.consecutiveErrors,
    longDecompositionsCount: validatedData.longDecompositionsCount,
    autoValidationEnabled: validatedData.autoValidationEnabled,
    seriesData: validatedData.seriesData,
    attemptsData: validatedData.attemptsData
  };
    
    // Enregistrer avec transaction
    const scoreId = await saveGameSessionWithSeries(gameSessionData);
    
    // Mettre à jour le username dans le score
    await prisma.cubeMatchScore.update({
      where: { id: scoreId },
      data: { username }
    });
    
    console.log(`✅ Session enregistrée avec succès: ${scoreId}`);
    
    res.json({
      success: true,
      scoreId,
      message: 'Session enregistrée avec succès',
      data: {
        totalSeries: validatedData.seriesData.length,
        totalAttempts: validatedData.attemptsData.flat().length,
        totalCorrect: validatedData.seriesData.reduce((sum, s) => sum + s.correct, 0),
        sessionId: validatedData.sessionId
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur enregistrement session:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'enregistrement',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * 📊 GET /api/cubematch/series/session/:sessionId - Récupérer les stats d'une session
 */
router.get('/session/:sessionId', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const sessionId = req.params.sessionId;
    
    console.log(`📊 Récupération stats session ${sessionId} pour ${userId}`);
    
    const sessionStats = await getSessionStats(userId, sessionId);
    
    if (sessionStats.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      });
    }
    
    // Calculer les métriques agrégées de la session
    const totalGames = sessionStats.length;
    const totalScore = sessionStats.reduce((sum, s) => sum + s.score, 0);
    const averageScore = totalScore / totalGames;
    const bestScore = Math.max(...sessionStats.map(s => s.score));
    const totalTimePlayed = sessionStats.reduce((sum, s) => sum + Number(s.time_played_ms), 0);
    const totalSeries = sessionStats.reduce((sum, s) => sum + s.series.length, 0);
    const totalAttempts = sessionStats.reduce((sum, s) => 
      sum + s.series.reduce((seriesSum, series) => seriesSum + series.attempts, 0), 0
    );
    const totalCorrect = sessionStats.reduce((sum, s) => 
      sum + s.series.reduce((seriesSum, series) => seriesSum + series.correct_answers, 0), 0
    );
    
    res.json({
      success: true,
      data: {
        sessionId,
        totalGames,
        totalScore,
        averageScore: Math.round(averageScore),
        bestScore,
        totalTimePlayed,
        totalSeries,
        totalAttempts,
        totalCorrect,
        accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
        games: sessionStats.map(game => ({
          id: game.id,
          score: game.score,
          level: game.level,
          operator: game.operator,
          target: game.target,
          difficulty: game.difficulty_level,
          accuracy: game.accuracy_rate,
          timePlayed: Number(game.time_played_ms),
          totalMoves: game.total_moves,
          successfulMoves: game.successful_moves,
          seriesCount: game.series.length,
          createdAt: game.created_at
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération stats session:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * 📈 GET /api/cubematch/series/daily-aggregates - Récupérer les agrégations quotidiennes
 */
router.get('/daily-aggregates', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(req.query.endDate as string || new Date());
    
    console.log(`📈 Récupération agrégations quotidiennes pour ${userId}`);
    
    const aggregates = await getDailyAggregates(userId, startDate, endDate);
    
    res.json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        aggregates: aggregates.map(agg => ({
          date: agg.date.toISOString().split('T')[0],
          totalGames: agg.total_games,
          totalScore: Number(agg.total_score),
          averageScore: Number(agg.average_score),
          bestScore: agg.best_score,
          totalTimePlayed: Number(agg.total_time_played_ms),
          averageAccuracy: Number(agg.average_accuracy),
          totalSeries: agg.total_series,
          totalAttempts: agg.total_attempts,
          totalCorrect: agg.total_correct_answers,
          averageResponseTime: agg.average_response_time_ms,
          longDecompositions: agg.long_decompositions_count,
          timeouts: agg.timeout_count,
          operatorsUsed: agg.operators_used,
          difficultyLevels: agg.difficulty_levels
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération agrégations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * 🧹 POST /api/cubematch/series/cleanup - Nettoyer les anciennes données
 * 
 * Archive les données anciennes pour optimiser les performances
 */
router.post('/cleanup', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const daysToKeep = parseInt(req.body.daysToKeep as string) || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    console.log(`🧹 Nettoyage données antérieures au ${cutoffDate.toISOString()}`);
    
    // Supprimer les tentatives anciennes
    const deletedAttempts = await prisma.cubeMatchSeriesAttempt.deleteMany({
      where: {
        series: {
          user_id: userId,
          created_at: {
            lt: cutoffDate
          }
        }
      }
    });
    
    // Supprimer les séries anciennes
    const deletedSeries = await prisma.cubeMatchSeries.deleteMany({
      where: {
        user_id: userId,
        created_at: {
          lt: cutoffDate
        }
      }
    });
    
    // Supprimer les scores anciens (garder les agrégations)
    const deletedScores = await prisma.cubeMatchScore.deleteMany({
      where: {
        user_id: userId,
        created_at: {
          lt: cutoffDate
        }
      }
    });
    
    console.log(`✅ Nettoyage terminé: ${deletedAttempts.count} tentatives, ${deletedSeries.count} séries, ${deletedScores.count} scores`);
    
    res.json({
      success: true,
      message: 'Nettoyage terminé avec succès',
      data: {
        deletedAttempts: deletedAttempts.count,
        deletedSeries: deletedSeries.count,
        deletedScores: deletedScores.count,
        cutoffDate: cutoffDate.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du nettoyage',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router;
