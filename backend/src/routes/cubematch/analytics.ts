/**
 * 📊 CUBEMATCH ANALYTICS API
 * 
 * Analytics avancées pour alimenter BubiX avec des insights comportementaux
 * Patterns d'apprentissage, zones de difficulté, préférences cognitives
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * 🧠 GET /api/cubematch/analytics/learning-patterns/:userId
 * 
 * Analyse des patterns d'apprentissage pour BubiX
 */
router.get('/learning-patterns/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const timeRange = req.query.timeRange as string || '30d';
    
    // Vérifier l'autorisation
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Calculer la date de début selon timeRange
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Récupérer les données de jeu dans la période
    const gameData = await prisma.cubeMatchScore.findMany({
      where: {
        user_id: userId,
        created_at: { gte: startDate }
      },
      orderBy: { created_at: 'asc' },
      select: {
        score: true,
        level: true,
        operator: true,
        difficulty_level: true,
        total_moves: true,
        successful_moves: true,
        failed_moves: true,
        accuracy_rate: true,
        average_move_time_ms: true,
        combo_max: true,
        hints_used: true,
        time_played_ms: true,
        engagement_score: true,
        focus_time_percentage: true,
        created_at: true,
        
        // Données spécifiques par opérateur
        additions_count: true,
        subtractions_count: true,
        multiplications_count: true,
        divisions_count: true,
        additions_score: true,
        subtractions_score: true,
        multiplications_score: true,
        divisions_score: true,
        
        // Temps par opérateur
        time_spent_on_additions_ms: true,
        time_spent_on_subtractions_ms: true,
        time_spent_on_multiplications_ms: true,
        time_spent_on_divisions_ms: true
      }
    });
    
    if (gameData.length === 0) {
      return res.json({
        success: true,
        message: 'Pas assez de données pour l\'analyse',
        patterns: null
      });
    }
    
    // 🔍 ANALYSE 1: Progression temporelle
    const progressionAnalysis = analyzeProgression(gameData);
    
    // 🎯 ANALYSE 2: Performance par opérateur
    const operatorAnalysis = analyzeOperatorPerformance(gameData);
    
    // ⚡ ANALYSE 3: Vitesse et efficacité
    const speedAnalysis = analyzeSpeedPatterns(gameData);
    
    // 🎪 ANALYSE 4: Patterns d'erreurs
    const errorAnalysis = analyzeErrorPatterns(gameData);
    
    // 💡 ANALYSE 5: Recommandations BubiX
    const recommendations = generateRecommendations(
      progressionAnalysis,
      operatorAnalysis,
      speedAnalysis,
      errorAnalysis
    );
    
    res.json({
      success: true,
      userId,
      timeRange,
      dataPoints: gameData.length,
      analysis: {
        progression: progressionAnalysis,
        operators: operatorAnalysis,
        speed: speedAnalysis,
        errors: errorAnalysis,
        recommendations
      },
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur analyse patterns:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse des patterns'
    });
  }
});

/**
 * 📈 GET /api/cubematch/analytics/difficulty-curve/:userId
 * 
 * Analyse de la courbe de difficulté optimale pour l'utilisateur
 */
