import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test simple pour vérifier les données CubeMatch en temps réel
async function testCubeMatchRealTime() {
  console.log('🔄 Test des données CubeMatch en temps réel...\n');

  // 1. Récupérer les données CubeMatch de Lucas
  console.log('📊 Récupération des données CubeMatch de Lucas...');
  
  try {
    const lucasCubeMatch = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalGames,
        COALESCE(SUM(score), 0) as totalScore,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(MAX(score), 0) as bestScore,
        COALESCE(MAX(level), 1) as highestLevel,
        COALESCE(MAX(longest_combo_chain), 0) as bestCombo
      FROM cubematch_scores 
      WHERE user_id = 'cmf2yznx3000c45g0gqjs8844'
    `;

    console.log('📝 Données CubeMatch Lucas:', {
      totalGames: Number(lucasCubeMatch[0].totalgames),
      totalScore: Number(lucasCubeMatch[0].totalscore),
      averageScore: Number(lucasCubeMatch[0].averagescore),
      bestScore: Number(lucasCubeMatch[0].bestscore),
      highestLevel: Number(lucasCubeMatch[0].highestlevel),
      bestCombo: Number(lucasCubeMatch[0].bestcombo)
    });
    
    // 2. Formater pour l'IA
    const stats = lucasCubeMatch[0];
    const totalGames = Number(stats.totalgames);
    const totalScore = Number(stats.totalscore);
    const highestLevel = Number(stats.highestlevel);
    const bestCombo = Number(stats.bestcombo);
    
    let cubeMatchInfo = `**CubeMatch :** ${totalGames} parties, score total ${totalScore.toLocaleString()}, meilleur score ${stats.bestscore}, niveau max ${highestLevel}, meilleur combo x${bestCombo}.`;
    
    console.log('💬 Info CubeMatch formatée:', cubeMatchInfo);
    
    // 3. Récupérer les données par opération
    console.log('\n📊 Récupération des données par opération...');
    
    const cubeMatchOperators = await prisma.$queryRaw`
      SELECT 
        operator,
        COUNT(*) as games,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(AVG(accuracy_rate), 0) as averageAccuracy
      FROM cubematch_scores 
      WHERE user_id = 'cmf2yznx3000c45g0gqjs8844'
      GROUP BY operator
      ORDER BY games DESC
    `;

    console.log('📝 Données par opération:', cubeMatchOperators.map(op => ({
      operator: op.operator,
      games: Number(op.games),
      averageScore: Number(op.averagescore),
      averageAccuracy: Number(op.averageaccuracy)
    })));
    
    // 4. Formater les opérations
    if (cubeMatchOperators.length > 0) {
      cubeMatchInfo += ` Opérations : `;
      cubeMatchOperators.forEach((op, i) => {
        const opName = { 'ADD': 'Add', 'SUB': 'Sous', 'MUL': 'Mult', 'DIV': 'Div' }[op.operator] || op.operator;
        cubeMatchInfo += `${opName}(${Number(op.games)} parties, ${Math.round(op.averagescore)} pts)`;
        if (i < cubeMatchOperators.length - 1) cubeMatchInfo += ', ';
      });
    }
    
    console.log('💬 Info complète CubeMatch:', cubeMatchInfo);
    
    // 5. Comparer avec ce que dit l'IA
    console.log('\n🎯 Comparaison avec l\'IA:');
    console.log('- Interface montre: Niveau 27');
    console.log(`- Base de données: Niveau ${highestLevel}`);
    console.log(`- Différence: ${Math.abs(27 - highestLevel)} niveaux`);
    
    if (highestLevel !== 27) {
      console.log('⚠️ INCOHÉRENCE DÉTECTÉE !');
      console.log('L\'IA ne récupère pas les données les plus récentes.');
    } else {
      console.log('✅ Données cohérentes !');
    }
    
  } catch (error) {
    console.error('❌ Erreur récupération CubeMatch:', error);
  }

  // 6. Vérifier les données d'activités
  console.log('\n📊 Récupération des données d\'activités...');
  
  try {
    const lucasActivities = await prisma.activity.findMany({
      where: {
        userSessionId: 'cmf2yznx3000c45g0gqjs8844'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('📝 Activités Lucas:', lucasActivities.length, 'activités trouvées');
    
    const totalActivities = lucasActivities.length;
    const totalScore = lucasActivities.reduce((sum, activity) => sum + (activity.score || 0), 0);
    const averageScore = totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0;
    
    console.log(`📊 Stats activités: ${totalActivities} activités, score moyen ${averageScore}/100`);
    
    if (lucasActivities.length > 0) {
      console.log('📝 Dernières activités:');
      lucasActivities.slice(0, 5).forEach((activity, i) => {
        console.log(`   ${i + 1}. ${activity.domain} (${activity.score}/100) - ${activity.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur récupération activités:', error);
  }

  console.log('\n✅ Test terminé !');
  console.log('\n🎯 Résumé:');
  console.log('- ✅ Récupération des données CubeMatch en temps réel');
  console.log('- ✅ Formatage pour l\'IA');
  console.log('- ✅ Vérification de la cohérence des données');
  console.log('- ✅ Détection des incohérences entre interface et IA');
}

testCubeMatchRealTime().catch(console.error);
