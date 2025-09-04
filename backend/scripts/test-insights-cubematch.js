// Test direct des insights avec données CubeMatch
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInsightsWithCubeMatch() {
  console.log('🧪 Test des insights avec données CubeMatch...');
  
  try {
    // Récupérer un parent
    const parent = await prisma.userSession.findFirst({
      where: { userType: 'PARENT', isActive: true },
      include: { account: true }
    });
    
    if (!parent) {
      console.log('❌ Aucun parent trouvé');
      return;
    }
    
    console.log(`👨‍👩‍👧‍👦 Parent: ${parent.firstName} ${parent.lastName}`);
    
    // Récupérer les enfants
    const children = await prisma.userSession.findMany({
      where: { accountId: parent.accountId, userType: 'CHILD', isActive: true },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 100 },
        profile: true
      }
    });
    
    console.log(`👶 Enfants trouvés: ${children.length}`);
    
    // Enrichir avec les données CubeMatch
    const enrichedChildren = await Promise.all(children.map(async (child) => {
      try {
        // Récupérer les données CubeMatch directement avec Prisma
        const cubeMatchStats = await prisma.$queryRaw`
          SELECT 
            COUNT(*) as totalGames,
            COALESCE(SUM(score), 0) as totalScore,
            COALESCE(AVG(score), 0) as averageScore,
            COALESCE(MAX(score), 0) as bestScore,
            COALESCE(MAX(level), 1) as highestLevel
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
        
        const cubeMatchData = {
          globalStats: cubeMatchStats[0],
          operatorStats: cubeMatchOperators,
          hasData: Number(cubeMatchStats[0].totalgames) > 0
        };
        
                 console.log(`\n📊 Données CubeMatch pour ${child.firstName}:`);
         console.log(`   - Parties: ${Number(cubeMatchData.globalStats.totalgames)}`);
         console.log(`   - Score total: ${Number(cubeMatchData.globalStats.totalscore)}`);
         console.log(`   - Meilleur score: ${cubeMatchData.globalStats.bestscore}`);
         console.log(`   - Niveau max: ${cubeMatchData.globalStats.highestlevel}`);
         
         if (cubeMatchData.operatorStats.length > 0) {
           console.log(`   - Opérations:`);
           cubeMatchData.operatorStats.forEach((op) => {
             console.log(`     * ${op.operator}: ${Number(op.games)} parties, ${Math.round(op.averagescore)} pts, ${op.averageaccuracy.toFixed(1)}% précision`);
           });
         }
        
        return {
          ...child,
          cubeMatchData: cubeMatchData
        };
      } catch (error) {
        console.error(`❌ Erreur pour ${child.firstName}:`, error);
        return child;
      }
    }));
    
    // Générer les insights
    let insights = "📊 **ANALYSE DES DONNÉES ENFANTS**\n\n";
    
    enrichedChildren.forEach((child) => {
      insights += `**${child.firstName} ${child.lastName}** (${child.age || 'N/A'} ans)\n`;
      
      // Statistiques générales
      const totalActivities = child.activities.length;
      const avgScore = child.activities.length > 0 
        ? Math.round(child.activities.reduce((sum, a) => sum + (a.score || 0), 0) / child.activities.length)
        : 0;
      
      insights += `• ${totalActivities} activités réalisées\n`;
      insights += `• Score moyen: ${avgScore}/100\n`;
      
      // Données CubeMatch si disponibles
            if (child.cubeMatchData && child.cubeMatchData.hasData) {
        const cm = child.cubeMatchData.globalStats;
        insights += `• **CubeMatch** : ${Number(cm.totalgames)} parties, score total ${Number(cm.totalscore).toLocaleString()}, niveau max ${cm.highestlevel}\n`;
        
        // Statistiques par opération
        if (child.cubeMatchData.operatorStats && child.cubeMatchData.operatorStats.length > 0) {
          insights += `• **Opérations** : `;
          child.cubeMatchData.operatorStats.forEach((op, i) => {
            const opName = { 'ADD': 'Add', 'SUB': 'Sous', 'MUL': 'Mult', 'DIV': 'Div' }[op.operator] || op.operator;
            insights += `${opName}(${Number(op.games)} parties, ${op.averageaccuracy.toFixed(1)}% précision)`;
            if (i < child.cubeMatchData.operatorStats.length - 1) insights += ', ';
          });
          insights += '\n';
        }
      }
      
      insights += '\n';
    });
    
    console.log('\n📝 Insights générés:');
    console.log(insights);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testInsightsWithCubeMatch();