router.get('/difficulty-curve/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Données par niveau de difficulté
    const difficultyData = await prisma.cubeMatchScore.groupBy({
      by: ['difficulty_level'],
      where: { user_id: userId },
      _avg: {
        score: true,
        accuracy_rate: true,
        engagement_score: true,
        time_played_ms: true
      },
      _count: {
        _all: true
      },
      _max: {
        score: true,
        level: true
      }
    });
    
    // Analyse de progression par difficulté
    const difficultyProgress = await Promise.all(
      ['EASY', 'MEDIUM', 'HARD'].map(async (difficulty) => {
        const recentGames = await prisma.cubeMatchScore.findMany({
          where: {
            user_id: userId,
            difficulty_level: difficulty
          },
          orderBy: { created_at: 'desc' },
          take: 10,
          select: {
            score: true,
            accuracy_rate: true,
            engagement_score: true,
            created_at: true
          }
        });
        
        return {
          difficulty,
          recentPerformance: recentGames,
          trend: calculateTrend(recentGames.map(g => g.score))
        };
      })
    );
    
    // Recommandation de difficulté optimale
    const optimalDifficulty = determineOptimalDifficulty(difficultyData, difficultyProgress);
    
    res.json({
      success: true,
      userId,
      difficultyStats: difficultyData.map(d => ({
        difficulty: d.difficulty_level,
        gamesPlayed: d._count._all,
        averageScore: Math.round(d._avg.score || 0),
        averageAccuracy: Math.round(d._avg.accuracy_rate || 0),
        averageEngagement: Math.round(d._avg.engagement_score || 0),
        averageTimeMs: Math.round(d._avg.time_played_ms || 0),
        bestScore: d._max.score || 0,
        highestLevel: d._max.level || 0
      })),
      progressionByDifficulty: difficultyProgress,
      recommendation: optimalDifficulty,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur analyse difficulté:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse de difficulté'
    });
  }
});

/**
 * 🎯 GET /api/cubematch/analytics/operator-mastery/:userId
 * 
 * Niveau de maîtrise par opérateur mathématique
 */
router.get('/operator-mastery/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Statistiques détaillées par opérateur
    const operatorStats = await Promise.all(
      ['ADD', 'SUB', 'MUL', 'DIV'].map(async (operator) => {
        const games = await prisma.cubeMatchScore.findMany({
          where: {
            user_id: userId,
            operator: operator
          },
          select: {
            score: true,
            level: true,
            accuracy_rate: true,
            average_move_time_ms: true,
            combo_max: true,
            hints_used: true,
            engagement_score: true,
            time_played_ms: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' }
        });
        
        if (games.length === 0) {
          return {
            operator,
            masteryLevel: 0,
            gamesPlayed: 0,
            stats: null,
            recommendation: 'Commencer par des exercices simples'
          };
        }
        
        // Calcul du niveau de maîtrise (0-100)
        const avgAccuracy = games.reduce((sum, g) => sum + (g.accuracy_rate || 0), 0) / games.length;
        const avgScore = games.reduce((sum, g) => sum + g.score, 0) / games.length;
        const avgSpeed = games.reduce((sum, g) => sum + (g.average_move_time_ms || 0), 0) / games.length;
        const consistency = calculateConsistency(games.map(g => g.score));
        
        const masteryLevel = Math.round(
          (avgAccuracy * 0.3) + 
          (Math.min(avgScore / 1000, 1) * 100 * 0.3) + 
          (Math.max(0, (3000 - avgSpeed) / 3000) * 100 * 0.2) + 
          (consistency * 0.2)
        );
        
        return {
          operator,
          masteryLevel,
          gamesPlayed: games.length,
          stats: {
            averageScore: Math.round(avgScore),
            averageAccuracy: Math.round(avgAccuracy),
            averageSpeedMs: Math.round(avgSpeed),
            bestScore: Math.max(...games.map(g => g.score)),
            consistency: Math.round(consistency),
            improvement: calculateImprovement(games),
            lastPlayed: games[0]?.created_at.toISOString()
          },
          recommendation: generateOperatorRecommendation(operator, masteryLevel, avgAccuracy, avgSpeed)
        };
      })
    );
    
    // Opérateur recommandé pour le prochain entraînement
    const nextOperatorRecommendation = determineNextOperator(operatorStats);
    
    res.json({
      success: true,
      userId,
      operatorMastery: operatorStats,
      nextRecommendation: nextOperatorRecommendation,
      overallMastery: Math.round(
        operatorStats.reduce((sum, op) => sum + op.masteryLevel, 0) / operatorStats.length
      ),
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur analyse maîtrise:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse de maîtrise'
    });
  }
});

