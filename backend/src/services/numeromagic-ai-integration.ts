/**
 * 🔢 NUMÉROMAGIC AI INTEGRATION SERVICE
 * 
 * Service pour intégrer les données NuméroMagic dans BubiX pour l'IA
 * Similaire au service CubeMatch mais adapté pour NuméroMagic
 * 
 * @author CubeAI Team
 * @date 2025-10-09
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fonction pour récupérer les données NuméroMagic détaillées d'un enfant
 */
export async function getNumeroMagicData(userId: string): Promise<any> {
  try {
    console.log(`🔢 Récupération données NuméroMagic pour enfant ${userId}...`);
    
    // Récupérer les scores NuméroMagic
    const numeroMagicScores = await prisma.numeroMagicScore.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        rounds: {
          orderBy: {
            round_number: 'asc'
          }
        }
      }
    });

    if (numeroMagicScores.length === 0) {
      console.log('ℹ️ Aucune donnée NuméroMagic trouvée');
      return null;
    }

    // Récupérer les stats utilisateur
    const userStats = await prisma.numeroMagicUserStats.findUnique({
      where: {
        user_id: userId
      }
    });

    // Calculer les statistiques
    const totalGames = numeroMagicScores.length;
    const totalScore = numeroMagicScores.reduce((sum: number, score: any) => sum + score.score, 0);
    const bestScore = Math.max(...numeroMagicScores.map((s: any) => s.score));
    const currentLevel = Math.max(...numeroMagicScores.map((s: any) => s.level));
    const totalTimeMs = numeroMagicScores.reduce((sum: number, score: any) => sum + Number(score.time_played_ms), 0);
    
    // Mode préféré
    const modeCounts = numeroMagicScores.reduce((acc: Record<string, number>, score: any) => {
      acc[score.game_mode] = (acc[score.game_mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteMode = Object.entries(modeCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'CLASSIC';

    // Difficulté préférée
    const difficultyCounts = numeroMagicScores.reduce((acc: Record<string, number>, score: any) => {
      acc[score.difficulty_level] = (acc[score.difficulty_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const preferredDifficulty = Object.entries(difficultyCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'EASY';

    // Statistiques par opération
    const operationStats = numeroMagicScores.reduce((acc: any, score: any) => {
      // Compter les opérations utilisées
      const operations = score.operations_allowed as string[];
      operations.forEach(op => {
        if (!acc[op]) {
          acc[op] = {
            count: 0,
            totalScore: 0,
            totalAccuracy: 0,
            games: 0
          };
        }
        acc[op].count += 1;
        acc[op].totalScore += score.score;
        acc[op].totalAccuracy += Number(score.accuracy_rate);
        acc[op].games += 1;
      });
      return acc;
    }, {});

    // Calculer les moyennes par opération
    Object.keys(operationStats).forEach(op => {
      const stats = operationStats[op];
      stats.averageScore = stats.totalScore / stats.games;
      stats.averageAccuracy = stats.totalAccuracy / stats.games;
    });

    const lastPlayed = numeroMagicScores[0]?.created_at;

    console.log(`✅ Données NuméroMagic récupérées: ${totalGames} parties, niveau ${currentLevel}`);

    return {
      game: 'NuméroMagic',
      totalGames,
      totalScore,
      bestScore,
      averageScore: totalGames > 0 ? totalScore / totalGames : 0,
      currentLevel,
      totalTimeMs,
      averageTimePerGame: totalGames > 0 ? totalTimeMs / totalGames : 0,
      favoriteMode,
      preferredDifficulty,
      operationStats,
      lastPlayed,
      scores: numeroMagicScores.map(score => ({
        id: score.id,
        score: score.score,
        level: score.level,
        gameMode: score.game_mode,
        difficultyLevel: score.difficulty_level,
        totalRounds: score.total_rounds,
        successfulRounds: score.successful_rounds,
        accuracyRate: Number(score.accuracy_rate),
        maxCombo: score.max_combo,
        bestStreak: score.best_streak,
        engagementScore: score.engagement_score,
        flowScore: score.flow_score,
        timePlayedMs: score.time_played_ms,
        createdAt: score.created_at,
        rounds: score.rounds.map(round => ({
          roundNumber: round.round_number,
          targetNumber: round.target_number,
          isCorrect: round.is_correct,
          solveTimeMs: round.solve_time_ms,
          wasPerfect: round.was_perfect,
          difficultyRating: Number(round.difficulty_rating)
        }))
      }))
    };

  } catch (error) {
    console.error('❌ Erreur récupération données NuméroMagic:', error);
    return null;
  }
}

/**
 * Générer un dataset d'entraînement pour BubiX basé sur NuméroMagic
 */
export async function getNumeroMagicTrainingDataset(userId: string): Promise<any> {
  try {
    console.log(`🤖 Génération dataset BubiX NuméroMagic pour utilisateur: ${userId}`);
    
    // Récupérer les données de performance
    const performanceData = await prisma.numeroMagicScore.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
      include: {
        rounds: {
          orderBy: { round_number: 'asc' }
        }
      }
    });

    if (performanceData.length === 0) {
      return {
        hasData: false,
        message: 'Aucune donnée NuméroMagic disponible pour l\'analyse'
      };
    }

    // Analyser les patterns de performance
    const patterns = {
      // Progression dans le temps
      progression: performanceData.map((game, index) => ({
        gameNumber: index + 1,
        score: game.score,
        level: game.level,
        accuracy: Number(game.accuracy_rate),
        date: game.created_at
      })),

      // Performance par mode
      byMode: performanceData.reduce((acc: any, game) => {
        const mode = game.game_mode;
        if (!acc[mode]) {
          acc[mode] = {
            games: 0,
            totalScore: 0,
            bestScore: 0,
            averageAccuracy: 0,
            totalRounds: 0,
            successfulRounds: 0
          };
        }
        acc[mode].games += 1;
        acc[mode].totalScore += game.score;
        acc[mode].bestScore = Math.max(acc[mode].bestScore, game.score);
        acc[mode].totalRounds += game.total_rounds;
        acc[mode].successfulRounds += game.successful_rounds;
        acc[mode].averageAccuracy += Number(game.accuracy_rate);
        
        return acc;
      }, {}),

      // Performance par difficulté
      byDifficulty: performanceData.reduce((acc: any, game) => {
        const difficulty = game.difficulty_level;
        if (!acc[difficulty]) {
          acc[difficulty] = {
            games: 0,
            totalScore: 0,
            bestScore: 0,
            averageAccuracy: 0,
            averageSolveTime: 0
          };
        }
        acc[difficulty].games += 1;
        acc[difficulty].totalScore += game.score;
        acc[difficulty].bestScore = Math.max(acc[difficulty].bestScore, game.score);
        acc[difficulty].averageAccuracy += Number(game.accuracy_rate);
        acc[difficulty].averageSolveTime += Number(game.average_solve_time_ms || 0);
        
        return acc;
      }, {}),

      // Patterns cognitifs
      cognitivePatterns: {
        engagementTrend: performanceData.map(game => ({
          date: game.created_at,
          engagementScore: game.engagement_score,
          flowScore: game.flow_score
        })),
        problemSolvingStyle: performanceData.map(game => ({
          gameMode: game.game_mode,
          difficulty: game.difficulty_level,
          solveTime: Number(game.average_solve_time_ms || 0),
          accuracy: Number(game.accuracy_rate),
          hintsUsed: game.hints_used
        }))
      }
    };

    // Calculer les moyennes pour les statistiques par mode/difficulté
    Object.keys(patterns.byMode).forEach(mode => {
      const stats = patterns.byMode[mode];
      stats.averageScore = stats.totalScore / stats.games;
      stats.averageAccuracy = stats.averageAccuracy / stats.games;
      stats.successRate = stats.totalRounds > 0 ? (stats.successfulRounds / stats.totalRounds) * 100 : 0;
    });

    Object.keys(patterns.byDifficulty).forEach(difficulty => {
      const stats = patterns.byDifficulty[difficulty];
      stats.averageScore = stats.totalScore / stats.games;
      stats.averageAccuracy = stats.averageAccuracy / stats.games;
      stats.averageSolveTime = stats.averageSolveTime / stats.games;
    });

    console.log(`✅ Dataset NuméroMagic généré: ${performanceData.length} parties analysées`);

    return {
      hasData: true,
      game: 'NuméroMagic',
      totalGames: performanceData.length,
      patterns,
      summary: {
        totalScore: performanceData.reduce((sum, game) => sum + game.score, 0),
        bestScore: Math.max(...performanceData.map(game => game.score)),
        averageAccuracy: performanceData.reduce((sum, game) => sum + Number(game.accuracy_rate), 0) / performanceData.length,
        favoriteMode: Object.entries(patterns.byMode).sort(([,a], [,b]) => (b as any).games - (a as any).games)[0]?.[0],
        preferredDifficulty: Object.entries(patterns.byDifficulty).sort(([,a], [,b]) => (b as any).games - (a as any).games)[0]?.[0],
        totalRounds: performanceData.reduce((sum, game) => sum + game.total_rounds, 0),
        successfulRounds: performanceData.reduce((sum, game) => sum + game.successful_rounds, 0),
        lastPlayed: performanceData[0]?.created_at
      }
    };

  } catch (error) {
    console.error('❌ Erreur génération dataset NuméroMagic:', error);
    return {
      hasData: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
