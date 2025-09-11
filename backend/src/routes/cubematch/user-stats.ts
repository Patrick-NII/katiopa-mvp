/**
 * 👤 CUBEMATCH USER STATS API
 * 
 * Statistiques détaillées par utilisateur avec calculs en temps réel
 * Optimisé pour performance et insights personnalisés
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * 📊 GET /api/cubematch/user-stats/:userId - Statistiques complètes utilisateur
 */
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier l'autorisation
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    console.log(`📊 Récupération stats pour ${req.user!.sessionId}`);
    
    // Récupérer les stats utilisateur existantes
    const userStats = await prisma.cubeMatchUserStats.findUnique({
      where: { user_id: userId }
    });
    
    // Calculer les stats en temps réel depuis les scores
    const liveStats = await calculateLiveStats(userId);
    
    // Merger les données
    const completeStats = {
      // Identité
      userId,
      username: userStats?.username || req.user!.sessionId,
      
      // Stats de base
      totalGames: userStats?.total_games || 0,
      totalScore: Number(userStats?.total_score || 0),
      bestScore: userStats?.best_score || 0,
      averageScore: Number(userStats?.average_score || 0),
      highestLevel: userStats?.highest_level || 1,
      
      // Temps de jeu
      totalTimePlayedMs: Number(userStats?.total_time_played || 0),
      totalTimePlayedFormatted: formatDuration(Number(userStats?.total_time_played || 0)),
      averageTimePlayedMs: Number(userStats?.average_time_played || 0),
      
      // Performance
      totalComboMax: userStats?.total_combo_max || 0,
      totalCellsCleared: userStats?.total_cells_cleared || 0,
      totalHintsUsed: userStats?.total_hints_used || 0,
      favoriteOperator: userStats?.favorite_operator || 'ADD',
      
      // Timestamps
      lastPlayed: userStats?.last_played?.toISOString() || null,
      memberSince: userStats?.created_at?.toISOString() || null,
      
      // Stats calculées en temps réel
      liveCalculations: liveStats,
      
      // Préférences utilisateur
      preferences: userStats?.user_preferences ? 
        JSON.parse(userStats.user_preferences) : null
    };
    
    res.json({
      success: true,
      data: completeStats,
      calculatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération stats utilisateur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * 📈 GET /api/cubematch/user-stats/:userId/progression - Progression détaillée
 */
router.get('/:userId/progression', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const timeRange = req.query.timeRange as string || '30d';
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Calculer la date de début
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      case 'all': startDate.setFullYear(2020); break;
      default: startDate.setDate(now.getDate() - 30);
    }
    
    // Récupérer les scores dans la période
    const scores = await prisma.cubeMatchScore.findMany({
      where: {
        user_id: userId,
        created_at: { gte: startDate }
      },
      orderBy: { created_at: 'asc' },
      select: {
        score: true,
        level: true,
        accuracy_rate: true,
        time_played_ms: true,
        operator: true,
        difficulty_level: true,
        combo_max: true,
        created_at: true
      }
    });
    
    if (scores.length === 0) {
      return res.json({
        success: true,
        message: 'Aucune donnée dans cette période',
        data: null
      });
    }
    
    // Analyser la progression
    const progression = analyzeProgression(scores);
    
    // Données pour graphiques
    const chartData = {
      scoreProgression: scores.map(s => ({
        date: s.created_at.toISOString(),
        score: s.score,
        level: s.level
      })),
      
      accuracyProgression: scores.map(s => ({
        date: s.created_at.toISOString(),
        accuracy: s.accuracy_rate || 0
      })),
      
      speedProgression: scores.map(s => ({
        date: s.created_at.toISOString(),
        timeMs: Number(s.time_played_ms),
        scorePerMinute: Math.round(s.score / (Number(s.time_played_ms) / 60000))
      }))
    };
    
    // Statistiques par opérateur
    const operatorStats = ['ADD', 'SUB', 'MUL', 'DIV'].map(op => {
      const opScores = scores.filter(s => s.operator === op);
      if (opScores.length === 0) return { operator: op, stats: null };
      
      return {
        operator: op,
        stats: {
          gamesPlayed: opScores.length,
          averageScore: Math.round(opScores.reduce((sum, s) => sum + s.score, 0) / opScores.length),
          bestScore: Math.max(...opScores.map(s => s.score)),
          averageAccuracy: Math.round(opScores.reduce((sum, s) => sum + (s.accuracy_rate || 0), 0) / opScores.length),
          improvement: calculateImprovement(opScores.map(s => s.score))
        }
      };
    });
    
    // Statistiques par difficulté
    const difficultyStats = ['EASY', 'MEDIUM', 'HARD'].map(diff => {
      const diffScores = scores.filter(s => s.difficulty_level === diff);
      if (diffScores.length === 0) return { difficulty: diff, stats: null };
      
      return {
        difficulty: diff,
        stats: {
          gamesPlayed: diffScores.length,
          averageScore: Math.round(diffScores.reduce((sum, s) => sum + s.score, 0) / diffScores.length),
          bestScore: Math.max(...diffScores.map(s => s.score)),
          successRate: Math.round((diffScores.filter(s => s.score > 200).length / diffScores.length) * 100)
        }
      };
    });
    
    res.json({
      success: true,
      timeRange,
      dataPoints: scores.length,
      data: {
        progression,
        chartData,
        operatorStats: operatorStats.filter(os => os.stats !== null),
        difficultyStats: difficultyStats.filter(ds => ds.stats !== null)
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur analyse progression:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse de progression'
    });
  }
});

