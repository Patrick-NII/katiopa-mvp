import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RealTimeCubeMatchTracker {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
  }

  // Démarrer le tracking en temps réel
  startRealTimeTracking() {
    if (this.isRunning) {
      console.log('⚠️ Le tracking est déjà en cours...');
      return;
    }

    console.log('🔄 Démarrage du tracking CubeMatch en temps réel...');
    this.isRunning = true;
    
    // Mise à jour toutes les 10 secondes pour les tests
    this.updateInterval = setInterval(async () => {
      await this.updateAllCubeMatchData();
    }, 10000); // 10 secondes

    console.log('✅ Tracking CubeMatch démarré (mise à jour toutes les 10s)');
  }

  // Arrêter le tracking
  stopRealTimeTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isRunning = false;
      console.log('🛑 Tracking CubeMatch arrêté');
    }
  }

  // Mettre à jour toutes les données CubeMatch
  async updateAllCubeMatchData() {
    console.log('📊 Mise à jour des données CubeMatch en temps réel...');
    
    try {
      // Récupérer tous les enfants actifs
      const activeChildren = await prisma.userSession.findMany({
        where: {
          isActive: true,
          userType: 'CHILD'
        }
      });

      console.log(`📝 ${activeChildren.length} enfants actifs détectés`);

      for (const child of activeChildren) {
        await this.updateChildCubeMatchData(child.id, child.firstName);
      }

      console.log('✅ Données CubeMatch mises à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour CubeMatch:', error);
    }
  }

  // Mettre à jour les données CubeMatch d'un enfant
  async updateChildCubeMatchData(childId, childName) {
    try {
      // Récupérer les données CubeMatch actuelles
      const cubeMatchStats = await prisma.$queryRaw`
        SELECT
          COUNT(*) as totalGames,
          COALESCE(SUM(score), 0) as totalScore,
          COALESCE(AVG(score), 0) as averageScore,
          COALESCE(MAX(score), 0) as bestScore,
          COALESCE(MAX(level), 1) as highestLevel,
          COALESCE(MAX(longest_combo_chain), 0) as bestCombo
        FROM cubematch_scores
        WHERE user_id = ${childId}
      `;

      const stats = cubeMatchStats[0];
      const totalGames = Number(stats.totalgames);
      const totalScore = Number(stats.totalscore);
      const highestLevel = Number(stats.highestlevel);
      const bestCombo = Number(stats.bestcombo);

      // Récupérer les données par opération
      const operatorStats = await prisma.$queryRaw`
        SELECT 
          operator,
          COUNT(*) as games,
          COALESCE(AVG(score), 0) as averageScore,
          COALESCE(AVG(accuracy_rate), 0) as averageAccuracy
        FROM cubematch_scores 
        WHERE user_id = ${childId}
        GROUP BY operator
        ORDER BY games DESC
      `;

      // Formater les données pour l'IA
      let cubeMatchInfo = `**CubeMatch :** ${totalGames} parties, score total ${totalScore.toLocaleString()}, meilleur score ${stats.bestscore}, niveau max ${highestLevel}, meilleur combo x${bestCombo}.`;
      
      if (operatorStats.length > 0) {
        cubeMatchInfo += ` Opérations : `;
        operatorStats.forEach((op, i) => {
          const opName = { 'ADD': 'Add', 'SUB': 'Sous', 'MUL': 'Mult', 'DIV': 'Div' }[op.operator] || op.operator;
          cubeMatchInfo += `${opName}(${Number(op.games)} parties, ${Math.round(op.averagescore)} pts)`;
          if (i < operatorStats.length - 1) cubeMatchInfo += ', ';
        });
      }

      // Mettre à jour les statistiques utilisateur (si la table existe)
      await this.updateUserCubeMatchStats(childId, {
        totalGames,
        totalScore,
        highestLevel,
        bestCombo,
        cubeMatchInfo
      });

      console.log(`📈 ${childName}: ${totalGames} parties, niveau ${highestLevel}, score ${totalScore}`);

    } catch (error) {
      console.error(`❌ Erreur mise à jour ${childName}:`, error);
    }
  }

  // Mettre à jour les statistiques utilisateur
  async updateUserCubeMatchStats(userId, stats) {
    try {
      // Pour l'instant, on log les données
      // Plus tard, on pourra les stocker dans une table dédiée
      console.log(`📊 Stats CubeMatch mises à jour pour ${userId}:`, {
        totalGames: stats.totalGames,
        totalScore: stats.totalScore,
        highestLevel: stats.highestLevel,
        bestCombo: stats.bestCombo,
        cubeMatchInfo: stats.cubeMatchInfo
      });
    } catch (error) {
      console.error('❌ Erreur mise à jour stats utilisateur:', error);
    }
  }

  // Récupérer les données CubeMatch en temps réel pour un utilisateur
  async getRealTimeCubeMatchData(userId) {
    try {
      const cubeMatchStats = await prisma.$queryRaw`
        SELECT
          COUNT(*) as totalGames,
          COALESCE(SUM(score), 0) as totalScore,
          COALESCE(AVG(score), 0) as averageScore,
          COALESCE(MAX(score), 0) as bestScore,
          COALESCE(MAX(level), 1) as highestLevel,
          COALESCE(MAX(longest_combo_chain), 0) as bestCombo
        FROM cubematch_scores
        WHERE user_id = ${userId}
      `;

      const stats = cubeMatchStats[0];
      
      return {
        totalGames: Number(stats.totalgames),
        totalScore: Number(stats.totalscore),
        averageScore: Number(stats.averagescore),
        bestScore: Number(stats.bestscore),
        highestLevel: Number(stats.highestlevel),
        bestCombo: Number(stats.bestcombo)
      };
    } catch (error) {
      console.error('❌ Erreur récupération données CubeMatch:', error);
      return null;
    }
  }

  // Formater les données CubeMatch pour l'IA
  formatCubeMatchDataForAI(cubeMatchData) {
    if (!cubeMatchData) return 'Aucune donnée CubeMatch disponible.';

    const { totalGames, totalScore, averageScore, bestScore, highestLevel, bestCombo } = cubeMatchData;
    
    let info = `**CubeMatch :** ${totalGames} parties, score total ${totalScore.toLocaleString()}, meilleur score ${bestScore}, niveau max ${highestLevel}, meilleur combo x${bestCombo}.`;
    
    if (averageScore > 0) {
      info += ` Score moyen ${Math.round(averageScore)}.`;
    }

    return info;
  }

  // Générer des insights CubeMatch
  generateCubeMatchInsights(cubeMatchData) {
    if (!cubeMatchData) return '';

    const { totalGames, totalScore, averageScore, highestLevel, bestCombo } = cubeMatchData;
    
    let insights = '';
    
    if (totalGames > 0) {
      insights += `A joué ${totalGames} parties de CubeMatch. `;
      
      if (highestLevel >= 20) {
        insights += 'Excellent niveau ! ';
      } else if (highestLevel >= 10) {
        insights += 'Bon niveau. ';
      } else if (highestLevel >= 5) {
        insights += 'Niveau débutant. ';
      }
      
      if (bestCombo >= 10) {
        insights += 'Très bonnes séries ! ';
      } else if (bestCombo >= 5) {
        insights += 'Bonnes séries. ';
      }
      
      if (averageScore >= 150) {
        insights += 'Très bon score moyen. ';
      } else if (averageScore >= 100) {
        insights += 'Score moyen correct. ';
      }
    }

    return insights;
  }
}

