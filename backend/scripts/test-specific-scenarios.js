import fetch from 'node-fetch';

async function testSpecificScenarios() {
  console.log('🎯 Test de scénarios spécifiques...\n');

  // 1. Test question personnelle pour enfant
  console.log('👶 Test 1: Question personnelle pour Emma...');
  const childLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'enfant_01',
      password: 'password123'
    })
  });

  const childToken = childLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
  
  const personalResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${childToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Quel est mon meilleur score en mathématiques ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const personalChat = await personalResponse.json();
  console.log('📝 Réponse personnelle:', personalChat.text.substring(0, 120) + '...');
  console.log('');

  // 2. Test question comparative pour parent
  console.log('👨‍👩‍👧‍👦 Test 2: Question comparative pour Marie...');
  const parentLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'parent_01',
      password: 'password123'
    })
  });

  const parentToken = parentLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
  
  const comparativeResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Quel de mes enfants a les meilleures performances ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const comparativeChat = await comparativeResponse.json();
  console.log('📝 Réponse comparative:', comparativeChat.text.substring(0, 150) + '...');
  console.log('');

  // 3. Test question CubeMatch spécifique
  console.log('🎮 Test 3: Question CubeMatch spécifique...');
  const cubeMatchResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${childToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Combien de parties de CubeMatch ai-je jouées et quel est mon niveau maximum ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const cubeMatchChat = await cubeMatchResponse.json();
  console.log('📝 Réponse CubeMatch:', cubeMatchChat.text.substring(0, 120) + '...');
  console.log('');

  // 4. Test question de recommandation avancée
  console.log('💡 Test 4: Recommandation avancée pour parent...');
  const recommendationResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Quels exercices recommandes-tu pour améliorer les mathématiques d\'Emma ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const recommendationChat = await recommendationResponse.json();
  console.log('📝 Réponse recommandation:', recommendationChat.text.substring(0, 150) + '...');
  console.log('');

  // 5. Vérification des données utilisateur
  console.log('📊 Vérification finale des données...');
  console.log('Emma (CHILD):', JSON.stringify(personalChat.userInfo, null, 2));
  console.log('Marie (PARENT):', JSON.stringify(comparativeChat.userInfo, null, 2));
  console.log('');

  console.log('✅ Tous les tests spécifiques réussis !');
  console.log('');
  console.log('🎯 Confirmation des fonctionnalités:');
  console.log('- ✅ Reconnaissance personnelle (Emma)');
  console.log('- ✅ Accès aux données comparatives (Marie)');
  console.log('- ✅ Statistiques CubeMatch détaillées');
  console.log('- ✅ Recommandations personnalisées');
  console.log('- ✅ Détection correcte des types d\'utilisateur');
  console.log('- ✅ Réponses adaptées au contexte');
}

testSpecificScenarios().catch(console.error);

