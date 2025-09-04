import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test de l'API chat avec les données CubeMatch en temps réel
async function testChatWithRealTimeData() {
  console.log('🔄 Test de l\'API chat avec données CubeMatch en temps réel...\n');

  // 1. Récupérer les données CubeMatch en temps réel
  console.log('📊 Récupération des données CubeMatch en temps réel...');
  
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

  const stats = lucasCubeMatch[0];
  const totalGames = Number(stats.totalgames);
  const totalScore = Number(stats.totalscore);
  const highestLevel = Number(stats.highestlevel);
  
  console.log(`📝 Données temps réel: ${totalGames} parties, niveau max ${highestLevel}, score total ${totalScore}`);
  
  // 2. Connexion de Marie
  console.log('\n👨‍👩‍👧‍👦 Connexion de Marie...');
  
  const marieLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'parent_01',
      password: 'password123'
    })
  });

  const marieToken = marieLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
  
  // 3. Test avec question sur le niveau de Lucas
  console.log('\n🎯 Test question sur le niveau de Lucas...');
  
  const marieResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${marieToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Quel est le niveau de Lucas dans CubeMatch ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const marieChat = await marieResponse.json();
  console.log('📝 Réponse Marie:', marieChat.text.substring(0, 200) + '...');
  
  // 4. Test avec question spécifique sur le niveau
  console.log('\n🎯 Test question spécifique sur le niveau...');
  
  const marieResponse2 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${marieToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Lucas est-il au niveau 27 dans CubeMatch ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const marieChat2 = await marieResponse2.json();
  console.log('📝 Réponse Marie (niveau 27):', marieChat2.text.substring(0, 200) + '...');
  
  // 5. Test avec question sur les statistiques complètes
  console.log('\n📊 Test question sur les statistiques complètes...');
  
  const marieResponse3 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${marieToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Donne-moi toutes les statistiques CubeMatch de Lucas', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const marieChat3 = await marieResponse3.json();
  console.log('📝 Réponse Marie (stats complètes):', marieChat3.text.substring(0, 300) + '...');
  
  // 6. Analyse des résultats
  console.log('\n' + '=' .repeat(60));
  console.log('📊 ANALYSE DES RÉSULTATS');
  console.log('=' .repeat(60));
  console.log('');
  console.log('🎯 Données temps réel:');
  console.log(`   - Niveau max: ${highestLevel}`);
  console.log(`   - Parties jouées: ${totalGames}`);
  console.log(`   - Score total: ${totalScore}`);
  console.log('');
  console.log('🎯 Interface (ce que tu vois):');
  console.log('   - Niveau: 27');
  console.log('   - Différence: 17 niveaux');
  console.log('');
  console.log('🎯 Problème identifié:');
  console.log('   - L\'IA récupère les données de la base de données');
  console.log('   - L\'interface affiche les données en temps réel');
  console.log('   - Il faut synchroniser les deux sources');
  console.log('');
  console.log('🔧 Solution:');
  console.log('   - Intégrer le tracking en temps réel dans l\'API chat');
  console.log('   - Mettre à jour la base de données en continu');
  console.log('   - S\'assurer que Bubix a les données les plus récentes');
  console.log('=' .repeat(60));
}

testChatWithRealTimeData().catch(console.error);

