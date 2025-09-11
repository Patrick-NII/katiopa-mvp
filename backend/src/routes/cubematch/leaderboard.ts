/**
 * 🏆 CUBEMATCH LEADERBOARD API
 * 
 * Système de classement multi-critères pour différents types de compétition
 * Optimisé pour performance et alimenter les données BubiX
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * 🥇 GET /api/cubematch/leaderboard/top10 - Top 10 global
 */
router.get('/top10', async (req, res) => {
  try {
    console.log('🏆 Récupération du Top 10 CubeMatch');
    
    const topScores = await prisma.cubeMatchScore.findMany({
      take: 10,
      orderBy: [
        { score: 'desc' },
        { level: 'desc' },
        { time_played_ms: 'asc' }, // En cas d'égalité, plus rapide gagne
        { created_at: 'asc' } // En cas d'égalité totale, le plus ancien
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
        combo_max: true,
        cells_cleared: true,
        accuracy_rate: true,
        total_moves: true,
        successful_moves: true,
        created_at: true,
        difficulty_level: true,
        grid_size_rows: true
      }
    });

    const leaderboard = topScores.map((score, index) => ({
      rank: index + 1,
      id: score.id,
      userId: score.user_id,
      username: score.username,
      score: score.score,
      level: score.level,
      timePlayedMs: Number(score.time_played_ms),
      timePlayedFormatted: formatDuration(Number(score.time_played_ms)),
      operator: score.operator,
      target: score.target,
      comboMax: score.combo_max || 0,
      cellsCleared: score.cells_cleared || 0,
      accuracy: score.accuracy_rate || 0,
      totalMoves: score.total_moves || 0,
      successfulMoves: score.successful_moves || 0,
      difficulty: score.difficulty_level || 'MEDIUM',
      gridSize: score.grid_size_rows || 6,
      playedAt: score.created_at.toISOString(),
      playedAtFormatted: formatRelativeTime(score.created_at)
    }));

    console.log(`✅ Top 10 récupéré: ${leaderboard.length} scores`);
    
    res.json({
      success: true,
      data: leaderboard,
      total: leaderboard.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération Top 10:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du classement'
    });
  }
});

/**
 * 🏅 GET /api/cubematch/leaderboard/by-operator - Classement par opérateur
 */
router.get('/by-operator/:operator', async (req, res) => {
  try {
    const { operator } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    if (!['ADD', 'SUB', 'MUL', 'DIV', 'MIXED'].includes(operator)) {
      return res.status(400).json({
        error: 'Opérateur invalide. Valeurs autorisées: ADD, SUB, MUL, DIV, MIXED'
      });
    }
    
    const scores = await prisma.cubeMatchScore.findMany({
      where: { operator },
      take: limit,
      orderBy: [
        { score: 'desc' },
        { level: 'desc' },
        { time_played_ms: 'asc' }
      ],
      select: {
        id: true,
        user_id: true,
        username: true,
        score: true,
        level: true,
        time_played_ms: true,
        combo_max: true,
        accuracy_rate: true,
        created_at: true
      }
    });

    const leaderboard = scores.map((score, index) => ({
      rank: index + 1,
      id: score.id,
      userId: score.user_id,
      username: score.username,
      score: score.score,
      level: score.level,
      timePlayedMs: Number(score.time_played_ms),
      comboMax: score.combo_max || 0,
      accuracy: score.accuracy_rate || 0,
      playedAt: score.created_at.toISOString()
    }));
    
    res.json({
      success: true,
      operator,
      data: leaderboard,
      total: leaderboard.length
    });
    
  } catch (error) {
    console.error('❌ Erreur classement par opérateur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du classement'
    });
  }
});

/**
 * 🎯 GET /api/cubematch/leaderboard/by-difficulty - Classement par difficulté
 */
router.get('/by-difficulty/:difficulty', async (req, res) => {
  try {
    const { difficulty } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      return res.status(400).json({
        error: 'Difficulté invalide. Valeurs autorisées: EASY, MEDIUM, HARD'
      });
    }
    
    const scores = await prisma.cubeMatchScore.findMany({
      where: { difficulty_level: difficulty },
      take: limit,
      orderBy: [
        { score: 'desc' },
        { level: 'desc' },
        { time_played_ms: 'asc' }
      ],
      select: {
        id: true,
        user_id: true,
        username: true,
        score: true,
        level: true,
        time_played_ms: true,
        combo_max: true,
        accuracy_rate: true,
        operator: true,
        created_at: true
      }
    });

    const leaderboard = scores.map((score, index) => ({
      rank: index + 1,
      id: score.id,
      userId: score.user_id,
      username: score.username,
      score: score.score,
      level: score.level,
      timePlayedMs: Number(score.time_played_ms),
      comboMax: score.combo_max || 0,
      accuracy: score.accuracy_rate || 0,
      operator: score.operator,
      playedAt: score.created_at.toISOString()
    }));
    
    res.json({
      success: true,
      difficulty,
      data: leaderboard,
      total: leaderboard.length
    });
    
  } catch (error) {
    console.error('❌ Erreur classement par difficulté:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du classement'
    });
  }
});

/**
 * 🏃‍♂️ GET /api/cubematch/leaderboard/speed - Classement vitesse (meilleur temps)
 */
