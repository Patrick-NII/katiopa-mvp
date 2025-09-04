// Fonctions CubeMatch pour l'intégration frontend
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour récupérer les données CubeMatch détaillées d'un enfant
export async function getCubeMatchData(userId: string): Promise<any> {
  try {
    // Récupérer les statistiques globales CubeMatch
    const globalStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalGames,
        COALESCE(SUM(score), 0) as totalScore,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(MAX(score), 0) as bestScore,
        COALESCE(SUM(time_played_ms), 0) as totalTimePlayed,
        COALESCE(AVG(time_played_ms), 0) as averageTimePerGame,
        COALESCE(MAX(level), 1) as highestLevel,
        COALESCE(AVG(level), 1) as averageLevel
      FROM cubematch_scores 
      WHERE user_id = ${userId}
    `;

    // Récupérer les statistiques par opération
    const operatorStats = await prisma.$queryRaw`
      SELECT 
        operator,
        COUNT(*) as games,
        COALESCE(SUM(score), 0) as totalScore,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(MAX(score), 0) as bestScore,
        COALESCE(SUM(time_played_ms), 0) as totalTimePlayed,
        COALESCE(AVG(accuracy_rate), 0) as averageAccuracy,
        COALESCE(SUM(total_moves), 0) as totalMoves,
        COALESCE(SUM(successful_moves), 0) as successfulMoves,
        COALESCE(SUM(failed_moves), 0) as failedMoves,
        COALESCE(AVG(average_move_time_ms), 0) as averageMoveTime,
        COALESCE(MAX(level), 1) as highestLevel,
        COALESCE(AVG(level), 1) as averageLevel
      FROM cubematch_scores 
      WHERE user_id = ${userId}
      GROUP BY operator
      ORDER BY games DESC
    `;

    // Récupérer les insights IA
    const insights = await prisma.$queryRaw`
      SELECT 
        strength_areas as strengthAreas,
        improvement_areas as improvementAreas,
        recommended_operators as recommendedOperators,
        progress_score as progressScore,
        consistency_score as consistencyScore,
        challenge_readiness as challengeReadiness
      FROM cubematch_insights 
      WHERE user_id = ${userId}
    `;

    // Récupérer les sessions récentes
    const recentSessions = await prisma.$queryRaw`
      SELECT 
        session_start as sessionStart,
        session_end as sessionEnd,
        total_games_played as totalGamesPlayed,
        total_score as totalScore,
        total_time_played_ms as totalTimePlayed,
        engagement_level as engagementLevel
      FROM cubematch_sessions 
      WHERE user_id = ${userId}
      ORDER BY session_start DESC
      LIMIT 10
    `;

    // Récupérer les performances détaillées
    const performanceStats = await prisma.$queryRaw`
      SELECT 
        -- Métriques de performance
        COALESCE(SUM(total_moves), 0) as totalMoves,
        COALESCE(SUM(successful_moves), 0) as successfulMoves,
        COALESCE(SUM(failed_moves), 0) as failedMoves,
        CASE 
          WHEN COALESCE(SUM(total_moves), 0) > 0 
          THEN (COALESCE(SUM(successful_moves), 0)::DECIMAL / COALESCE(SUM(total_moves), 0)::DECIMAL) * 100
          ELSE 0 
        END as overallAccuracy,
        COALESCE(AVG(accuracy_rate), 0) as averageAccuracy,
        COALESCE(AVG(average_move_time_ms), 0) as averageMoveTime,
        COALESCE(MIN(fastest_move_time_ms), 0) as fastestMove,
        COALESCE(MAX(slowest_move_time_ms), 0) as slowestMove,
        
        -- Statistiques par opération
        COALESCE(SUM(additions_count), 0) as totalAdditions,
        COALESCE(SUM(subtractions_count), 0) as totalSubtractions,
        COALESCE(SUM(multiplications_count), 0) as totalMultiplications,
        COALESCE(SUM(divisions_count), 0) as totalDivisions,
        COALESCE(SUM(additions_score), 0) as additionsScore,
        COALESCE(SUM(subtractions_score), 0) as subtractionsScore,
        COALESCE(SUM(multiplications_score), 0) as multiplicationsScore,
        COALESCE(SUM(divisions_score), 0) as divisionsScore,
        
        -- Métriques de temps par opération
        COALESCE(SUM(time_spent_on_additions_ms), 0) as timeSpentOnAdditions,
        COALESCE(SUM(time_spent_on_subtractions_ms), 0) as timeSpentOnSubtractions,
        COALESCE(SUM(time_spent_on_multiplications_ms), 0) as timeSpentOnMultiplications,
        COALESCE(SUM(time_spent_on_divisions_ms), 0) as timeSpentOnDivisions,
        
        -- Métriques de grille
        COALESCE(AVG(grid_completion_rate), 0) as averageGridCompletion,
        COALESCE(MAX(max_consecutive_hits), 0) as maxConsecutiveHits,
        COALESCE(MAX(max_consecutive_misses), 0) as maxConsecutiveMisses,
        COALESCE(MAX(longest_combo_chain), 0) as longestComboChain,
        
        -- Métriques d'engagement
        COALESCE(AVG(engagement_score), 0) as averageEngagement,
        COALESCE(AVG(focus_time_percentage), 0) as averageFocusTime,
        COALESCE(SUM(difficulty_adjustments), 0) as totalDifficultyAdjustments
      FROM cubematch_scores 
      WHERE user_id = ${userId}
    `;

    // Récupérer les tendances de progression (7 derniers jours)
    const progressionTrends = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as games,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(AVG(accuracy_rate), 0) as averageAccuracy,
        COALESCE(AVG(level), 1) as averageLevel,
        COALESCE(SUM(time_played_ms), 0) as totalTimePlayed
      FROM cubematch_scores 
      WHERE user_id = ${userId} 
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Récupérer les recommandations
    const recommendations = await generateCubeMatchRecommendations(userId);

    return {
      globalStats: globalStats[0],
      operatorStats,
      insights: insights[0] || null,
      recentSessions,
      performanceStats: performanceStats[0],
      progressionTrends,
      recommendations
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données CubeMatch:', error);
    return null;
  }
}

// Fonction pour générer des recommandations CubeMatch
async function generateCubeMatchRecommendations(userId: string): Promise<any[]> {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        operator,
        COUNT(*) as games,
        COALESCE(AVG(score), 0) as avgScore,
        COALESCE(AVG(accuracy_rate), 0) as avgAccuracy,
        COALESCE(MAX(level), 1) as maxLevel,
        COALESCE(SUM(time_played_ms), 0) as totalTimePlayed
      FROM cubematch_scores 
      WHERE user_id = ${userId}
      GROUP BY operator
    `;

    const recommendations = [];

    // Analyser chaque opération
    stats.forEach((stat: any) => {
      // Recommandations basées sur la précision
      if (stat.avgAccuracy < 70) {
        recommendations.push({
          type: 'accuracy',
          operator: stat.operator,
          reason: `Précision faible en ${stat.operator} (${stat.avgAccuracy.toFixed(1)}%)`,
          suggestion: 'Pratiquer plus lentement et se concentrer sur la précision',
          priority: 'high'
        });
      }

      // Recommandations basées sur le score
      if (stat.avgScore < 50) {
        recommendations.push({
          type: 'score',
          operator: stat.operator,
          reason: `Score moyen bas en ${stat.operator} (${stat.avgScore.toFixed(0)} pts)`,
          suggestion: 'Revoir les bases et pratiquer des exercices plus simples',
          priority: 'medium'
        });
      }

      // Recommandations basées sur le niveau
      if (stat.maxLevel < 5) {
        recommendations.push({
          type: 'level',
          operator: stat.operator,
          reason: `Niveau maximum atteint en ${stat.operator}: ${stat.maxLevel}`,
          suggestion: 'Tenter des niveaux plus difficiles pour progresser',
          priority: 'low'
        });
      }

      // Recommandations basées sur le temps de jeu
      if (stat.totalTimePlayed < 300000) { // Moins de 5 minutes
        recommendations.push({
          type: 'practice',
          operator: stat.operator,
          reason: `Peu de temps passé sur ${stat.operator} (${Math.round(stat.totalTimePlayed / 60000)} min)`,
          suggestion: 'Passer plus de temps à pratiquer cette opération',
          priority: 'medium'
        });
      }
    });

    // Recommandations générales
    if (stats.length === 0) {
      recommendations.push({
        type: 'start',
        operator: 'ADD',
        reason: 'Aucune partie jouée',
        suggestion: 'Commencez par les additions pour vous familiariser',
        priority: 'high'
      });
    }

    // Recommandations basées sur l'équilibre
    if (stats.length > 0) {
      const totalGames = stats.reduce((sum: number, s: any) => sum + s.games, 0);
      const mostPlayed = stats.reduce((max: any, s: any) => s.games > max.games ? s : max, stats[0]);
      
      if (mostPlayed.games > totalGames * 0.6) {
        recommendations.push({
          type: 'balance',
          operator: 'ALL',
          reason: `Trop de temps passé sur ${mostPlayed.operator} (${Math.round(mostPlayed.games / totalGames * 100)}%)`,
          suggestion: 'Équilibrer la pratique entre toutes les opérations',
          priority: 'medium'
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Erreur lors de la génération des recommandations CubeMatch:', error);
    return [];
  }
}

// Fonction pour générer un résumé CubeMatch pour l'IA
export function generateCubeMatchSummary(cubeMatchData: any): string {
  if (!cubeMatchData) {
    return "Aucune donnée CubeMatch disponible.";
  }

  const { globalStats, operatorStats, insights, recommendations } = cubeMatchData;

  let summary = `**Résumé CubeMatch :**\n\n`;

  // Statistiques globales
  summary += `**Statistiques globales :**\n`;
  summary += `• Parties jouées : ${globalStats.totalGames}\n`;
  summary += `• Score total : ${globalStats.totalScore.toLocaleString()}\n`;
  summary += `• Score moyen : ${Math.round(globalStats.averageScore)}\n`;
  summary += `• Meilleur score : ${globalStats.bestScore.toLocaleString()}\n`;
  summary += `• Temps total : ${Math.round(globalStats.totalTimePlayed / 60000)} minutes\n`;
  summary += `• Niveau maximum : ${globalStats.highestLevel}\n\n`;

  // Statistiques par opération
  if (operatorStats.length > 0) {
    summary += `**Performance par opération :**\n`;
    operatorStats.forEach((op: any) => {
      const operatorNameMap: Record<string, string> = {
        'ADD': 'Addition',
        'SUB': 'Soustraction',
        'MUL': 'Multiplication',
        'DIV': 'Division'
      };
      const operatorName = operatorNameMap[op.operator] || op.operator;

      summary += `• ${operatorName} : ${op.games} parties, score moyen ${Math.round(op.averageScore)}, précision ${op.averageAccuracy.toFixed(1)}%\n`;
    });
    summary += `\n`;
  }

  // Insights IA
  if (insights) {
    summary += `**Insights IA :**\n`;
    if (insights.strengthAreas && insights.strengthAreas.length > 0) {
      summary += `• Forces : ${insights.strengthAreas.join(', ')}\n`;
    }
    if (insights.improvementAreas && insights.improvementAreas.length > 0) {
      summary += `• Axes d'amélioration : ${insights.improvementAreas.join(', ')}\n`;
    }
    if (insights.recommendedOperators && insights.recommendedOperators.length > 0) {
      summary += `• Opérations recommandées : ${insights.recommendedOperators.join(', ')}\n`;
    }
    summary += `• Score de progression : ${insights.progressScore.toFixed(1)}%\n`;
    summary += `• Score de consistance : ${insights.consistencyScore.toFixed(1)}%\n\n`;
  }

  // Recommandations
  if (recommendations.length > 0) {
    summary += `**Recommandations :**\n`;
    recommendations.slice(0, 5).forEach((rec: any, index: number) => {
      summary += `${index + 1}. ${rec.reason}\n`;
      summary += `   Suggestion : ${rec.suggestion}\n`;
    });
  }

  return summary;
}

