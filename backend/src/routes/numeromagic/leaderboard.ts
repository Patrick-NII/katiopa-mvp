/**
 * 🏆 NUMÉROMAGIC LEADERBOARD API
 * 
 * Gestion du classement global et par mode de jeu
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/numeromagic/leaderboard?mode=CLASSIC&limit=10
 * Récupérer le classement global ou par mode
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const mode = req.query.mode as string | undefined;

    let leaderboard;

    if (mode) {
      // Classement par mode de jeu spécifique
      leaderboard = await prisma.numeroMagicScore.findMany({
        where: { game_mode: mode },
        orderBy: { score: 'desc' },
        take: limit,
        select: {
          id: true,
          score: true,
          level: true,
          game_mode: true,
          difficulty_level: true,
          accuracy_rate: true,
          best_streak: true,
          max_combo: true,
          created_at: true,
          userSession: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              age: true
            }
          }
        }
      });
    } else {
      // Classement global (meilleurs scores toutes catégories)
      leaderboard = await prisma.numeroMagicUserStats.findMany({
        orderBy: { best_score: 'desc' },
        take: limit,
        select: {
          user_id: true,
          best_score: true,
          total_games: true,
          global_accuracy: true,
          best_streak: true,
          best_combo: true,
          current_level: true,
          total_experience: true,
          userSession: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              age: true
            }
          }
        }
      });
    }

    // Formater la réponse
    const formattedLeaderboard = mode 
      ? leaderboard.map((entry, index) => ({
          rank: index + 1,
          userId: entry.userSession.id,
          username: `${entry.userSession.firstName} ${entry.userSession.lastName.charAt(0)}.`,
          age: entry.userSession.age,
          score: entry.score,
          level: entry.level,
          gameMode: entry.game_mode,
          difficulty: entry.difficulty_level,
          accuracy: Number(entry.accuracy_rate),
          bestStreak: entry.best_streak,
          maxCombo: entry.max_combo,
          playedAt: entry.created_at
        }))
      : leaderboard.map((entry, index) => ({
          rank: index + 1,
          userId: entry.user_id,
          username: `${entry.userSession.firstName} ${entry.userSession.lastName.charAt(0)}.`,
          age: entry.userSession.age,
          bestScore: entry.best_score,
          totalGames: entry.total_games,
          accuracy: Number(entry.global_accuracy),
          bestStreak: entry.best_streak,
          bestCombo: entry.best_combo,
          level: entry.current_level,
          experience: Number(entry.total_experience)
        }));

    res.json(formattedLeaderboard);

  } catch (error) {
    console.error('❌ Erreur récupération leaderboard:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du classement'
    });
  }
});

/**
 * GET /api/numeromagic/leaderboard/rank
 * Récupérer le rang de l'utilisateur connecté
 */
router.get('/rank', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer les stats de l'utilisateur
    const userStats = await prisma.numeroMagicUserStats.findUnique({
      where: { user_id: userId }
    });

    if (!userStats) {
      return res.json({
        rank: null,
        totalPlayers: 0,
        percentile: 0
      });
    }

    // Compter combien d'utilisateurs ont un meilleur score
    const betterPlayersCount = await prisma.numeroMagicUserStats.count({
      where: {
        best_score: {
          gt: userStats.best_score
        }
      }
    });

    // Compter le nombre total de joueurs
    const totalPlayers = await prisma.numeroMagicUserStats.count();

    const rank = betterPlayersCount + 1;
    const percentile = totalPlayers > 0 
      ? ((totalPlayers - rank) / totalPlayers) * 100 
      : 0;

    res.json({
      rank,
      totalPlayers,
      percentile: Math.round(percentile * 100) / 100,
      bestScore: userStats.best_score,
      totalGames: userStats.total_games
    });

  } catch (error) {
    console.error('❌ Erreur récupération rang:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du rang'
    });
  }
});

export default router;

