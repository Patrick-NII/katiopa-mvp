import fetch from 'node-fetch';

async function testChildIdentification() {
  console.log('🧪 Test d\'identification de l\'enfant connecté...\n');

  // Connexion enfant
  console.log('🔐 Connexion en tant qu\'enfant...');
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'enfant_01',
      password: 'password123'
    })
  });

  if (!loginResponse.ok) {
    console.error('❌ Échec de la connexion enfant');
    return;
  }

  const loginData = await loginResponse.json();
  const authToken = loginData.token;
  console.log('✅ Connexion réussie\n');

  // Test 1: Question personnelle
  console.log('👤 Test 1: Question personnelle...');
  const personalResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${authToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Comment je m\'appelle ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const personalData = await personalResponse.json();
  console.log('📝 Réponse personnelle:', personalData.text);
  console.log('');

  // Test 2: Question sur les performances
  console.log('📊 Test 2: Question sur les performances...');
  const performanceResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${authToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '2', text: 'Comment je vais en maths ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const performanceData = await performanceResponse.json();
  console.log('📝 Réponse performances:', performanceData.text);
  console.log('');

  // Test 3: Question sur CubeMatch
  console.log('🎮 Test 3: Question sur CubeMatch...');
  const cubematchResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${authToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '3', text: 'Comment je vais dans CubeMatch ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const cubematchData = await cubematchResponse.json();
  console.log('📝 Réponse CubeMatch:', cubematchData.text);
  console.log('');

  // Test 4: Question sur les améliorations
  console.log('🎯 Test 4: Question sur les améliorations...');
  const improvementResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${authToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '4', text: 'Où dois-je m\'améliorer ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const improvementData = await improvementResponse.json();
  console.log('📝 Réponse améliorations:', improvementData.text);

  console.log('\n✅ Test d\'identification terminé !');
}

testChildIdentification().catch(console.error);