/**
 * 🏆 GET /api/cubematch/user-stats/:userId/achievements - Succès et achievements
 */
router.get('/:userId/achievements', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Récupérer toutes les données nécessaires
    const [userStats, allScores, bestScores] = await Promise.all([
      prisma.cubeMatchUserStats.findUnique({
        where: { user_id: userId }
      }),
      prisma.cubeMatchScore.findMany({
        where: { user_id: userId },
        select: {
          score: true,
          level: true,
          combo_max: true,
          accuracy_rate: true,
          time_played_ms: true,
          operator: true,
          difficulty_level: true,
          cells_cleared: true,
          created_at: true
        }
      }),
      prisma.cubeMatchScore.findMany({
        where: { user_id: userId },
        orderBy: { score: 'desc' },
        take: 5,
        select: {
          score: true,
          level: true,
          operator: true,
          created_at: true
        }
      })
    ]);
    
    if (!userStats || allScores.length === 0) {
      return res.json({
        success: true,
        message: 'Aucune donnée pour calculer les achievements',
        data: { achievements: [], progress: [] }
      });
    }
    
    // Calculer les achievements
    const achievements = calculateAchievements(userStats, allScores);
    
    // Calculer les progrès vers les prochains achievements
    const progress = calculateAchievementProgress(userStats, allScores);
    
    res.json({
      success: true,
      data: {
        achievements,
        progress,
        bestScores,
        summary: {
          totalAchievements: achievements.length,
          unlockedRecently: achievements.filter(a => 
            new Date(a.unlockedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
          ).length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération achievements:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des achievements'
    });
  }
});

/**
 * 📊 GET /api/cubematch/user-stats/:userId/compare - Comparaison avec d'autres joueurs
 */
router.get('/:userId/compare', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Stats de l'utilisateur
    const userStats = await prisma.cubeMatchUserStats.findUnique({
      where: { user_id: userId }
    });
    
    if (!userStats) {
      return res.status(404).json({ error: 'Statistiques utilisateur non trouvées' });
    }
    
    // Stats globales pour comparaison
    const globalStats = await prisma.cubeMatchUserStats.aggregate({
      _avg: {
        total_score: true,
        best_score: true,
        average_score: true,
        highest_level: true,
        total_time_played: true
      },
      _count: { _all: true }
    });
    
    // Classement de l'utilisateur
    const betterScoresCount = await prisma.cubeMatchUserStats.count({
      where: {
        best_score: { gt: userStats.best_score }
      }
    });
    
    const userRank = betterScoresCount + 1;
    const totalPlayers = globalStats._count._all;
    const percentile = Math.round((1 - (userRank - 1) / totalPlayers) * 100);
    
    // Comparaison détaillée
    const comparison = {
      userRank,
      totalPlayers,
      percentile,
      
      comparisons: {
        bestScore: {
          user: userStats.best_score,
          global: Math.round(globalStats._avg.best_score || 0),
          better: userStats.best_score > (globalStats._avg.best_score || 0)
        },
        averageScore: {
          user: Number(userStats.average_score),
          global: Math.round(globalStats._avg.average_score || 0),
          better: Number(userStats.average_score) > (globalStats._avg.average_score || 0)
        },
        highestLevel: {
          user: userStats.highest_level,
          global: Math.round(globalStats._avg.highest_level || 0),
          better: userStats.highest_level > (globalStats._avg.highest_level || 0)
        },
        totalPlayTime: {
          user: Number(userStats.total_time_played),
          global: Math.round(globalStats._avg.total_time_played || 0),
          more: Number(userStats.total_time_played) > (globalStats._avg.total_time_played || 0)
        }
      },
      
      achievements: {
        aboveAverage: Object.values({
          bestScore: userStats.best_score > (globalStats._avg.best_score || 0),
          averageScore: Number(userStats.average_score) > (globalStats._avg.average_score || 0),
          highestLevel: userStats.highest_level > (globalStats._avg.highest_level || 0)
        }).filter(Boolean).length,
        totalCategories: 3
      }
    };
    
    res.json({
      success: true,
      data: comparison
    });
    
  } catch (error) {
    console.error('❌ Erreur comparaison utilisateur:', error);
    res.status(500).json({
      error: 'Erreur lors de la comparaison'
    });
  }
});

