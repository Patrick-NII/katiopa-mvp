import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCubeMatchConnection() {
  try {
    console.log('🔍 Test de connexion CubeMatch...');
    
    // 1. Vérifier les utilisateurs existants
    const users = await prisma.userSession.findMany({
      take: 3,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userType: true
      }
    });
    
    console.log('👥 Utilisateurs trouvés:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.userType}) - ID: ${user.id}`);
    });
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }
    
    // 2. Ajouter des données de test CubeMatch
    const testScores = [
      {
        user_id: users[0].id,
        username: `${users[0].firstName} ${users[0].lastName}`,
        score: 1500,
        level: 8,
        time_played_ms: BigInt(45000),
        operator: 'ADD',
        target: 10,
        allow_diagonals: false
      },
      {
        user_id: users[1]?.id || users[0].id,
        username: `${users[1]?.firstName || users[0].firstName} ${users[1]?.lastName || users[0].lastName}`,
        score: 1200,
        level: 6,
        time_played_ms: BigInt(38000),
        operator: 'MUL',
        target: 12,
        allow_diagonals: true
      },
      {
        user_id: users[2]?.id || users[0].id,
        username: `${users[2]?.firstName || users[0].firstName} ${users[2]?.lastName || users[0].lastName}`,
        score: 900,
        level: 5,
        time_played_ms: BigInt(32000),
        operator: 'SUB',
        target: 8,
        allow_diagonals: false
      }
    ];
    
    console.log('🎮 Ajout des scores de test...');
    for (const score of testScores) {
      try {
        const newScore = await prisma.cubeMatchScore.create({
          data: score
        });
        console.log(`  ✅ Score ajouté: ${score.username} - ${score.score} points`);
      } catch (error) {
        console.log(`  ❌ Erreur ajout score: ${error.message}`);
      }
    }
    
    // 3. Vérifier les scores ajoutés
    const scores = await prisma.cubeMatchScore.findMany({
      orderBy: {
        score: 'desc'
      },
      take: 10
    });
    
    console.log('🏆 Scores CubeMatch trouvés:', scores.length);
    scores.forEach((score, index) => {
      console.log(`  ${index + 1}. ${score.username} - ${score.score} points (Niveau ${score.level})`);
    });
    
    // 4. Tester les statistiques globales
    const globalStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalGames,
        COALESCE(SUM(score), 0) as totalScore,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(MAX(score), 0) as bestScore,
        COALESCE(MAX(level), 1) as highestLevel
      FROM cubematch_scores
    `;
    
    console.log('📊 Statistiques globales:', globalStats[0]);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCubeMatchConnection();
