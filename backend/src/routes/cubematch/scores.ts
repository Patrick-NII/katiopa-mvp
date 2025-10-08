/**
 * 🏆 CUBEMATCH SCORES API
 * 
 * Gestion complète des scores avec tracking détaillé pour BubiX
 * Enregistre chaque move, timing, pattern pour l'IA
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { z } from 'zod';
import { updateCubeMatchCompetences } from '../../services/cubematch-competence-mapper';

const router = Router();
const prisma = new PrismaClient();

// 📋 Validation Schema pour les scores
const ScoreSchema = z.object({
  // Core game data
  score: z.number().min(0),
  level: z.number().min(1),
  timePlayedMs: z.number().min(0),
  operator: z.enum(['ADD', 'SUB', 'MUL', 'DIV', 'MIXED']),
  target: z.number().min(1),
  
  // Game configuration
  allowDiagonals: z.boolean().default(false),
  gridSize: z.number().min(3).max(15).default(6),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  
  // Performance metrics
  totalMoves: z.number().min(0).default(0),
  successfulMoves: z.number().min(0).default(0),
  failedMoves: z.number().min(0).default(0),
  accuracyRate: z.number().min(0).max(100).default(0),
  averageMoveTimeMs: z.number().min(0).default(0),
  fastestMoveTimeMs: z.number().min(0).default(0),
  slowestMoveTimeMs: z.number().min(0).default(0),
  
  // Advanced metrics for BubiX
  comboMax: z.number().min(0).default(0),
  cellsCleared: z.number().min(0).default(0),
  hintsUsed: z.number().min(0).default(0),
  gameDurationSeconds: z.number().min(0).default(0),
  maxConsecutiveHits: z.number().min(0).default(0),
  maxConsecutiveMisses: z.number().min(0).default(0),
  longestComboChain: z.number().min(0).default(0),
  gridCompletionRate: z.number().min(0).max(100).default(0),
  
  // Operator-specific data
  additionsCount: z.number().min(0).default(0),
  subtractionsCount: z.number().min(0).default(0),
  multiplicationsCount: z.number().min(0).default(0),
  divisionsCount: z.number().min(0).default(0),
  additionsScore: z.number().min(0).default(0),
  subtractionsScore: z.number().min(0).default(0),
  multiplicationsScore: z.number().min(0).default(0),
  divisionsScore: z.number().min(0).default(0),
  
  // Time distribution per operator (for BubiX learning patterns)
  timeSpentOnAdditionsMs: z.number().min(0).default(0),
  timeSpentOnSubtractionsMs: z.number().min(0).default(0),
  timeSpentOnMultiplicationsMs: z.number().min(0).default(0),
  timeSpentOnDivisionsMs: z.number().min(0).default(0),
  
  // Session context
  sessionStartTime: z.string().datetime().optional(),
  sessionEndTime: z.string().datetime().optional(),
  breaksTaken: z.number().min(0).default(0),
  totalBreakTimeMs: z.number().min(0).default(0),
  
  // UX metrics
  engagementScore: z.number().min(0).max(100).default(0),
  focusTimePercentage: z.number().min(0).max(100).default(0),
  difficultyAdjustments: z.number().min(0).default(0),
  
  // Settings used
  themeUsed: z.string().default('classic'),
  soundEnabled: z.boolean().default(true),
  assistEnabled: z.boolean().default(true),
  hintsEnabled: z.boolean().default(true),
  
  // Sequential data for BubiX pattern recognition
  targetNumbersUsed: z.string().optional(), // JSON array of targets
  operatorSequence: z.string().optional(),  // JSON array of operator sequence
  moveTimings: z.string().optional(),       // JSON array of move timings
  errorPatterns: z.string().optional(),     // JSON array of error patterns
  
  // 🎯 NOUVEAUX CHAMPS - Système modulaire avancé
  initialDifficulty: z.number().min(0.8).max(3.5).default(1.0),
  finalDifficulty: z.number().min(0.8).max(3.5).default(1.0),
  averageDifficulty: z.number().min(0.8).max(3.5).default(1.0),
  difficultyProgression: z.array(z.number()).optional(),
  flowScore: z.number().min(0).max(100).default(0),
  cognitiveProfile: z.object({
    speedVsAccuracy: z.string().optional(),
    errorRecovery: z.string().optional(),
    adaptability: z.string().optional(),
    persistence: z.number().optional(),
  }).optional(),
  operatorDistribution: z.record(z.number()).optional(),
  operatorAccuracy: z.record(z.number()).optional(),
  bubixMetrics: z.any().optional(),
  recommendations: z.object({
    focusAreas: z.array(z.string()).optional(),
    suggestedDifficulty: z.number().optional(),
    suggestedOperators: z.array(z.string()).optional(),
  }).optional(),
  consecutiveErrors: z.number().min(0).default(0),
  longDecompositionsCount: z.number().min(0).default(0),
});

/**
 * 💾 POST /api/cubematch/scores - Enregistrer un nouveau score
 * 
 * Enregistre un score complet avec toutes les métriques pour BubiX
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('🏆 Enregistrement nouveau score CubeMatch...');
    
    // Validation des données
    const validatedData = ScoreSchema.parse(req.body);
    
    // Récupération utilisateur authentifié
    const userId = req.user!.userId;
    const username = req.user!.sessionId || req.user!.firstName || req.user!.username || 'Utilisateur';
    
    console.log(`👤 Score pour ${username} (${userId}): ${validatedData.score} points`);
    
    // Enregistrement dans la base de données
    const newScore = await prisma.cubeMatchScore.create({
      data: {
        // Identité utilisateur
        user_id: userId,
        username: username,
        
        // Core metrics
        score: validatedData.score,
        level: validatedData.level,
        time_played_ms: BigInt(validatedData.timePlayedMs),
        operator: validatedData.operator,
        target: validatedData.target,
        allow_diagonals: validatedData.allowDiagonals,
        
        // Game configuration
        grid_size_rows: validatedData.gridSize,
        grid_size_cols: validatedData.gridSize,
        difficulty_level: validatedData.difficulty,
        
        // Performance metrics
        total_moves: validatedData.totalMoves,
        successful_moves: validatedData.successfulMoves,
        failed_moves: validatedData.failedMoves,
        accuracy_rate: validatedData.accuracyRate,
        average_move_time_ms: validatedData.averageMoveTimeMs,
        fastest_move_time_ms: validatedData.fastestMoveTimeMs,
        slowest_move_time_ms: validatedData.slowestMoveTimeMs,
        
        // Advanced metrics
        combo_max: validatedData.comboMax,
        cells_cleared: validatedData.cellsCleared,
        hints_used: validatedData.hintsUsed,
        game_duration_seconds: validatedData.gameDurationSeconds,
        max_consecutive_hits: validatedData.maxConsecutiveHits,
        max_consecutive_misses: validatedData.maxConsecutiveMisses,
        longest_combo_chain: validatedData.longestComboChain,
        grid_completion_rate: validatedData.gridCompletionRate,
        
        // Operator-specific metrics
        additions_count: validatedData.additionsCount,
        subtractions_count: validatedData.subtractionsCount,
        multiplications_count: validatedData.multiplicationsCount,
        divisions_count: validatedData.divisionsCount,
        additions_score: validatedData.additionsScore,
        subtractions_score: validatedData.subtractionsScore,
        multiplications_score: validatedData.multiplicationsScore,
        divisions_score: validatedData.divisionsScore,
        
        // Time distribution
        time_spent_on_additions_ms: BigInt(validatedData.timeSpentOnAdditionsMs),
        time_spent_on_subtractions_ms: BigInt(validatedData.timeSpentOnSubtractionsMs),
        time_spent_on_multiplications_ms: BigInt(validatedData.timeSpentOnMultiplicationsMs),
        time_spent_on_divisions_ms: BigInt(validatedData.timeSpentOnDivisionsMs),
        
        // Session context
        session_start_time: validatedData.sessionStartTime ? new Date(validatedData.sessionStartTime) : null,
        session_end_time: validatedData.sessionEndTime ? new Date(validatedData.sessionEndTime) : null,
        breaks_taken: validatedData.breaksTaken,
        total_break_time_ms: BigInt(validatedData.totalBreakTimeMs),
        
        // UX metrics
        engagement_score: validatedData.engagementScore,
        focus_time_percentage: validatedData.focusTimePercentage,
        difficulty_adjustments: validatedData.difficultyAdjustments,
        
        // Settings
        theme_used: validatedData.themeUsed,
        sound_enabled: validatedData.soundEnabled,
        assist_enabled: validatedData.assistEnabled,
        hints_enabled: validatedData.hintsEnabled,
        
        // Sequential data for BubiX
        target_numbers_used: validatedData.targetNumbersUsed,
        operator_sequence: validatedData.operatorSequence,
        
        // 🎯 NOUVEAUX CHAMPS - Système modulaire avancé
        initial_difficulty: validatedData.initialDifficulty,
        final_difficulty: validatedData.finalDifficulty,
        average_difficulty: validatedData.averageDifficulty,
        difficulty_progression: validatedData.difficultyProgression ? 
          JSON.stringify(validatedData.difficultyProgression) : null,
        flow_score: validatedData.flowScore,
        engagement_score_v2: validatedData.engagementScore || 0,
        cognitive_profile: validatedData.cognitiveProfile ? 
          JSON.stringify(validatedData.cognitiveProfile) : null,
        operator_distribution: validatedData.operatorDistribution ? 
          JSON.stringify(validatedData.operatorDistribution) : null,
        operator_accuracy: validatedData.operatorAccuracy ? 
          JSON.stringify(validatedData.operatorAccuracy) : null,
        bubix_metrics: validatedData.bubixMetrics ? 
          JSON.stringify(validatedData.bubixMetrics) : null,
        recommendations: validatedData.recommendations ? 
          JSON.stringify(validatedData.recommendations) : null,
        consecutive_errors: validatedData.consecutiveErrors,
        long_decompositions_count: validatedData.longDecompositionsCount,
      }
    });
    
    // Mise à jour en parallèle: stats + compétences
    await Promise.all([
      // Statistiques utilisateur
      updateUserStats(userId, username, validatedData),
      
      // Statistiques globales
      updateGlobalStats(validatedData),
      
      // 🎯 NOUVEAU: Mise à jour des compétences du radar
      updateCubeMatchCompetences(userId, {
        operator: validatedData.operator,
        score: validatedData.score,
        level: validatedData.level,
        accuracyRate: validatedData.accuracyRate,
        averageMoveTimeMs: validatedData.averageMoveTimeMs,
        comboMax: validatedData.comboMax,
        totalMoves: validatedData.totalMoves,
        successfulMoves: validatedData.successfulMoves,
        difficulty: validatedData.difficulty
      })
    ]);
    
    console.log(`✅ Score enregistré avec ID: ${newScore.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Score enregistré avec succès',
      scoreId: newScore.id,
      score: validatedData.score,
      level: validatedData.level
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erreur validation données:', error.errors);
      return res.status(400).json({
        error: 'Données invalides',
        details: error.errors
      });
    }
    
    console.error('❌ Erreur enregistrement score:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de l\'enregistrement du score'
    });
  }
});

/**
 * 📊 Mise à jour des statistiques utilisateur
 */