// 🔧 Fonctions utilitaires

async function calculateLiveStats(userId: string) {
  const scores = await prisma.cubeMatchScore.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    select: {
      score: true,
      level: true,
      accuracy_rate: true,
      time_played_ms: true,
      combo_max: true,
      operator: true,
      created_at: true
    }
  });
  
  if (scores.length === 0) {
    return {
      currentStreak: 0,
      recentForm: 'no_data',
      improvement: 0,
      consistency: 0
    };
  }
  
  // Calculer la série actuelle
  const currentStreak = calculateCurrentStreak(scores);
  
  // Forme récente (5 derniers jeux)
  const recentScores = scores.slice(0, 5).map(s => s.score);
  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const recentForm = recentAvg > 600 ? 'excellent' : recentAvg > 400 ? 'good' : 'needs_improvement';
  
  // Amélioration récente
  const improvement = calculateRecentImprovement(scores);
  
  // Consistance
  const consistency = calculateConsistency(scores.map(s => s.score));
  
  return {
    currentStreak,
    recentForm,
    recentAverage: Math.round(recentAvg),
    improvement,
    consistency: Math.round(consistency),
    gamesThisWeek: scores.filter(s => 
      new Date(s.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length
  };
}

function analyzeProgression(scores: any[]) {
  if (scores.length < 3) {
    return { trend: 'insufficient_data' };
  }
  
  const scoreValues = scores.map(s => s.score);
  const trend = calculateTrend(scoreValues);
  
  // Diviser en segments pour analyse
  const segmentSize = Math.max(1, Math.floor(scores.length / 3));
  const segments = [
    scores.slice(0, segmentSize),
    scores.slice(segmentSize, segmentSize * 2),
    scores.slice(segmentSize * 2)
  ];
  
  const segmentAverages = segments.map(segment => 
    segment.reduce((sum, s) => sum + s.score, 0) / segment.length
  );
  
  const overallImprovement = segmentAverages.length > 1 ? 
    ((segmentAverages[segmentAverages.length - 1] - segmentAverages[0]) / segmentAverages[0]) * 100 : 0;
  
  return {
    trend,
    overallImprovement: Math.round(overallImprovement),
    segmentAverages: segmentAverages.map(avg => Math.round(avg)),
    bestPeriod: segmentAverages.indexOf(Math.max(...segmentAverages)) + 1,
    consistency: calculateConsistency(scoreValues),
    volatility: calculateVolatility(scoreValues)
  };
}

function calculateAchievements(userStats: any, allScores: any[]) {
  const achievements = [];
  
  // Achievement: Premiers pas
  if (userStats.total_games >= 1) {
    achievements.push({
      id: 'first_game',
      name: 'Premiers pas',
      description: 'Jouer votre première partie',
      icon: '🎮',
      rarity: 'common',
      unlockedAt: userStats.created_at
    });
  }
  
  // Achievement: Persévérance
  if (userStats.total_games >= 10) {
    achievements.push({
      id: 'persistent',
      name: 'Persévérant',
      description: 'Jouer 10 parties',
      icon: '🔥',
      rarity: 'common',
      unlockedAt: userStats.updated_at
    });
  }
  
  // Achievement: Centurion
  if (userStats.total_games >= 100) {
    achievements.push({
      id: 'centurion',
      name: 'Centurion',
      description: 'Jouer 100 parties',
      icon: '💯',
      rarity: 'rare',
      unlockedAt: userStats.updated_at
    });
  }
  
  // Achievement: Score élevé
  if (userStats.best_score >= 1000) {
    achievements.push({
      id: 'high_scorer',
      name: 'Marqueur',
      description: 'Atteindre 1000 points',
      icon: '⭐',
      rarity: 'uncommon',
      unlockedAt: userStats.updated_at
    });
  }
  
  // Achievement: Score très élevé
  if (userStats.best_score >= 2000) {
    achievements.push({
      id: 'super_scorer',
      name: 'Super Marqueur',
      description: 'Atteindre 2000 points',
      icon: '🌟',
      rarity: 'rare',
      unlockedAt: userStats.updated_at
    });
  }
  
  // Achievement: Niveau élevé
  if (userStats.highest_level >= 10) {
    achievements.push({
      id: 'level_master',
      name: 'Maître des Niveaux',
      description: 'Atteindre le niveau 10',
      icon: '🏆',
      rarity: 'uncommon',
      unlockedAt: userStats.updated_at
    });
  }
  
  // Achievement: Combo master
  if (userStats.total_combo_max >= 15) {
    achievements.push({
      id: 'combo_master',
      name: 'Maître du Combo',
      description: 'Réaliser un combo de 15+',
      icon: '⚡',
      rarity: 'rare',
      unlockedAt: userStats.updated_at
    });
  }
  
  // Achievement: Précision
  const recentAccuracy = allScores.slice(-10);
  if (recentAccuracy.length >= 10) {
    const avgAccuracy = recentAccuracy.reduce((sum, s) => sum + (s.accuracy_rate || 0), 0) / recentAccuracy.length;
    if (avgAccuracy >= 90) {
      achievements.push({
        id: 'precision_master',
        name: 'Tireur d\'élite',
        description: 'Maintenir 90%+ de précision sur 10 parties',
        icon: '🎯',
        rarity: 'epic',
        unlockedAt: userStats.updated_at
      });
    }
  }
  
  return achievements;
}

function calculateAchievementProgress(userStats: any, allScores: any[]) {
  const progress = [];
  
  // Progrès vers 50 parties
  if (userStats.total_games < 50) {
    progress.push({
      achievement: 'Vétéran',
      description: 'Jouer 50 parties',
      current: userStats.total_games,
      target: 50,
      percentage: Math.round((userStats.total_games / 50) * 100)
    });
  }
  
  // Progrès vers 1500 points
  if (userStats.best_score < 1500) {
    progress.push({
      achievement: 'Expert',
      description: 'Atteindre 1500 points',
      current: userStats.best_score,
      target: 1500,
      percentage: Math.round((userStats.best_score / 1500) * 100)
    });
  }
  
  // Progrès vers niveau 15
  if (userStats.highest_level < 15) {
    progress.push({
      achievement: 'Ascension',
      description: 'Atteindre le niveau 15',
      current: userStats.highest_level,
      target: 15,
      percentage: Math.round((userStats.highest_level / 15) * 100)
    });
  }
  
  return progress;
}

function calculateCurrentStreak(scores: any[]): number {
  let streak = 0;
  const threshold = 300; // Score minimum pour une "victoire"
  
  for (const score of scores) {
    if (score.score >= threshold) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateRecentImprovement(scores: any[]): number {
  if (scores.length < 6) return 0;
  
  const recent = scores.slice(0, 3).map(s => s.score);
  const older = scores.slice(3, 6).map(s => s.score);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
}

function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const half = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, half);
  const secondHalf = values.slice(half);
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  return change > 10 ? 'up' : change < -10 ? 'down' : 'stable';
}

function calculateConsistency(scores: number[]): number {
  if (scores.length < 2) return 100;
  
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  const coefficientOfVariation = stdDev / mean;
  return Math.max(0, 100 - (coefficientOfVariation * 100));
}

function calculateVolatility(scores: number[]): number {
  if (scores.length < 2) return 0;
  
  const differences = [];
  for (let i = 1; i < scores.length; i++) {
    differences.push(Math.abs(scores[i] - scores[i-1]));
  }
  
  const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  return Math.round((avgDifference / avgScore) * 100);
}

function calculateImprovement(scores: number[]): number {
  if (scores.length < 3) return 0;
  
  const recent = scores.slice(0, Math.ceil(scores.length / 3));
  const older = scores.slice(-Math.ceil(scores.length / 3));
  
  const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
  const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
  
  return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default router;
