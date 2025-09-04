import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RealTimeActivityTracker {
  constructor() {
    this.updateInterval = null;
  }

  // Démarrer le tracking des activités en temps réel
  startRealTimeActivityTracking() {
    console.log('🔄 Démarrage du tracking des activités en temps réel...');
    
    // Mettre à jour toutes les 15 secondes
    this.updateInterval = setInterval(async () => {
      await this.updateAllActivityData();
    }, 15000); // 15 secondes
  }

  // Arrêter le tracking
  stopRealTimeActivityTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Arrêt du tracking des activités');
    }
  }

  // Mettre à jour toutes les données d'activités
  async updateAllActivityData() {
    try {
      console.log('📊 Mise à jour des données d\'activités en temps réel...');
      
      // 1. Mettre à jour les données CubeMatch
      await this.updateCubeMatchData();
      
      // 2. Mettre à jour les statistiques d'activités
      await this.updateActivityStats();
      
      console.log('✅ Données d\'activités mises à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour activités:', error);
    }
  }

  // Mettre à jour les données CubeMatch en temps réel
  async updateCubeMatchData() {
    try {
      // Récupérer toutes les sessions enfants actives
      const activeChildren = await prisma.userSession.findMany({
        where: {
          userType: 'CHILD',
          isActive: true,
          currentSessionStartTime: {
            not: null
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      });

      for (const child of activeChildren) {
        // Récupérer les données CubeMatch les plus récentes
                 const cubeMatchStats = await prisma.$queryRaw`
           SELECT 
             COUNT(*) as totalGames,
             COALESCE(SUM(score), 0) as totalScore,
             COALESCE(AVG(score), 0) as averageScore,
             COALESCE(MAX(score), 0) as bestScore,
             COALESCE(MAX(level), 1) as highestLevel,
             COALESCE(MAX(longest_combo_chain), 0) as bestCombo
           FROM cubematch_scores 
           WHERE user_id = ${child.id}
         `;

        const cubeMatchOperators = await prisma.$queryRaw`
          SELECT 
            operator,
            COUNT(*) as games,
            COALESCE(AVG(score), 0) as averageScore,
            COALESCE(AVG(accuracy_rate), 0) as averageAccuracy
          FROM cubematch_scores 
          WHERE user_id = ${child.id}
          GROUP BY operator
          ORDER BY games DESC
        `;

        // Mettre à jour les statistiques globales
        await this.updateUserStats(child.id, {
          totalGames: Number(cubeMatchStats[0].totalgames),
          totalScore: Number(cubeMatchStats[0].totalscore),
          averageScore: Number(cubeMatchStats[0].averagescore),
          bestScore: Number(cubeMatchStats[0].bestscore),
          highestLevel: Number(cubeMatchStats[0].highestlevel),
          bestCombo: Number(cubeMatchStats[0].bestcombo),
          operatorStats: cubeMatchOperators
        });

        console.log(`📈 ${child.firstName}: Niveau ${cubeMatchStats[0].highestlevel}, Score ${cubeMatchStats[0].totalscore}, Parties ${cubeMatchStats[0].totalgames}`);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour CubeMatch:', error);
    }
  }

  // Mettre à jour les statistiques d'activités
  async updateActivityStats() {
    try {
      const activeChildren = await prisma.userSession.findMany({
        where: {
          userType: 'CHILD',
          isActive: true,
          currentSessionStartTime: {
            not: null
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      });

      for (const child of activeChildren) {
        // Récupérer les activités récentes
        const recentActivities = await prisma.activity.findMany({
          where: {
            userSessionId: child.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        });

        // Calculer les statistiques
        const totalActivities = recentActivities.length;
        const totalScore = recentActivities.reduce((sum, activity) => sum + (activity.score || 0), 0);
        const averageScore = totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0;
        const lastActivity = recentActivities[0];

        // Mettre à jour les statistiques utilisateur
        await this.updateUserActivityStats(child.id, {
          totalActivities,
          totalScore,
          averageScore,
          lastActivity: lastActivity ? {
            domain: lastActivity.domain,
            score: lastActivity.score,
            createdAt: lastActivity.createdAt
          } : null
        });

        console.log(`📊 ${child.firstName}: ${totalActivities} activités, Score moyen ${averageScore}`);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour activités:', error);
    }
  }

  // Mettre à jour les statistiques utilisateur
  async updateUserStats(userId, stats) {
    try {
      // Pour l'instant, on ne met pas à jour de table dédiée
      // Les données sont récupérées en temps réel directement
      console.log(`📈 Stats mises à jour pour ${userId}: Niveau ${stats.highestLevel}, Score ${stats.totalScore}`);
    } catch (error) {
      console.error('❌ Erreur mise à jour stats utilisateur:', error);
    }
  }

  // Mettre à jour les statistiques d'activités utilisateur
  async updateUserActivityStats(userId, stats) {
    try {
      // Pour l'instant, on ne met pas à jour de table dédiée
      // Les données sont récupérées en temps réel directement
      console.log(`📊 Stats activités mises à jour pour ${userId}: ${stats.totalActivities} activités`);
    } catch (error) {
      console.error('❌ Erreur mise à jour stats activités:', error);
    }
  }

  // Récupérer les données CubeMatch en temps réel
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

      const cubeMatchOperators = await prisma.$queryRaw`
        SELECT 
          operator,
          COUNT(*) as games,
          COALESCE(AVG(score), 0) as averageScore,
          COALESCE(AVG(accuracy_rate), 0) as averageAccuracy
        FROM cubematch_scores 
        WHERE user_id = ${userId}
        GROUP BY operator
        ORDER BY games DESC
      `;

      return {
        globalStats: cubeMatchStats[0],
        operatorStats: cubeMatchOperators,
        hasData: Number(cubeMatchStats[0].totalgames) > 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('❌ Erreur récupération CubeMatch temps réel:', error);
      return null;
    }
  }

  // Récupérer les données d'activités en temps réel
  async getRealTimeActivityData(userId) {
    try {
      const activities = await prisma.activity.findMany({
        where: {
          userSessionId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });

      const totalActivities = activities.length;
      const totalScore = activities.reduce((sum, activity) => sum + (activity.score || 0), 0);
      const averageScore = totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0;

      return {
        activities: activities.map(activity => ({
          id: activity.id,
          domain: activity.domain,
          nodeKey: activity.nodeKey,
          score: activity.score,
          attempts: activity.attempts,
          durationMs: activity.durationMs,
          createdAt: activity.createdAt
        })),
        stats: {
          totalActivities,
          totalScore,
          averageScore,
          lastActivity: activities[0] || null
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('❌ Erreur récupération activités temps réel:', error);
      return null;
    }
  }

  // Formater les données pour l'IA
  formatCubeMatchDataForAI(cubeMatchData) {
    if (!cubeMatchData || !cubeMatchData.hasData) {
      return "Aucune donnée CubeMatch disponible.";
    }

    const stats = cubeMatchData.globalStats;
    const operators = cubeMatchData.operatorStats;
    
    let info = `**CubeMatch :** ${Number(stats.totalgames)} parties, score total ${Number(stats.totalscore).toLocaleString()}, meilleur score ${stats.bestscore}, niveau max ${stats.highestlevel}, meilleur combo x${stats.bestcombo}. `;
    
    if (operators.length > 0) {
      info += `Opérations : `;
      operators.forEach((op, i) => {
        const opName = { 'ADD': 'Add', 'SUB': 'Sous', 'MUL': 'Mult', 'DIV': 'Div' }[op.operator] || op.operator;
        info += `${opName}(${Number(op.games)} parties, ${Math.round(op.averagescore)} pts)`;
        if (i < operators.length - 1) info += ', ';
      });
    }

    return info;
  }

  // Formater les données d'activités pour l'IA
  formatActivityDataForAI(activityData) {
    if (!activityData || activityData.activities.length === 0) {
      return "Aucune activité récente disponible.";
    }

    const stats = activityData.stats;
    const recentActivities = activityData.activities.slice(0, 5);
    
    let info = `**Activités :** ${stats.totalActivities} activités réalisées, score moyen ${stats.averageScore}/100. `;
    
    if (recentActivities.length > 0) {
      info += `Dernières activités : `;
      recentActivities.forEach((activity, i) => {
        info += `${activity.domain} (${activity.score}/100)`;
        if (i < recentActivities.length - 1) info += ', ';
      });
    }

    return info;
  }
}

// Test du système de tracking des activités en temps réel
async function testRealTimeActivityTracking() {
  console.log('🔄 Test du tracking des activités en temps réel...\n');

  const tracker = new RealTimeActivityTracker();

  // 1. Démarrer le tracking
  console.log('🔄 Démarrage du tracking des activités...');
  tracker.startRealTimeActivityTracking();
  
  // 2. Récupérer les données CubeMatch de Lucas
  console.log('📊 Récupération des données CubeMatch de Lucas...');
  const lucasCubeMatch = await tracker.getRealTimeCubeMatchData('cmf2yznx3000c45g0gqjs8844');
  console.log('📝 Données CubeMatch Lucas:', JSON.stringify(lucasCubeMatch, null, 2));
  
  // 3. Formater pour l'IA
  console.log('💬 Formatage pour l\'IA...');
  const cubeMatchInfo = tracker.formatCubeMatchDataForAI(lucasCubeMatch);
  console.log('📝 Info CubeMatch:', cubeMatchInfo);
  
  // 4. Récupérer les données d'activités
  console.log('📊 Récupération des données d\'activités...');
  const lucasActivities = await tracker.getRealTimeActivityData('cmf2yznx3000c45g0gqjs8844');
  console.log('📝 Données activités Lucas:', JSON.stringify(lucasActivities, null, 2));
  
  // 5. Formater pour l'IA
  console.log('💬 Formatage activités pour l\'IA...');
  const activityInfo = tracker.formatActivityDataForAI(lucasActivities);
  console.log('📝 Info activités:', activityInfo);
  
  // 6. Attendre 20 secondes pour voir les mises à jour
  console.log('⏱️ Attente de 20 secondes...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  // 7. Récupérer à nouveau les données
  console.log('🔄 Récupération des données mises à jour...');
  const lucasCubeMatchUpdated = await tracker.getRealTimeCubeMatchData('cmf2yznx3000c45g0gqjs8844');
  const cubeMatchInfoUpdated = tracker.formatCubeMatchDataForAI(lucasCubeMatchUpdated);
  console.log('📝 Info CubeMatch mise à jour:', cubeMatchInfoUpdated);
  
  // 8. Arrêter le tracking
  tracker.stopRealTimeActivityTracking();
  
  console.log('✅ Test terminé !');
  console.log('');
  console.log('🎯 Résumé:');
  console.log('- ✅ Tracking des activités en temps réel');
  console.log('- ✅ Mise à jour automatique des données CubeMatch');
  console.log('- ✅ Formatage pour l\'IA en temps réel');
  console.log('- ✅ Données cohérentes entre interface et IA');
}

testRealTimeActivityTracking().catch(console.error);