/**
 * 🕒 GET /api/cubematch/analytics/peak-performance/:userId
 * 
 * Analyse des heures/jours de performance optimale
 */
router.get('/peak-performance/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Récupérer tous les jeux avec timestamp
    const games = await prisma.cubeMatchScore.findMany({
      where: { user_id: userId },
      select: {
        score: true,
        accuracy_rate: true,
        engagement_score: true,
        focus_time_percentage: true,
        created_at: true
      }
    });
    
    if (games.length < 5) {
      return res.json({
        success: true,
        message: 'Pas assez de données pour l\'analyse temporelle',
        analysis: null
      });
    }
    
    // Analyse par heure de la journée
    const hourlyPerformance = Array.from({ length: 24 }, (_, hour) => {
      const hourGames = games.filter(g => new Date(g.created_at).getHours() === hour);
      
      if (hourGames.length === 0) return { hour, gamesPlayed: 0, performance: null };
      
      return {
        hour,
        gamesPlayed: hourGames.length,
        performance: {
          averageScore: Math.round(hourGames.reduce((sum, g) => sum + g.score, 0) / hourGames.length),
          averageAccuracy: Math.round(hourGames.reduce((sum, g) => sum + (g.accuracy_rate || 0), 0) / hourGames.length),
          averageEngagement: Math.round(hourGames.reduce((sum, g) => sum + (g.engagement_score || 0), 0) / hourGames.length),
          averageFocus: Math.round(hourGames.reduce((sum, g) => sum + (g.focus_time_percentage || 0), 0) / hourGames.length)
        }
      };
    }).filter(h => h.gamesPlayed > 0);
    
    // Analyse par jour de la semaine
    const dailyPerformance = Array.from({ length: 7 }, (_, day) => {
      const dayGames = games.filter(g => new Date(g.created_at).getDay() === day);
      
      if (dayGames.length === 0) return { day, dayName: getDayName(day), gamesPlayed: 0, performance: null };
      
      return {
        day,
        dayName: getDayName(day),
        gamesPlayed: dayGames.length,
        performance: {
          averageScore: Math.round(dayGames.reduce((sum, g) => sum + g.score, 0) / dayGames.length),
          averageAccuracy: Math.round(dayGames.reduce((sum, g) => sum + (g.accuracy_rate || 0), 0) / dayGames.length),
          averageEngagement: Math.round(dayGames.reduce((sum, g) => sum + (g.engagement_score || 0), 0) / dayGames.length)
        }
      };
    }).filter(d => d.gamesPlayed > 0);
    
    // Identifier les créneaux optimaux
    const bestHour = hourlyPerformance.reduce((best, current) => 
      (current.performance?.averageScore || 0) > (best.performance?.averageScore || 0) ? current : best
    );
    
    const bestDay = dailyPerformance.reduce((best, current) => 
      (current.performance?.averageScore || 0) > (best.performance?.averageScore || 0) ? current : best
    );
    
    res.json({
      success: true,
      userId,
      analysis: {
        hourlyPerformance,
        dailyPerformance,
        peaks: {
          bestHour: bestHour.hour,
          bestHourScore: bestHour.performance?.averageScore || 0,
          bestDay: bestDay.dayName,
          bestDayScore: bestDay.performance?.averageScore || 0
        },
        recommendations: [
          `Meilleure performance entre ${bestHour.hour}h et ${(bestHour.hour + 1) % 24}h`,
          `Jour optimal: ${bestDay.dayName}`,
          hourlyPerformance.length > 3 ? 'Créer une routine d\'entraînement régulière' : 'Augmenter la fréquence de jeu'
        ]
      },
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur analyse temporelle:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse temporelle'
    });
  }
});

// 🔧 Fonctions d'analyse utilitaires

