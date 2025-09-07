const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCubeMatchData() {
  try {
    console.log('🔍 Vérification des données CubeMatch pour Aylon-noah...\n');
    
    // Récupérer toutes les parties d'Aylon-noah
    const aylonScores = await prisma.cubeMatchScore.findMany({
      where: {
        user_id: 'cmf99iuci000a61kxurcxraao'
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log(`📊 Nombre total de parties : ${aylonScores.length}`);
    
    if (aylonScores.length > 0) {
      const scores = aylonScores.map(s => s.score);
      const bestScore = Math.max(...scores);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const highestLevel = Math.max(...aylonScores.map(s => s.level));
      
      console.log(`🏆 Meilleur score (record) : ${bestScore.toLocaleString()} points`);
      console.log(`📈 Score moyen : ${Math.round(averageScore).toLocaleString()} points`);
      console.log(`🎯 Niveau maximum : ${highestLevel}`);
      
      console.log('\n📋 Détail des parties :');
      aylonScores.forEach((score, index) => {
        console.log(`  ${index + 1}. Score: ${score.score.toLocaleString()} pts, Niveau: ${score.level}, Opérateur: ${score.operator} - ${new Date(score.created_at).toLocaleDateString('fr-FR')}`);
      });
      
      // Vérifier la cohérence
      console.log('\n✅ VÉRIFICATION DE COHÉRENCE :');
      console.log(`- Meilleur score = ${bestScore} (correct)`);
      console.log(`- Score moyen = ${Math.round(averageScore)} (calculé sur ${scores.length} parties)`);
      console.log(`- Niveau max = ${highestLevel} (correct)`);
      
      if (bestScore === 2370) {
        console.log('\n🎉 CONFIRMATION : Le score de 2,370 points est bien le MEILLEUR SCORE (record personnel)');
        if (scores.length === 1) {
          console.log('⚠️  ATTENTION : Une seule partie jouée, donc score moyen = meilleur score');
        }
      }
    } else {
      console.log('❌ Aucune partie trouvée pour Aylon-noah');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCubeMatchData();
