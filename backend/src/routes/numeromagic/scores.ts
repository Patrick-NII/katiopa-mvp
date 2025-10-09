/**
 * 🔢 NUMÉROMAGIC SCORES API
 * 
 * Gestion complète des scores NuméroMagic avec tracking détaillé pour BubiX
 * Enregistre chaque round, solution, pattern pour l'IA
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { z } from 'zod';
import { updateNumeroMagicCompetences } from '../../services/numeromagic-competence-mapper';

const router = Router();
const prisma = new PrismaClient();

// 📋 Validation Schema pour les rounds
const RoundSchema = z.object({
  roundNumber: z.number().min(1),
  targetNumber: z.number(),
  givenNumbers: z.array(z.number()),
  operationsAvailable: z.array(z.string()),
  playerSolution: z.array(z.object({
    step: z.number(),
    operation: z.string(),
    operands: z.array(z.number()),
    result: z.number()
  })).optional(),
  isCorrect: z.boolean(),
  solveTimeMs: z.number().min(0),
  attemptsCount: z.number().min(1).default(1),
  hintsUsedInRound: z.number().min(0).default(0),
  operationsUsed: z.array(z.string()),
  wasPerfect: z.boolean().default(false),
  difficultyRating: z.number().min(0).max(10).default(5)
});

// 📋 Validation Schema pour les scores
const ScoreSchema = z.object({
  // Informations de base
  score: z.number().min(0),
  level: z.number().min(1),
  timePlayedMs: z.number().min(0),
  
  // Configuration du jeu
  gameMode: z.enum(['CLASSIC', 'TIMED', 'CHALLENGE']).default('CLASSIC'),
  difficultyLevel: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).default('MEDIUM'),
  maxNumber: z.number().min(10).max(1000).default(100),
  operationsAllowed: z.array(z.enum(['ADD', 'SUB', 'MUL', 'DIV'])),
  
  // Métriques de performance
  totalRounds: z.number().min(0).default(0),
  successfulRounds: z.number().min(0).default(0),
  failedRounds: z.number().min(0).default(0),
  accuracyRate: z.number().min(0).max(100).default(0),
  
  // Métriques de temps
  averageSolveTimeMs: z.number().min(0).optional(),
  fastestSolveMs: z.number().min(0).optional(),
  slowestSolveMs: z.number().min(0).optional(),
  
  // Combos et streaks
  maxCombo: z.number().min(0).default(0),
  currentStreak: z.number().min(0).default(0),
  bestStreak: z.number().min(0).default(0),
  
  // Métriques par opération
  additionsCount: z.number().min(0).default(0),
  subtractionsCount: z.number().min(0).default(0),
  multiplicationsCount: z.number().min(0).default(0),
  divisionsCount: z.number().min(0).default(0),
  
  additionsSuccess: z.number().min(0).default(0),
  subtractionsSuccess: z.number().min(0).default(0),
  multiplicationsSuccess: z.number().min(0).default(0),
  divisionsSuccess: z.number().min(0).default(0),
  
  // Données avancées
  hintsUsed: z.number().min(0).default(0),
  perfectRounds: z.number().min(0).default(0),
  numbersDiscovered: z.array(z.number()).optional(),
  patternsUsed: z.array(z.string()).optional(),
  
  // Métriques cognitives (pour BubiX)
  cognitiveProfile: z.object({
    problemSolvingStyle: z.string().optional(),
    preferredOperations: z.array(z.string()).optional(),
    learningCurve: z.string().optional()
  }).optional(),
  engagementScore: z.number().min(0).max(100).default(0),
  flowScore: z.number().min(0).max(100).default(0),
  
  // Rounds détaillés
  rounds: z.array(RoundSchema).optional()
});

/**
 * POST /api/numeromagic/scores
 * Enregistrer un nouveau score
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    console.log('🔢 NuméroMagic - Réception données score:', {
      userId,
      dataKeys: Object.keys(req.body)
    });

    // Valider les données
    const validatedData = ScoreSchema.parse(req.body);
    
    console.log('✅ Données validées:', {
      score: validatedData.score,
      level: validatedData.level,
      totalRounds: validatedData.totalRounds,
      gameMode: validatedData.gameMode
    });

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer le score principal
      const score = await tx.numeroMagicScore.create({
        data: {
          user_id: userId,
          score: validatedData.score,
          level: validatedData.level,
          time_played_ms: validatedData.timePlayedMs,
          
          // Configuration
          game_mode: validatedData.gameMode,
          difficulty_level: validatedData.difficultyLevel,
          max_number: validatedData.maxNumber,
          operations_allowed: validatedData.operationsAllowed,
          
          // Performance
          total_rounds: validatedData.totalRounds,
          successful_rounds: validatedData.successfulRounds,
          failed_rounds: validatedData.failedRounds,
          accuracy_rate: validatedData.accuracyRate,
          
          // Temps
          average_solve_time_ms: validatedData.averageSolveTimeMs,
          fastest_solve_ms: validatedData.fastestSolveMs,
          slowest_solve_ms: validatedData.slowestSolveMs,
          
          // Combos
          max_combo: validatedData.maxCombo,
          current_streak: validatedData.currentStreak,
          best_streak: validatedData.bestStreak,
          
          // Opérations
          additions_count: validatedData.additionsCount,
          subtractions_count: validatedData.subtractionsCount,
          multiplications_count: validatedData.multiplicationsCount,
          divisions_count: validatedData.divisionsCount,
          
          additions_success: validatedData.additionsSuccess,
          subtractions_success: validatedData.subtractionsSuccess,
          multiplications_success: validatedData.multiplicationsSuccess,
          divisions_success: validatedData.divisionsSuccess,
          
          // Avancé
          hints_used: validatedData.hintsUsed,
          perfect_rounds: validatedData.perfectRounds,
          numbers_discovered: validatedData.numbersDiscovered || [],
          patterns_used: validatedData.patternsUsed || [],
          
          // Cognitif
          cognitive_profile: validatedData.cognitiveProfile || {},
          engagement_score: validatedData.engagementScore,
          flow_score: validatedData.flowScore
        }
      });

      // 2. Créer les rounds si fournis
      if (validatedData.rounds && validatedData.rounds.length > 0) {
        await tx.numeroMagicRound.createMany({
          data: validatedData.rounds.map(round => ({
            score_id: score.id,
            round_number: round.roundNumber,
            target_number: round.targetNumber,
            given_numbers: round.givenNumbers,
            operations_available: round.operationsAvailable,
            player_solution: round.playerSolution || [],
            is_correct: round.isCorrect,
            solve_time_ms: round.solveTimeMs,
            attempts_count: round.attemptsCount,
            hints_used_in_round: round.hintsUsedInRound,
            operations_used: round.operationsUsed,
            was_perfect: round.wasPerfect,
            difficulty_rating: round.difficultyRating
          }))
        });
      }

      // 3. Mettre à jour les stats utilisateur
      const stats = await tx.numeroMagicUserStats.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          total_games: 1,
          total_score: BigInt(validatedData.score),
          best_score: validatedData.score,
          average_score: validatedData.score,
          total_rounds: validatedData.totalRounds,
          total_successful: validatedData.successfulRounds,
          global_accuracy: validatedData.accuracyRate,
          best_streak: validatedData.bestStreak,
          best_combo: validatedData.maxCombo,
          fastest_solve_ms: validatedData.fastestSolveMs,
          current_level: validatedData.level,
          total_experience: BigInt(validatedData.score * 10),
          favorite_mode: validatedData.gameMode,
          preferred_difficulty: validatedData.difficultyLevel
        },
        update: {
          total_games: { increment: 1 },
          total_score: { increment: BigInt(validatedData.score) },
          best_score: Math.max(validatedData.score, 0), // Will be updated correctly below
          total_rounds: { increment: validatedData.totalRounds },
          total_successful: { increment: validatedData.successfulRounds },
          global_accuracy: validatedData.accuracyRate, // Recalculer si nécessaire
          best_streak: Math.max(validatedData.bestStreak, 0),
          best_combo: Math.max(validatedData.maxCombo, 0),
          fastest_solve_ms: validatedData.fastestSolveMs,
          current_level: validatedData.level,
          total_experience: { increment: BigInt(validatedData.score * 10) },
          last_played_at: new Date()
        }
      });

      // Corriger best_score avec Math.max pour éviter l'écrasement
      const existingStats = await tx.numeroMagicUserStats.findUnique({
        where: { user_id: userId }
      });
      
      if (existingStats && existingStats.best_score < validatedData.score) {
        await tx.numeroMagicUserStats.update({
          where: { user_id: userId },
          data: { best_score: validatedData.score }
        });
      }

      return { scoreId: score.id, stats };
    });

    console.log('✅ Score NuméroMagic sauvegardé:', result.scoreId);

    // 🎯 Mettre à jour les compétences du radar
    try {
      // Récupérer l'âge de l'utilisateur pour la pondération
      const userSession = await prisma.userSession.findUnique({
        where: { id: userId },
        select: { age: true }
      });

      await updateNumeroMagicCompetences(userId, {
        ...validatedData,
        userAge: userSession?.age || undefined
      });
      
      console.log('✅ Compétences radar mises à jour pour NuméroMagic');
    } catch (competenceError) {
      console.error('⚠️ Erreur mise à jour compétences (non bloquante):', competenceError);
      // Ne pas faire échouer la sauvegarde du score si les compétences échouent
    }

    // Convertir les BigInt en Number pour la sérialisation JSON
    const statsForResponse = result.stats ? {
      ...result.stats,
      total_score: Number(result.stats.total_score),
      total_experience: Number(result.stats.total_experience)
    } : null;

    res.json({
      success: true,
      scoreId: result.scoreId,
      stats: statsForResponse
    });

  } catch (error) {
    console.error('❌ Erreur sauvegarde score NuméroMagic:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.errors
      });
    }
    
    res.status(500).json({
      error: 'Erreur lors de la sauvegarde du score',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/numeromagic/scores?limit=10
 * Récupérer les derniers scores de l'utilisateur
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const scores = await prisma.numeroMagicScore.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        rounds: {
          orderBy: { round_number: 'asc' }
        }
      }
    });

    res.json(scores);

  } catch (error) {
    console.error('❌ Erreur récupération scores:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des scores'
    });
  }
});

/**
 * GET /api/numeromagic/scores/:id
 * Récupérer un score spécifique avec tous ses détails
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const scoreId = req.params.id;

    const score = await prisma.numeroMagicScore.findFirst({
      where: {
        id: scoreId,
        user_id: userId
      },
      include: {
        rounds: {
          orderBy: { round_number: 'asc' }
        }
      }
    });

    if (!score) {
      return res.status(404).json({ error: 'Score non trouvé' });
    }

    res.json(score);

  } catch (error) {
    console.error('❌ Erreur récupération score:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du score'
    });
  }
});

export default router;

