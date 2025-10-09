/**
 * 📊 NUMÉROMAGIC STATS API
 * 
 * Gestion des statistiques utilisateur pour NuméroMagic
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/numeromagic/stats
 * Récupérer les statistiques de l'utilisateur
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const stats = await prisma.numeroMagicUserStats.findUnique({
      where: { user_id: userId }
    });

    if (!stats) {
      // Retourner des stats par défaut si l'utilisateur n'a pas encore joué
      return res.json({
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        averageScore: 0,
        totalRounds: 0,
        totalSuccessful: 0,
        globalAccuracy: 0,
        bestStreak: 0,
        bestCombo: 0,
        fastestSolveMs: null,
        currentLevel: 1,
        totalExperience: 0,
        favoriteMode: null,
        preferredDifficulty: null,
        firstPlayedAt: null,
        lastPlayedAt: null
      });
    }

    // Convertir BigInt en Number pour la réponse JSON
    res.json({
      totalGames: stats.total_games,
      totalScore: Number(stats.total_score),
      bestScore: stats.best_score,
      averageScore: Number(stats.average_score),
      totalRounds: stats.total_rounds,
      totalSuccessful: stats.total_successful,
      globalAccuracy: Number(stats.global_accuracy),
      bestStreak: stats.best_streak,
      bestCombo: stats.best_combo,
      fastestSolveMs: stats.fastest_solve_ms,
      currentLevel: stats.current_level,
      totalExperience: Number(stats.total_experience),
      favoriteMode: stats.favorite_mode,
      preferredDifficulty: stats.preferred_difficulty,
      firstPlayedAt: stats.first_played_at,
      lastPlayedAt: stats.last_played_at
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats NuméroMagic:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * GET /api/numeromagic/stats/progress
 * Récupérer la progression de l'utilisateur (graphiques)
 */
router.get('/progress', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const limit = parseInt(req.query.limit as string) || 30;

    // Récupérer les derniers scores pour voir la progression
    const recentScores = await prisma.numeroMagicScore.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
      take: limit,
      select: {
        id: true,
        score: true,
        level: true,
        accuracy_rate: true,
        game_mode: true,
        difficulty_level: true,
        created_at: true
      }
    });

    // Calculer les statistiques par mode de jeu
    const statsByMode = await prisma.numeroMagicScore.groupBy({
      by: ['game_mode'],
      where: { user_id: userId },
      _count: { _all: true },
      _avg: {
        score: true,
        accuracy_rate: true
      },
      _max: {
        score: true
      }
    });

    // Calculer les statistiques par niveau de difficulté
    const statsByDifficulty = await prisma.numeroMagicScore.groupBy({
      by: ['difficulty_level'],
      where: { user_id: userId },
      _count: { _all: true },
      _avg: {
        score: true,
        accuracy_rate: true
      },
      _max: {
        score: true
      }
    });

    res.json({
      recentScores: recentScores.map(score => ({
        ...score,
        accuracyRate: Number(score.accuracy_rate)
      })),
      statsByMode: statsByMode.map(stat => ({
        gameMode: stat.game_mode,
        gamesPlayed: stat._count._all,
        averageScore: Number(stat._avg.score || 0),
        averageAccuracy: Number(stat._avg.accuracy_rate || 0),
        bestScore: stat._max.score || 0
      })),
      statsByDifficulty: statsByDifficulty.map(stat => ({
        difficulty: stat.difficulty_level,
        gamesPlayed: stat._count._all,
        averageScore: Number(stat._avg.score || 0),
        averageAccuracy: Number(stat._avg.accuracy_rate || 0),
        bestScore: stat._max.score || 0
      }))
    });

  } catch (error) {
    console.error('❌ Erreur récupération progression:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de la progression'
    });
  }
});

export default router;

