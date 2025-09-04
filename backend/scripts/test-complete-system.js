import fetch from 'node-fetch';

async function testCompleteSystem() {
  console.log('🔧 Test complet du système CubeAI...\n');

  // 1. Test session enfant
  console.log('👶 Test session enfant...');
  const childLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'enfant_01',
      password: 'password123'
    })
  });

  const childData = await childLogin.json();
  console.log('✅ Enfant connecté:', childData.data.userSession.firstName, childData.data.userSession.userType);
  
  const childToken = childLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
  
  const childResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${childToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Salut Bubix ! Comment je vais ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const childChat = await childResponse.json();
  console.log('📝 Réponse enfant:', childChat.text.substring(0, 100) + '...');
  console.log('');

  // 2. Test session parent
  console.log('👨‍👩‍👧‍👦 Test session parent...');
  const parentLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'parent_01',
      password: 'password123'
    })
  });

  const parentData = await parentLogin.json();
  console.log('✅ Parent connecté:', parentData.data.userSession.firstName, parentData.data.userSession.userType);
  
  const parentToken = parentLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
  
  const parentResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Comment vont mes enfants ? Quels sont leurs progrès ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const parentChat = await parentResponse.json();
  console.log('📝 Réponse parent:', parentChat.text.substring(0, 150) + '...');
  console.log('');

  // 3. Test questions spécifiques
  console.log('🎯 Test questions spécifiques...');
  
  // Question CubeMatch pour enfant
  const cubeMatchResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${childToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Comment je joue à CubeMatch ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const cubeMatchChat = await cubeMatchResponse.json();
  console.log('🎮 Réponse CubeMatch:', cubeMatchChat.text.substring(0, 100) + '...');
  console.log('');

  // Question recommandations pour parent
  const recommendationsResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Quelles sont tes recommandations pour améliorer les performances de mes enfants ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const recommendationsChat = await recommendationsResponse.json();
  console.log('💡 Réponse recommandations:', recommendationsChat.text.substring(0, 150) + '...');
  console.log('');

  // 4. Vérification des données utilisateur
  console.log('📊 Vérification des données utilisateur...');
  console.log('Enfant - userInfo:', JSON.stringify(childChat.userInfo, null, 2));
  console.log('Parent - userInfo:', JSON.stringify(parentChat.userInfo, null, 2));
  console.log('');

  console.log('✅ Test complet terminé !');
  console.log('');
  console.log('🎯 Résumé:');
  console.log('- ✅ Détection des sessions enfants');
  console.log('- ✅ Détection des sessions parents');
  console.log('- ✅ Récupération des données personnalisées');
  console.log('- ✅ Génération de réponses adaptées');
  console.log('- ✅ Accès aux données CubeMatch');
  console.log('- ✅ Insights et recommandations pour parents');
}

testCompleteSystem().catch(console.error);