function analyzeProgression(games: any[]) {
  if (games.length < 3) return { trend: 'insufficient_data' };
  
  const scores = games.map(g => g.score);
  const recentScores = scores.slice(-5);
  const olderScores = scores.slice(0, Math.max(1, scores.length - 5));
  
  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
  
  const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  return {
    trend: improvement > 10 ? 'improving' : improvement < -10 ? 'declining' : 'stable',
    improvementPercentage: Math.round(improvement),
    recentAverage: Math.round(recentAvg),
    historicalAverage: Math.round(olderAvg),
    consistency: calculateConsistency(scores)
  };
}

function analyzeOperatorPerformance(games: any[]) {
  const operators = ['ADD', 'SUB', 'MUL', 'DIV'];
  
  return operators.map(op => {
    const opGames = games.filter(g => g.operator === op);
    if (opGames.length === 0) return { operator: op, performance: null };
    
    const avgScore = opGames.reduce((sum, g) => sum + g.score, 0) / opGames.length;
    const avgAccuracy = opGames.reduce((sum, g) => sum + (g.accuracy_rate || 0), 0) / opGames.length;
    
    return {
      operator: op,
      performance: {
        gamesPlayed: opGames.length,
        averageScore: Math.round(avgScore),
        averageAccuracy: Math.round(avgAccuracy),
        bestScore: Math.max(...opGames.map(g => g.score)),
        preference: opGames.length / games.length * 100
      }
    };
  });
}

function analyzeSpeedPatterns(games: any[]) {
  const speeds = games.map(g => g.average_move_time_ms || 0).filter(s => s > 0);
  if (speeds.length === 0) return { analysis: 'no_speed_data' };
  
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const fastestSpeed = Math.min(...speeds);
  const improvement = calculateSpeedImprovement(games);
  
  return {
    averageSpeedMs: Math.round(avgSpeed),
    fastestSpeedMs: fastestSpeed,
    speedCategory: avgSpeed < 1500 ? 'fast' : avgSpeed < 3000 ? 'medium' : 'slow',
    improvement: improvement,
    recommendation: avgSpeed > 3000 ? 'focus_on_speed' : avgSpeed < 1000 ? 'maintain_accuracy' : 'balanced_approach'
  };
}

function analyzeErrorPatterns(games: any[]) {
  const errorRates = games.map(g => 100 - (g.accuracy_rate || 0));
  if (errorRates.length === 0) return { analysis: 'no_error_data' };
  
  const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;
  const recentErrors = errorRates.slice(-5);
  const errorTrend = calculateTrend(recentErrors.reverse());
  
  return {
    averageErrorRate: Math.round(avgErrorRate),
    errorTrend: errorTrend,
    errorCategory: avgErrorRate < 10 ? 'excellent' : avgErrorRate < 25 ? 'good' : 'needs_improvement',
    recommendation: avgErrorRate > 30 ? 'slow_down_focus_accuracy' : 'continue_current_pace'
  };
}

function generateRecommendations(progression: any, operators: any, speed: any, errors: any) {
  const recommendations = [];
  
  // Recommandations basées sur la progression
  if (progression.trend === 'declining') {
    recommendations.push('Prendre une pause et revenir avec un niveau plus facile');
  } else if (progression.trend === 'improving') {
    recommendations.push('Continuer sur cette lancée, peut-être augmenter la difficulté');
  }
  
  // Recommandations basées sur les opérateurs
  const weakestOp = operators.reduce((weakest: any, current: any) => 
    (current.performance?.averageScore || 0) < (weakest.performance?.averageScore || Infinity) ? current : weakest
  );
  
  if (weakestOp.performance) {
    recommendations.push(`Travailler spécifiquement l'opérateur ${weakestOp.operator}`);
  }
  
  // Recommandations basées sur la vitesse
  if (speed.speedCategory === 'slow') {
    recommendations.push('Exercices de vitesse avec des calculs simples');
  } else if (speed.speedCategory === 'fast' && errors.averageErrorRate > 20) {
    recommendations.push('Ralentir légèrement pour améliorer la précision');
  }
  
  return recommendations;
}

