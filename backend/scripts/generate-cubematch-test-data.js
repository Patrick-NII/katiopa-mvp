// Script pour générer des données de test CubeMatch détaillées
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour générer des données de test CubeMatch
async function generateCubeMatchTestData() {
  console.log('🎮 Génération des données de test CubeMatch...');

  try {
    // Récupérer les utilisateurs enfants existants
    const children = await prisma.userSession.findMany({
      where: { userType: 'CHILD', isActive: true },
      take: 5
    });

    if (children.length === 0) {
      console.log('❌ Aucun enfant trouvé. Créez d\'abord des comptes enfants.');
      return;
    }

    const operators = ['ADD', 'SUB', 'MUL', 'DIV'];
    const gameModes = ['classic', 'timed', 'cascade'];
    const difficultyLevels = ['easy', 'normal', 'hard'];
    const themes = ['classic', 'ocean', 'sunset', 'forest'];

    for (const child of children) {
      console.log(`👶 Génération de données pour ${child.firstName} ${child.lastName}...`);

      // Générer 20-50 parties par enfant
      const numGames = Math.floor(Math.random() * 30) + 20;
      
      for (let i = 0; i < numGames; i++) {
        const operator = operators[Math.floor(Math.random() * operators.length)];
        const gameMode = gameModes[Math.floor(Math.random() * gameModes.length)];
        const difficultyLevel = difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        
        // Scores réalistes basés sur l'opération et la difficulté
        let baseScore = 100;
        if (operator === 'MUL' || operator === 'DIV') baseScore = 80;
        if (difficultyLevel === 'hard') baseScore = 120;
        if (difficultyLevel === 'easy') baseScore = 60;
        
        const score = Math.floor(Math.random() * baseScore) + baseScore;
        const level = Math.floor(Math.random() * 10) + 1;
        const timePlayedMs = Math.floor(Math.random() * 120000) + 30000; // 30s à 2.5min
        
        // Métriques de performance détaillées
        const totalMoves = Math.floor(Math.random() * 50) + 10;
        const successfulMoves = Math.floor(Math.random() * totalMoves) + Math.floor(totalMoves * 0.7);
        const failedMoves = totalMoves - successfulMoves;
        const accuracyRate = (successfulMoves / totalMoves) * 100;
        const averageMoveTimeMs = Math.floor(Math.random() * 3000) + 500;
        
        // Statistiques par opération
        const additionsCount = operator === 'ADD' ? Math.floor(Math.random() * 20) + 5 : 0;
        const subtractionsCount = operator === 'SUB' ? Math.floor(Math.random() * 20) + 5 : 0;
        const multiplicationsCount = operator === 'MUL' ? Math.floor(Math.random() * 15) + 3 : 0;
        const divisionsCount = operator === 'DIV' ? Math.floor(Math.random() * 15) + 3 : 0;
        
        const additionsScore = operator === 'ADD' ? Math.floor(score * 0.8) : 0;
        const subtractionsScore = operator === 'SUB' ? Math.floor(score * 0.8) : 0;
        const multiplicationsScore = operator === 'MUL' ? Math.floor(score * 0.8) : 0;
        const divisionsScore = operator === 'DIV' ? Math.floor(score * 0.8) : 0;
        
        // Métriques de temps par opération
        const timeSpentOnAdditionsMs = operator === 'ADD' ? Math.floor(timePlayedMs * 0.8) : 0;
        const timeSpentOnSubtractionsMs = operator === 'SUB' ? Math.floor(timePlayedMs * 0.8) : 0;
        const timeSpentOnMultiplicationsMs = operator === 'MUL' ? Math.floor(timePlayedMs * 0.8) : 0;
        const timeSpentOnDivisionsMs = operator === 'DIV' ? Math.floor(timePlayedMs * 0.8) : 0;
        
        // Métriques de grille
        const gridCompletionRate = Math.floor(Math.random() * 40) + 60; // 60-100%
        const maxConsecutiveHits = Math.floor(Math.random() * 10) + 2;
        const maxConsecutiveMisses = Math.floor(Math.random() * 5) + 1;
        const longestComboChain = Math.floor(Math.random() * 8) + 2;
        
        // Métriques d'engagement
        const engagementScore = Math.floor(Math.random() * 30) + 70; // 70-100%
        const focusTimePercentage = Math.floor(Math.random() * 20) + 80; // 80-100%
        const difficultyAdjustments = Math.floor(Math.random() * 3);
        
        // Dates récentes (derniers 30 jours)
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        // Insérer le score avec toutes les données détaillées
        await prisma.$executeRaw`
          INSERT INTO cubematch_scores (
            user_id, username, score, level, time_played_ms, operator, target,
            allow_diagonals, grid_size_rows, grid_size_cols, max_size, spawn_rate_min,
            spawn_rate_max, tick_ms, combo_max, cells_cleared, hints_used,
            game_duration_seconds, game_mode, difficulty_level, total_moves,
            successful_moves, failed_moves, accuracy_rate, average_move_time_ms,
            fastest_move_time_ms, slowest_move_time_ms, additions_count,
            subtractions_count, multiplications_count, divisions_count,
            additions_score, subtractions_score, multiplications_score, divisions_score,
            grid_completion_rate, max_consecutive_hits, max_consecutive_misses,
            longest_combo_chain, target_numbers_used, operator_sequence,
            time_spent_on_additions_ms, time_spent_on_subtractions_ms,
            time_spent_on_multiplications_ms, time_spent_on_divisions_ms,
            session_start_time, session_end_time, breaks_taken, total_break_time_ms,
            engagement_score, focus_time_percentage, difficulty_adjustments,
            theme_used, sound_enabled, assist_enabled, hints_enabled, created_at
          ) VALUES (
            ${child.id}, ${`${child.firstName} ${child.lastName}`}, ${score}, ${level}, ${timePlayedMs},
            ${operator}, ${Math.floor(Math.random() * 20) + 5}, ${Math.random() > 0.5},
            ${Math.floor(Math.random() * 4) + 8}, ${Math.floor(Math.random() * 4) + 8},
            ${Math.floor(Math.random() * 4) + 7}, ${Math.floor(Math.random() * 3) + 2},
            ${Math.floor(Math.random() * 3) + 4}, ${Math.floor(Math.random() * 2000) + 3000},
            ${Math.floor(Math.random() * 5)}, ${Math.floor(Math.random() * 30) + 10},
            ${Math.floor(Math.random() * 3)}, ${Math.floor(timePlayedMs / 1000)},
            ${gameMode}, ${difficultyLevel}, ${totalMoves}, ${successfulMoves},
            ${failedMoves}, ${accuracyRate}, ${averageMoveTimeMs},
            ${Math.floor(averageMoveTimeMs * 0.5)}, ${Math.floor(averageMoveTimeMs * 2)},
            ${additionsCount}, ${subtractionsCount}, ${multiplicationsCount},
            ${divisionsCount}, ${additionsScore}, ${subtractionsScore},
            ${multiplicationsScore}, ${divisionsScore}, ${gridCompletionRate},
            ${maxConsecutiveHits}, ${maxConsecutiveMisses}, ${longestComboChain},
            ${JSON.stringify([5, 10, 15, 20])}, ${JSON.stringify([operator])},
            ${timeSpentOnAdditionsMs}, ${timeSpentOnSubtractionsMs},
            ${timeSpentOnMultiplicationsMs}, ${timeSpentOnDivisionsMs},
            ${createdAt}, ${new Date(createdAt.getTime() + timePlayedMs)},
            ${Math.floor(Math.random() * 2)}, ${Math.floor(Math.random() * 30000)},
            ${engagementScore}, ${focusTimePercentage}, ${difficultyAdjustments},
            ${theme}, ${Math.random() > 0.2}, ${Math.random() > 0.3}, ${Math.random() > 0.4},
            ${createdAt}
          )
        `;
      }

      console.log(`✅ ${numGames} parties générées pour ${child.firstName}`);
    }

    console.log('🎉 Données de test CubeMatch générées avec succès !');
    console.log('📊 Les triggers automatiques vont maintenant mettre à jour les statistiques...');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des données:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
generateCubeMatchTestData();
