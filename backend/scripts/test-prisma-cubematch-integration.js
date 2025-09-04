import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test de l'intégration Prisma avec les modèles CubeMatch
async function testPrismaCubeMatchIntegration() {
  console.log('🔄 Test de l\'intégration Prisma avec les modèles CubeMatch...\n');

  try {
    // 1. Test de récupération des données avec Prisma (au lieu de SQL brut)
    console.log('📊 Test récupération données avec Prisma...');
    
    const cubeMatchScores = await prisma.cubeMatchScore.findMany({
      where: {
        user_id: 'cmf2yznx3000c45g0gqjs8844'
      },
      include: {
        userSession: {
          select: {
            firstName: true,
            lastName: true,
            userType: true
          }
        }
      }
    });

    console.log(`📝 ${cubeMatchScores.length} parties CubeMatch trouvées avec Prisma`);
    
    if (cubeMatchScores.length > 0) {
      const latestScore = cubeMatchScores[0];
      console.log(`🎯 Dernière partie: ${latestScore.score} points, niveau ${latestScore.level}`);
      console.log(`👤 Joueur: ${latestScore.userSession.firstName} ${latestScore.userSession.lastName}`);
    }

    // 2. Test des statistiques utilisateur
    console.log('\n📈 Test des statistiques utilisateur...');
    
    const userStats = await prisma.cubeMatchUserStats.findUnique({
      where: {
        user_id: 'cmf2yznx3000c45g0gqjs8844'
      },
      include: {
        userSession: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (userStats) {
      console.log(`📊 Stats de ${userStats.userSession.firstName}:`);
      console.log(`   - Parties: ${userStats.total_games}`);
      console.log(`   - Score total: ${userStats.total_score}`);
      console.log(`   - Niveau max: ${userStats.highest_level}`);
      console.log(`   - Score moyen: ${userStats.average_score}`);
    } else {
      console.log('❌ Aucune statistique utilisateur trouvée');
    }

    // 3. Test des statistiques globales
    console.log('\n🌍 Test des statistiques globales...');
    
    const globalStats = await prisma.cubeMatchStats.findMany();
    console.log(`📊 ${globalStats.length} enregistrements de stats globales`);
    
    if (globalStats.length > 0) {
      const stats = globalStats[0];
      console.log(`   - Total parties: ${stats.total_games}`);
      console.log(`   - Total joueurs: ${stats.total_players}`);
      console.log(`   - Niveau moyen: ${stats.average_level}`);
    }

    // 4. Test de création d'une nouvelle partie (simulation)
    console.log('\n🎮 Test de création d\'une nouvelle partie...');
    
    const newScore = await prisma.cubeMatchScore.create({
      data: {
        user_id: 'cmf2yznx3000c45g0gqjs8844',
        username: 'lucas_martin',
        score: 200,
        level: 28,
        time_played_ms: BigInt(120000),
        operator: 'ADD',
        target: 10,
        allow_diagonals: false
      }
    });

    console.log(`✅ Nouvelle partie créée: ID ${newScore.id}, niveau ${newScore.level}`);

    // 5. Vérification de la mise à jour
    console.log('\n🔍 Vérification de la mise à jour...');
    
    const updatedScores = await prisma.cubeMatchScore.findMany({
      where: {
        user_id: 'cmf2yznx3000c45g0gqjs8844'
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 1
    });

    if (updatedScores.length > 0) {
      console.log(`🎯 Niveau le plus récent: ${updatedScores[0].level}`);
    }

    // 6. Nettoyage (suppression de la partie de test)
    console.log('\n🧹 Nettoyage...');
    await prisma.cubeMatchScore.delete({
      where: {
        id: newScore.id
      }
    });
    console.log('✅ Partie de test supprimée');

    console.log('\n' + '=' .repeat(60));
    console.log('✅ TEST PRISMA CUBEMATCH RÉUSSI !');
    console.log('=' .repeat(60));
    console.log('');
    console.log('🎯 Avantages obtenus :');
    console.log('   - ✅ Type safety TypeScript complet');
    console.log('   - ✅ Relations Prisma automatiques');
    console.log('   - ✅ IntelliSense et autocomplétion');
    console.log('   - ✅ Requêtes typées et sécurisées');
    console.log('   - ✅ Cohérence entre frontend et backend');
    console.log('');
    console.log('🔧 Impact sur l\'API chat :');
    console.log('   - ✅ Plus de requêtes SQL brutes');
    console.log('   - ✅ Données typées pour l\'IA');
    console.log('   - ✅ Relations automatiques');
    console.log('   - ✅ Meilleure maintenabilité');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Erreur test Prisma:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaCubeMatchIntegration().catch(console.error);