async function updateUserStats(userId: string, username: string, scoreData: any) {
  try {
    await prisma.cubeMatchUserStats.upsert({
      where: { user_id: userId },
      update: {
        username: username,
        total_games: { increment: 1 },
        total_score: { increment: BigInt(scoreData.score) },
        best_score: { set: Math.max(scoreData.score) }, // Prisma will handle max comparison
        total_time_played: { increment: BigInt(scoreData.timePlayedMs) },
        total_combo_max: { set: Math.max(scoreData.comboMax) },
        total_cells_cleared: { increment: scoreData.cellsCleared },
        total_hints_used: { increment: scoreData.hintsUsed },
        favorite_operator: scoreData.operator, // Update to latest
        last_played: new Date(),
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        username: username,
        total_games: 1,
        total_score: BigInt(scoreData.score),
        best_score: scoreData.score,
        highest_level: scoreData.level,
        total_time_played: BigInt(scoreData.timePlayedMs),
        total_combo_max: scoreData.comboMax,
        total_cells_cleared: scoreData.cellsCleared,
        total_hints_used: scoreData.hintsUsed,
        favorite_operator: scoreData.operator,
        last_played: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour stats utilisateur:', error);
  }
}

/**
 * 🌍 Mise à jour des statistiques globales
 */
async function updateGlobalStats(scoreData: any) {
  try {
    // Récupérer ou créer les stats globales
    const globalStats = await prisma.cubeMatchStats.findFirst();
    
    if (globalStats) {
      await prisma.cubeMatchStats.update({
        where: { id: globalStats.id },
        data: {
          total_games: { increment: BigInt(1) },
          total_score: { increment: BigInt(scoreData.score) },
          best_score: Math.max(globalStats.best_score, scoreData.score),
          total_time_played: { increment: BigInt(scoreData.timePlayedMs) },
          highest_level: Math.max(globalStats.highest_level, scoreData.level),
          most_used_operator: scoreData.operator, // Could be more sophisticated
          last_updated: new Date()
        }
      });
    } else {
      await prisma.cubeMatchStats.create({
        data: {
          total_games: BigInt(1),
          total_score: BigInt(scoreData.score),
          best_score: scoreData.score,
          total_time_played: BigInt(scoreData.timePlayedMs),
          highest_level: scoreData.level,
          most_used_operator: scoreData.operator,
          total_players: 1,
          last_updated: new Date()
        }
      });
    }
  } catch (error) {
    console.error('❌ Erreur mise à jour stats globales:', error);
  }
}

/**
 * 📖 GET /api/cubematch/scores - Récupérer les scores récents
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const scores = await prisma.cubeMatchScore.findMany({
      take: limit,
      skip: offset,
      orderBy: [
        { score: 'desc' },
        { created_at: 'desc' }
      ],
      select: {
        id: true,
        user_id: true,
        username: true,
        score: true,
        level: true,
        time_played_ms: true,
        operator: true,
        target: true,
        created_at: true,
        combo_max: true,
        cells_cleared: true
      }
    });
    
    const formattedScores = scores.map(score => ({
      id: score.id,
      userId: score.user_id,
      username: score.username,
      score: score.score,
      level: score.level,
      timePlayedMs: Number(score.time_played_ms),
      operator: score.operator,
      target: score.target,
      comboMax: score.combo_max,
      cellsCleared: score.cells_cleared,
      playedAt: score.created_at.toISOString()
    }));
    
    res.json({
      success: true,
      data: formattedScores,
      pagination: {
        limit,
        offset,
        total: formattedScores.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération scores:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des scores'
    });
  }
});

/**
 * 🔍 GET /api/cubematch/scores/:id - Récupérer un score détaillé
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const score = await prisma.cubeMatchScore.findUnique({
      where: { id },
      include: {
        userSession: {
          select: {
            firstName: true,
            sessionId: true
          }
        }
      }
    });
    
    if (!score) {
      return res.status(404).json({
        error: 'Score non trouvé'
      });
    }
    
    // Retourner toutes les données pour analyse BubiX
    res.json({
      success: true,
      data: {
        ...score,
        time_played_ms: Number(score.time_played_ms),
        time_spent_on_additions_ms: Number(score.time_spent_on_additions_ms),
        time_spent_on_subtractions_ms: Number(score.time_spent_on_subtractions_ms),
        time_spent_on_multiplications_ms: Number(score.time_spent_on_multiplications_ms),
        time_spent_on_divisions_ms: Number(score.time_spent_on_divisions_ms),
        total_break_time_ms: Number(score.total_break_time_ms)
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération score détaillé:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du score'
    });
  }
});

export default router;