function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const first = values.slice(0, Math.ceil(values.length / 2));
  const second = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
  const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  return change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
}

function calculateConsistency(scores: number[]): number {
  if (scores.length < 2) return 100;
  
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Consistance inverse de la variation relative
  const coefficientOfVariation = stdDev / mean;
  return Math.max(0, 100 - (coefficientOfVariation * 100));
}

function calculateSpeedImprovement(games: any[]): number {
  if (games.length < 5) return 0;
  
  const recentSpeeds = games.slice(-3).map(g => g.average_move_time_ms || 0).filter(s => s > 0);
  const olderSpeeds = games.slice(0, 3).map(g => g.average_move_time_ms || 0).filter(s => s > 0);
  
  if (recentSpeeds.length === 0 || olderSpeeds.length === 0) return 0;
  
  const recentAvg = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;
  const olderAvg = olderSpeeds.reduce((a, b) => a + b, 0) / olderSpeeds.length;
  
  // Amélioration = réduction du temps (donc pourcentage négatif = amélioration)
  return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
}

function calculateImprovement(games: any[]): number {
  if (games.length < 3) return 0;
  
  const recent = games.slice(0, Math.ceil(games.length / 3));
  const older = games.slice(-Math.ceil(games.length / 3));
  
  const recentAvg = recent.reduce((sum, g) => sum + g.score, 0) / recent.length;
  const olderAvg = older.reduce((sum, g) => sum + g.score, 0) / older.length;
  
  return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
}

function determineOptimalDifficulty(difficultyData: any[], progressData: any[]) {
  // Algorithme pour déterminer la difficulté optimale
  // Basé sur engagement, progression et réussite
  
  const analysis = difficultyData.map(d => {
    const progress = progressData.find(p => p.difficulty === d.difficulty_level);
    return {
      difficulty: d.difficulty_level,
      score: (d._avg.engagement_score || 0) * 0.4 + 
             (d._avg.accuracy_rate || 0) * 0.3 + 
             (progress?.trend === 'up' ? 20 : progress?.trend === 'stable' ? 10 : 0) * 0.3
    };
  });
  
  const optimal = analysis.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  return {
    recommended: optimal.difficulty,
    score: Math.round(optimal.score),
    reasoning: generateDifficultyReasoning(optimal.difficulty, analysis)
  };
}

function generateOperatorRecommendation(operator: string, mastery: number, accuracy: number, speed: number): string {
  if (mastery < 30) {
    return `Commencer par des exercices très simples en ${operator}`;
  } else if (mastery < 60) {
    return `Continuer l'entraînement régulier en ${operator}`;
  } else if (accuracy < 80) {
    return `Se concentrer sur la précision en ${operator}`;
  } else if (speed > 2000) {
    return `Travailler la vitesse en ${operator}`;
  } else {
    return `Excellente maîtrise en ${operator}, maintenir le niveau`;
  }
}

function determineNextOperator(operatorStats: any[]) {
  // L'opérateur avec le plus faible niveau de maîtrise
  const weakest = operatorStats.reduce((weakest, current) => 
    current.masteryLevel < weakest.masteryLevel ? current : weakest
  );
  
  return {
    operator: weakest.operator,
    reason: `Niveau de maîtrise le plus faible (${weakest.masteryLevel}%)`,
    recommendation: weakest.recommendation
  };
}

function generateDifficultyReasoning(difficulty: string, analysis: any[]): string {
  const diffData = analysis.find(a => a.difficulty === difficulty);
  
  if (difficulty === 'EASY') {
    return 'Idéal pour consolider les bases et gagner en confiance';
  } else if (difficulty === 'MEDIUM') {
    return 'Bon équilibre entre défi et réussite';
  } else {
    return 'Prêt pour un défi plus élevé, excellente progression';
  }
}

function getDayName(day: number): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[day];
}

export default router;
