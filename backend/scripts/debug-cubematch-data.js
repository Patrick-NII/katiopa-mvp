// Test de debug des données CubeMatch
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCubeMatchData() {
  console.log('🔍 Debug des données CubeMatch...');
  
  try {
    // Récupérer un enfant
    const child = await prisma.userSession.findFirst({
      where: { userType: 'CHILD', isActive: true },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (!child) {
      console.log('❌ Aucun enfant trouvé');
      return;
    }
    
    console.log(`👶 Test avec ${child.firstName} ${child.lastName} (${child.id})`);
    
    // Test 1: Vérifier les scores CubeMatch
    const scores = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalGames,
        COALESCE(SUM(score), 0) as totalScore,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(MAX(score), 0) as bestScore,
        COALESCE(MAX(level), 1) as highestLevel
      FROM cubematch_scores 
      WHERE user_id = ${child.id}
    `;
    
    console.log('📊 Scores bruts:', scores);
    console.log('📊 Premier score:', scores[0]);
    console.log('📊 TotalGames:', Number(scores[0]?.totalGames));
    console.log('📊 TotalScore:', Number(scores[0]?.totalScore));
    
    // Test 2: Vérifier les opérateurs
    const operators = await prisma.$queryRaw`
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
    
    console.log('🔢 Opérateurs bruts:', operators);
    
    // Test 3: Vérifier la table cubematch_scores
    const allScores = await prisma.$queryRaw`
      SELECT user_id, score, level, operator, accuracy_rate
      FROM cubematch_scores 
      WHERE user_id = ${child.id}
      LIMIT 5
    `;
    
    console.log('🎮 Tous les scores:', allScores);
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le debug
debugCubeMatchData();
