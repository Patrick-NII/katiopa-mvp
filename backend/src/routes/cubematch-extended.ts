// Routes API étendues pour CubeMatch avec données détaillées
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/cubematch/operator-stats - Statistiques par opération
router.get('/operator-stats', requireAuth, async (req, res) => {
  try {
    const { timeRange = 'all' } = req.query;
    const userId = req.user!.userId;

    let timeFilter = '';
    if (timeRange === 'week') {
      timeFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
    } else if (timeRange === 'month') {
      timeFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    }

    const operatorStats = await prisma.$queryRaw`
      SELECT 
        operator,
        COUNT(*) as "totalGames",
        COALESCE(SUM(score), 0) as "totalScore",
        COALESCE(MAX(score), 0) as "bestScore",
        COALESCE(AVG(score), 0) as "averageScore",
        COALESCE(SUM(time_played_ms), 0) as "totalTimePlayed",
        COALESCE(AVG(time_played_ms), 0) as "averageTimePerGame",
        COALESCE(SUM(total_moves), 0) as "totalMoves",
        COALESCE(SUM(successful_moves), 0) as "successfulMoves",
        COALESCE(SUM(failed_moves), 0) as "failedMoves",
        CASE 
          WHEN COALESCE(SUM(total_moves), 0) > 0 
          THEN (COALESCE(SUM(successful_moves), 0)::DECIMAL / COALESCE(SUM(total_moves), 0)::DECIMAL) * 100
          ELSE 0 
        END as "accuracyRate",
        COALESCE(AVG(average_move_time_ms), 0) as "averageMoveTime",
        COALESCE(AVG(level), 1) as "averageLevel",
        COALESCE(MAX(level), 1) as "highestLevel",
        MAX(created_at) as "lastPlayed"
      FROM cubematch_scores 
      WHERE user_id = ${userId} ${timeFilter}
      GROUP BY operator
      ORDER BY "totalGames" DESC
    `;

    res.json(operatorStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats par opération:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/insights - Insights IA
router.get('/insights', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const insights = await prisma.$queryRaw`
      SELECT 
        strength_areas as "strengthAreas",
        improvement_areas as "improvementAreas",
        recommended_operators as "recommendedOperators",
        progress_score as "progressScore",
        consistency_score as "consistencyScore",
        challenge_readiness as "challengeReadiness",
        best_playing_hours as "bestPlayingHours",
        optimal_session_duration_ms as "optimalSessionDuration",
        recommended_break_frequency as "recommendedBreakFrequency"
      FROM cubematch_insights 
      WHERE user_id = ${userId}
    `;

    if (insights.length === 0) {
      // Générer des insights par défaut basés sur les données existantes
      const defaultInsights = await generateDefaultInsights(userId);
      res.json(defaultInsights);
    } else {
      res.json(insights[0]);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des insights:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/sessions - Sessions de jeu
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const { timeRange = 'all' } = req.query;
    const userId = req.user!.userId;

    let timeFilter = '';
    if (timeRange === 'week') {
      timeFilter = "AND session_start >= NOW() - INTERVAL '7 days'";
    } else if (timeRange === 'month') {
      timeFilter = "AND session_start >= NOW() - INTERVAL '30 days'";
    }

    const sessions = await prisma.$queryRaw`
      SELECT 
        id,
        session_start as "sessionStart",
        session_end as "sessionEnd",
        total_games_played as "totalGamesPlayed",
        total_score as "totalScore",
        total_time_played_ms as "totalTimePlayed",
        average_games_per_hour as "averageGamesPerHour",
        longest_game_duration_ms as "longestGameDuration",
        shortest_game_duration_ms as "shortestGameDuration",
        preferred_operators as "preferredOperators",
        preferred_grid_sizes as "preferredGridSizes",
        preferred_target_numbers as "preferredTargetNumbers",
        engagement_level as "engagementLevel",
        focus_breaks as "focusBreaks",
        total_break_time_ms as "totalBreakTime"
      FROM cubematch_sessions 
      WHERE user_id = ${userId} ${timeFilter}
      ORDER BY session_start DESC
      LIMIT 50
    `;

    res.json(sessions);
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/performance-stats - Statistiques de performance détaillées
router.get('/performance-stats', requireAuth, async (req, res) => {
  try {
    const { timeRange = 'all' } = req.query;
    const userId = req.user!.userId;

    let timeFilter = '';
    if (timeRange === 'week') {
      timeFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
    } else if (timeRange === 'month') {
      timeFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    }

    const performanceStats = await prisma.$queryRaw`
      SELECT 
        -- Métriques globales
        COUNT(*) as "totalGames",
        COALESCE(SUM(score), 0) as "totalScore",
        COALESCE(AVG(score), 0) as "averageScore",
        COALESCE(MAX(score), 0) as "bestScore",
        COALESCE(SUM(time_played_ms), 0) as "totalTimePlayed",
        COALESCE(AVG(time_played_ms), 0) as "averageTimePerGame",
        
        -- Métriques de performance
        COALESCE(SUM(total_moves), 0) as "totalMoves",
        COALESCE(SUM(successful_moves), 0) as "successfulMoves",
        COALESCE(SUM(failed_moves), 0) as "failedMoves",
        CASE 
          WHEN COALESCE(SUM(total_moves), 0) > 0 
          THEN (COALESCE(SUM(successful_moves), 0)::DECIMAL / COALESCE(SUM(total_moves), 0)::DECIMAL) * 100
          ELSE 0 
        END as "overallAccuracy",
        COALESCE(AVG(accuracy_rate), 0) as "averageAccuracy",
        COALESCE(AVG(average_move_time_ms), 0) as "averageMoveTime",
        COALESCE(MIN(fastest_move_time_ms), 0) as "fastestMove",
        COALESCE(MAX(slowest_move_time_ms), 0) as "slowestMove",
        
        -- Statistiques par opération
        COALESCE(SUM(additions_count), 0) as "totalAdditions",
        COALESCE(SUM(subtractions_count), 0) as "totalSubtractions",
        COALESCE(SUM(multiplications_count), 0) as "totalMultiplications",
        COALESCE(SUM(divisions_count), 0) as "totalDivisions",
        COALESCE(SUM(additions_score), 0) as "additionsScore",
        COALESCE(SUM(subtractions_score), 0) as "subtractionsScore",
        COALESCE(SUM(multiplications_score), 0) as "multiplicationsScore",
        COALESCE(SUM(divisions_score), 0) as "divisionsScore",
        
        -- Métriques de temps par opération
        COALESCE(SUM(time_spent_on_additions_ms), 0) as "timeSpentOnAdditions",
        COALESCE(SUM(time_spent_on_subtractions_ms), 0) as "timeSpentOnSubtractions",
        COALESCE(SUM(time_spent_on_multiplications_ms), 0) as "timeSpentOnMultiplications",
        COALESCE(SUM(time_spent_on_divisions_ms), 0) as "timeSpentOnDivisions",
        
        -- Métriques de grille
        COALESCE(AVG(grid_completion_rate), 0) as "averageGridCompletion",
        COALESCE(MAX(max_consecutive_hits), 0) as "maxConsecutiveHits",
        COALESCE(MAX(max_consecutive_misses), 0) as "maxConsecutiveMisses",
        COALESCE(MAX(longest_combo_chain), 0) as "longestComboChain",
        
        -- Métriques d'engagement
        COALESCE(AVG(engagement_score), 0) as "averageEngagement",
        COALESCE(AVG(focus_time_percentage), 0) as "averageFocusTime",
        COALESCE(SUM(difficulty_adjustments), 0) as "totalDifficultyAdjustments"
      FROM cubematch_scores 
      WHERE user_id = ${userId} ${timeFilter}
    `;

    res.json(performanceStats[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats de performance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/progression-trends - Tendances de progression
router.get('/progression-trends', requireAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user!.userId;

    const trends = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as games,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(AVG(accuracy_rate), 0) as averageAccuracy,
        COALESCE(AVG(level), 1) as averageLevel,
        COALESCE(SUM(time_played_ms), 0) as totalTimePlayed
      FROM cubematch_scores 
      WHERE user_id = ${userId} 
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.json(trends);
  } catch (error) {
    console.error('Erreur lors de la récupération des tendances:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/recommendations - Recommandations personnalisées
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Analyser les performances pour générer des recommandations
    const recommendations = await generateRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    console.error('Erreur lors de la génération des recommandations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/generate-insights - Générer des insights
router.post('/generate-insights', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Appeler la fonction PostgreSQL pour générer les insights
    await prisma.$executeRaw`SELECT generate_cubematch_insights(${userId})`;

    res.json({ success: true, message: 'Insights générés avec succès' });
  } catch (error) {
    console.error('Erreur lors de la génération des insights:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/export - Exporter les données utilisateur
router.get('/export', requireAuth, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const userId = req.user!.userId;

    const userData = await prisma.$queryRaw`
      SELECT 
        cs.*,
        cus.total_games as "userTotalGames",
        cus.best_score as "userBestScore",
        cus.average_score as "userAverageScore",
        cus.highest_level as "userHighestLevel",
        cus.favorite_operator as "userFavoriteOperator"
      FROM cubematch_scores cs
      LEFT JOIN cubematch_user_stats cus ON cs.user_id = cus.user_id
      WHERE cs.user_id = ${userId}
      ORDER BY cs.created_at DESC
    `;

    if (format === 'csv') {
      // Convertir en CSV
      const csv = convertToCSV(userData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cubematch-data.csv"');
      res.send(csv);
    } else {
      res.json(userData);
    }
  } catch (error) {
    console.error('Erreur lors de l\'export des données:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour générer des insights par défaut
async function generateDefaultInsights(userId: string) {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        operator,
        COUNT(*) as games,
        COALESCE(AVG(score), 0) as avgScore,
        COALESCE(AVG(accuracy_rate), 0) as avgAccuracy
      FROM cubematch_scores 
      WHERE user_id = ${userId}
      GROUP BY operator
      ORDER BY avgScore DESC
    `;

    const strengthAreas = stats
      .filter((s: any) => s.avgScore > 50)
      .map((s: any) => `${s.operator} (${s.avgScore.toFixed(0)} pts)`);

    const improvementAreas = stats
      .filter((s: any) => s.avgScore < 50)
      .map((s: any) => `${s.operator} (${s.avgScore.toFixed(0)} pts)`);

    const recommendedOperators = stats
      .filter((s: any) => s.avgAccuracy < 80)
      .map((s: any) => s.operator);

    return {
      strengthAreas: strengthAreas.length > 0 ? strengthAreas : ['Aucune donnée suffisante'],
      improvementAreas: improvementAreas.length > 0 ? improvementAreas : ['Continuez à pratiquer'],
      recommendedOperators: recommendedOperators.length > 0 ? recommendedOperators : ['ADD'],
      progressScore: 50,
      consistencyScore: 75,
      challengeReadiness: 60,
      bestPlayingHours: ['14:00', '16:00', '18:00'],
      optimalSessionDuration: 1800000, // 30 minutes
      recommendedBreakFrequency: 15 // minutes
    };
  } catch (error) {
    console.error('Erreur lors de la génération des insights par défaut:', error);
    return {
      strengthAreas: ['Continuez à jouer pour générer des insights'],
      improvementAreas: ['Toutes les opérations'],
      recommendedOperators: ['ADD', 'SUB', 'MUL', 'DIV'],
      progressScore: 0,
      consistencyScore: 0,
      challengeReadiness: 0,
      bestPlayingHours: [],
      optimalSessionDuration: 1800000,
      recommendedBreakFrequency: 15
    };
  }
}

// Fonction pour générer des recommandations
async function generateRecommendations(userId: string) {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        operator,
        COUNT(*) as games,
        COALESCE(AVG(score), 0) as avgScore,
        COALESCE(AVG(accuracy_rate), 0) as avgAccuracy,
        COALESCE(MAX(level), 1) as maxLevel
      FROM cubematch_scores 
      WHERE user_id = ${userId}
      GROUP BY operator
    `;

    const recommendations = [];

    // Recommandations basées sur les performances
    stats.forEach((stat: any) => {
      if (stat.avgAccuracy < 70) {
        recommendations.push({
          type: 'practice',
          operator: stat.operator,
          reason: `Précision faible (${stat.avgAccuracy.toFixed(1)}%)`,
          priority: 'high'
        });
      }
      
      if (stat.avgScore < 50) {
        recommendations.push({
          type: 'improve',
          operator: stat.operator,
          reason: `Score moyen bas (${stat.avgScore.toFixed(0)} pts)`,
          priority: 'medium'
        });
      }
      
      if (stat.maxLevel < 5) {
        recommendations.push({
          type: 'challenge',
          operator: stat.operator,
          reason: `Niveau maximum atteint: ${stat.maxLevel}`,
          priority: 'low'
        });
      }
    });

    // Recommandations générales
    if (stats.length === 0) {
      recommendations.push({
        type: 'start',
        operator: 'ADD',
        reason: 'Commencez par les additions',
        priority: 'high'
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Erreur lors de la génération des recommandations:', error);
    return [];
  }
}

// Fonction pour convertir en CSV
function convertToCSV(data: any[]) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export default router;
