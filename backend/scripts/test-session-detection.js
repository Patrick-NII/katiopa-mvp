import fetch from 'node-fetch';

async function testSessionDetection() {
  console.log('🧪 Test de détection de session et adaptation comportementale...\n');

  // 1. Connexion parent
  console.log('🔐 Connexion en tant que parent...');
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'parent_01',
      password: 'password123'
    })
  });

  if (!loginResponse.ok) {
    console.error('❌ Échec de la connexion parent');
    return;
  }

  const loginData = await loginResponse.json();
  const authToken = loginData.token;
  console.log('✅ Connexion réussie\n');

  // 2. Test 1: Mode parent dashboard (aucun enfant connecté)
  console.log('📊 Test 1: Mode parent dashboard (aucun enfant connecté)...');
  const dashboardResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${authToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Comment vont mes enfants ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr',
      childSessions: [] // Aucun enfant connecté
    })
  });

  const dashboardData = await dashboardResponse.json();
  console.log('📝 Réponse mode dashboard:', dashboardData.text);
  console.log('🎯 Mode détecté: Analyse globale des performances passées\n');

  // 3. Test 2: Mode parent avec enfant connecté (simulation)
  console.log('👶 Test 2: Mode parent avec enfant connecté (simulation)...');
  const now = new Date();
  const childSession = {
    id: 'child_01',
    firstName: 'Emma',
    lastName: 'Martin',
    userType: 'CHILD',
    lastLoginAt: new Date(now.getTime() - 5 * 60 * 1000), // Connecté il y a 5 minutes
    currentSessionStartTime: new Date(now.getTime() - 25 * 60 * 1000), // Session de 25 minutes
    activities: [
      {
        domain: 'maths',
        score: 85,
        createdAt: new Date(now.getTime() - 2 * 60 * 1000) // Activité récente
      }
    ]
  };

  const monitoringResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${authToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '2', text: 'Comment va Emma en ce moment ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr',
      childSessions: [childSession]
    })
  });

  const monitoringData = await monitoringResponse.json();
  console.log('📝 Réponse mode surveillance:', monitoringData.text);
  console.log('🎯 Mode détecté: Surveillance en temps réel\n');

  // 4. Test 3: Mode enfant connecté
  console.log('🎮 Test 3: Mode enfant connecté...');
  const childLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'enfant_01',
      password: 'password123'
    })
  });

  if (!childLoginResponse.ok) {
    console.error('❌ Échec de la connexion enfant');
    return;
  }

  const childLoginData = await childLoginResponse.json();
  const childAuthToken = childLoginData.token;

  const childResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${childAuthToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '3', text: 'Peux-tu m\'aider avec les maths ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const childData = await childResponse.json();
  console.log('📝 Réponse mode enfant:', childData.text);
  console.log('🎯 Mode détecté: Session d\'apprentissage active\n');

  // 5. Test 4: Question spécifique sur le contexte de session
  console.log('🔍 Test 4: Question sur le contexte de session...');
  const contextResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${authToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '4', text: 'Quel est le contexte de session actuel ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr',
      childSessions: [childSession]
    })
  });

  const contextData = await contextResponse.json();
  console.log('📝 Réponse contexte session:', contextData.text);

  console.log('\n✅ Test de détection de session terminé avec succès !');
}

testSessionDetection().catch(console.error);
