// Test de vérification des données CubeMatch
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCubeMatchData() {
  console.log('🔍 Vérification des données CubeMatch...');
  
  try {
    // 1. Vérifier les enfants existants
    const children = await prisma.userSession.findMany({
      where: { userType: 'CHILD', isActive: true },
      select: { id: true, firstName: true, lastName: true }
    });
    
    console.log(`👶 Enfants trouvés: ${children.length}`);
    children.forEach(child => {
      console.log(`   - ${child.firstName} ${child.lastName} (${child.id})`);
    });
    
    // 2. Vérifier les scores CubeMatch
    const scores = await prisma.$queryRaw`
      SELECT 
        user_id,
        COUNT(*) as total_games,
        COALESCE(SUM(score), 0) as total_score,
        COALESCE(AVG(score), 0) as avg_score,
        COALESCE(MAX(score), 0) as best_score
      FROM cubematch_scores 
      GROUP BY user_id
    `;
    
    console.log(`\n🎮 Scores CubeMatch trouvés: ${scores.length} utilisateurs`);
    scores.forEach((score) => {
      console.log(`   - User ${score.user_id}: ${score.total_games} parties, score total ${score.total_score}, meilleur ${score.best_score}`);
    });
    
    // 3. Vérifier les statistiques par opération
    const operatorStats = await prisma.$queryRaw`
      SELECT 
        user_id,
        operator,
        COUNT(*) as games,
        COALESCE(AVG(score), 0) as avg_score,
        COALESCE(AVG(accuracy_rate), 0) as avg_accuracy
      FROM cubematch_scores 
      GROUP BY user_id, operator
      ORDER BY user_id, games DESC
    `;
    
    console.log(`\n🔢 Statistiques par opération: ${operatorStats.length} entrées`);
    operatorStats.forEach((stat) => {
      console.log(`   - User ${stat.user_id} ${stat.operator}: ${stat.games} parties, score moyen ${Math.round(stat.avg_score)}, précision ${stat.avg_accuracy.toFixed(1)}%`);
    });
    
    // 4. Vérifier les insights
    const insights = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM cubematch_insights
    `;
    
    console.log(`\n💡 Insights IA: ${insights[0].count} entrées`);
    
    // 5. Vérifier les sessions
    const sessions = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM cubematch_sessions
    `;
    
    console.log(`📊 Sessions de jeu: ${sessions[0].count} entrées`);
    
    // 6. Test avec un enfant spécifique
    if (children.length > 0) {
      const testChild = children[0];
      console.log(`\n🧪 Test avec ${testChild.firstName} ${testChild.lastName}...`);
      
      const childScores = await prisma.$queryRaw`
        SELECT 
          operator,
          COUNT(*) as games,
          COALESCE(AVG(score), 0) as avg_score,
          COALESCE(AVG(accuracy_rate), 0) as avg_accuracy,
          COALESCE(MAX(level), 1) as max_level
        FROM cubematch_scores 
        WHERE user_id = ${testChild.id}
        GROUP BY operator
        ORDER BY games DESC
      `;
      
      console.log(`   Parties de ${testChild.firstName}:`);
      childScores.forEach((score) => {
        console.log(`     - ${score.operator}: ${score.games} parties, score moyen ${Math.round(score.avg_score)}, niveau max ${score.max_level}`);
      });
    }
    
    console.log('\n✅ Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la vérification
checkCubeMatchData();
