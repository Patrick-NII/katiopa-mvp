import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test rapide pour vérifier que les modèles CubeMatch sont disponibles
async function quickTest() {
  console.log('🔄 Test rapide des modèles CubeMatch dans Prisma...\n');

  try {
    // 1. Vérifier que les modèles sont disponibles
    console.log('📊 Vérification des modèles disponibles...');
    
    // Test CubeMatchScore
    const scores = await prisma.cubeMatchScore.findMany({
      take: 1
    });
    console.log(`✅ CubeMatchScore: ${scores.length} enregistrement(s) trouvé(s)`);
    
    // Test CubeMatchStats
    const stats = await prisma.cubeMatchStats.findMany({
      take: 1
    });
    console.log(`✅ CubeMatchStats: ${stats.length} enregistrement(s) trouvé(s)`);
    
    // Test CubeMatchUserStats
    const userStats = await prisma.cubeMatchUserStats.findMany({
      take: 1
    });
    console.log(`✅ CubeMatchUserStats: ${userStats.length} enregistrement(s) trouvé(s)`);

    // 2. Test des relations
    console.log('\n🔗 Test des relations...');
    
    const scoreWithUser = await prisma.cubeMatchScore.findFirst({
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
    
    if (scoreWithUser) {
      console.log(`✅ Relation UserSession: ${scoreWithUser.userSession.firstName} ${scoreWithUser.userSession.lastName}`);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ TOUTES LES TABLES CUBEMATCH SONT VISIBLES !');
    console.log('=' .repeat(50));
    console.log('');
    console.log('🎯 Tu peux maintenant :');
    console.log('   - Voir les tables dans Prisma Studio');
    console.log('   - Utiliser les modèles dans ton code');
    console.log('   - Bénéficier du type safety TypeScript');
    console.log('   - Utiliser les relations automatiques');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest().catch(console.error);