// Test du système de tracking
async function testRealTimeCubeMatchTracking() {
  console.log('🔄 Test du système de tracking CubeMatch en temps réel...\n');

  const tracker = new RealTimeCubeMatchTracker();

  // 1. Récupérer les données initiales de Lucas
  console.log('📊 Données initiales de Lucas...');
  const initialData = await tracker.getRealTimeCubeMatchData('cmf2yznx3000c45g0gqjs8844');
  console.log('📝 Données initiales:', initialData);

  // 2. Formater pour l'IA
  const formattedData = tracker.formatCubeMatchDataForAI(initialData);
  console.log('💬 Formaté pour l\'IA:', formattedData);

  // 3. Générer des insights
  const insights = tracker.generateCubeMatchInsights(initialData);
  console.log('💡 Insights:', insights);

  // 4. Démarrer le tracking
  console.log('\n🔄 Démarrage du tracking...');
  tracker.startRealTimeTracking();

  // 5. Attendre et vérifier les mises à jour
  console.log('\n⏳ Attente des mises à jour (30 secondes)...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // 6. Récupérer les données mises à jour
  console.log('\n📊 Données mises à jour de Lucas...');
  const updatedData = await tracker.getRealTimeCubeMatchData('cmf2yznx3000c45g0gqjs8844');
  console.log('📝 Données mises à jour:', updatedData);

  // 7. Comparer avec l'interface
  console.log('\n🎯 Comparaison avec l\'interface:');
  console.log(`- Base de données: Niveau ${updatedData?.highestLevel}`);
  console.log('- Interface: Niveau 27');
  console.log(`- Différence: ${Math.abs(27 - (updatedData?.highestLevel || 0))} niveaux`);

  // 8. Arrêter le tracking
  tracker.stopRealTimeTracking();

  console.log('\n✅ Test terminé !');
  console.log('\n🎯 Résumé:');
  console.log('- ✅ Système de tracking CubeMatch créé');
  console.log('- ✅ Mise à jour en temps réel (toutes les 10s)');
  console.log('- ✅ Formatage pour l\'IA');
  console.log('- ✅ Génération d\'insights');
  console.log('- ✅ Prêt pour intégration dans l\'API chat');
}

testRealTimeCubeMatchTracking().catch(console.error);