router.get('/speed', async (req, res) => {
  try {
    const minScore = parseInt(req.query.minScore as string) || 1000; // Score minimum pour être éligible
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    const scores = await prisma.cubeMatchScore.findMany({
      where: {
        score: { gte: minScore }
      },
      take: limit,
      orderBy: [
        { time_played_ms: 'asc' }, // Plus rapide = meilleur
        { score: 'desc' }
      ],
      select: {
        id: true,
        user_id: true,
        username: true,
        score: true,
        level: true,
        time_played_ms: true,
        operator: true,
        accuracy_rate: true,
        total_moves: true,
        average_move_time_ms: true,
        created_at: true
      }
    });

    const leaderboard = scores.map((score, index) => ({
      rank: index + 1,
      id: score.id,
      userId: score.user_id,
      username: score.username,
      score: score.score,
      level: score.level,
      timePlayedMs: Number(score.time_played_ms),
      timePlayedFormatted: formatDuration(Number(score.time_played_ms)),
      operator: score.operator,
      accuracy: score.accuracy_rate || 0,
      totalMoves: score.total_moves || 0,
      averageMoveTime: score.average_move_time_ms || 0,
      scorePerSecond: Math.round(score.score / (Number(score.time_played_ms) / 1000)),
      playedAt: score.created_at.toISOString()
    }));
    
    res.json({
      success: true,
      type: 'speed',
      criteria: `Score minimum: ${minScore} points`,
      data: leaderboard,
      total: leaderboard.length
    });
    
  } catch (error) {
    console.error('❌ Erreur classement vitesse:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du classement vitesse'
    });
  }
});

/**
 * 🎪 GET /api/cubematch/leaderboard/accuracy - Classement précision
 */
router.get('/accuracy', async (req, res) => {
  try {
    const minMoves = parseInt(req.query.minMoves as string) || 50; // Minimum de moves pour être éligible
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    const scores = await prisma.cubeMatchScore.findMany({
      where: {
        total_moves: { gte: minMoves },
        accuracy_rate: { gt: 0 }
      },
      take: limit,
      orderBy: [
        { accuracy_rate: 'desc' },
        { score: 'desc' }
      ],
      select: {
        id: true,
        user_id: true,
        username: true,
        score: true,
        level: true,
        accuracy_rate: true,
        total_moves: true,
        successful_moves: true,
        failed_moves: true,
        operator: true,
        created_at: true
      }
    });

    const leaderboard = scores.map((score, index) => ({
      rank: index + 1,
      id: score.id,
      userId: score.user_id,
      username: score.username,
      score: score.score,
      level: score.level,
      accuracy: score.accuracy_rate || 0,
      totalMoves: score.total_moves || 0,
      successfulMoves: score.successful_moves || 0,
      failedMoves: score.failed_moves || 0,
      operator: score.operator,
      playedAt: score.created_at.toISOString()
    }));
    
    res.json({
      success: true,
      type: 'accuracy',
      criteria: `Minimum ${minMoves} moves`,
      data: leaderboard,
      total: leaderboard.length
    });
    
  } catch (error) {
    console.error('❌ Erreur classement précision:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du classement précision'
    });
  }
});

/**
 * 👤 GET /api/cubematch/leaderboard/user/:userId - Position d'un utilisateur
 */
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur peut voir ces données
    if (req.user!.userId !== userId) {
      return res.status(403).json({
        error: 'Accès non autorisé'
      });
    }
    
    // Récupérer le meilleur score de l'utilisateur
    const userBestScore = await prisma.cubeMatchScore.findFirst({
      where: { user_id: userId },
      orderBy: { score: 'desc' },
      select: {
        id: true,
        score: true,
        level: true,
        time_played_ms: true,
        operator: true,
        created_at: true
      }
    });
    
    if (!userBestScore) {
      return res.json({
        success: true,
        userRank: null,
        totalPlayers: 0,
        message: 'Aucun score enregistré'
      });
    }
    
    // Compter combien d'utilisateurs ont un meilleur score
    const betterScoresCount = await prisma.cubeMatchScore.count({
      where: {
        score: { gt: userBestScore.score }
      }
    });
    
    // Compter le nombre total de joueurs uniques
    const totalPlayers = await prisma.cubeMatchScore.findMany({
      select: { user_id: true },
      distinct: ['user_id']
    });
    
    const userRank = betterScoresCount + 1;
    const percentile = Math.round((1 - (userRank - 1) / totalPlayers.length) * 100);
    
    res.json({
      success: true,
      userRank,
      totalPlayers: totalPlayers.length,
      percentile,
      bestScore: {
        score: userBestScore.score,
        level: userBestScore.level,
        timePlayedMs: Number(userBestScore.time_played_ms),
        operator: userBestScore.operator,
        achievedAt: userBestScore.created_at.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur position utilisateur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de la position'
    });
  }
});

/**
 * 📈 GET /api/cubematch/leaderboard/stats - Statistiques générales du leaderboard
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalGames,
      uniquePlayers,
      averageScore,
      topScore,
      totalPlayTime
    ] = await Promise.all([
      prisma.cubeMatchScore.count(),
      prisma.cubeMatchScore.findMany({
        select: { user_id: true },
        distinct: ['user_id']
      }),
      prisma.cubeMatchScore.aggregate({
        _avg: { score: true }
      }),
      prisma.cubeMatchScore.findFirst({
        orderBy: { score: 'desc' },
        select: { score: true, username: true, created_at: true }
      }),
      prisma.cubeMatchScore.aggregate({
        _sum: { time_played_ms: true }
      })
    ]);
    
    res.json({
      success: true,
      stats: {
        totalGames,
        uniquePlayers: uniquePlayers.length,
        averageScore: Math.round(averageScore._avg.score || 0),
        topScore: topScore?.score || 0,
        topScoreHolder: topScore?.username || null,
        topScoreDate: topScore?.created_at?.toISOString() || null,
        totalPlayTimeMs: Number(totalPlayTime._sum.time_played_ms || 0),
        totalPlayTimeFormatted: formatDuration(Number(totalPlayTime._sum.time_played_ms || 0)),
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur statistiques leaderboard:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// 🔧 Fonctions utilitaires
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'À l\'instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default router;
