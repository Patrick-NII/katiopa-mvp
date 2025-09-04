import fetch from 'node-fetch';

async function testFrontendAuth() {
  console.log('🧪 Test de l\'authentification frontend...\n');

  // 1. Connexion via l'API backend (comme le frontend)
  console.log('🔐 Connexion via API backend...');
  const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'enfant_01',
      password: 'password123'
    })
  });

  if (!loginResponse.ok) {
    console.error('❌ Échec de la connexion');
    return;
  }

  const loginData = await loginResponse.json();
  console.log('✅ Connexion réussie');
  console.log('📋 Données utilisateur:', loginData.data.userSession);
  
  // Récupérer le token du cookie
  const cookies = loginResponse.headers.get('set-cookie');
  let token = null;
  if (cookies) {
    const authCookie = cookies.split(',').find(cookie => cookie.includes('authToken='));
    if (authCookie) {
      token = authCookie.split('authToken=')[1]?.split(';')[0];
    }
  }
  
  console.log('🔑 Token extrait:', token ? token.substring(0, 20) + '...' : 'Aucun token');
  console.log('');

  // 2. Test de l'API chat frontend avec le token
  console.log('💬 Test de l\'API chat frontend...');
  const chatResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${token}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Qui suis-je exactement ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const chatData = await chatResponse.json();
  console.log('📝 Réponse chat:', chatData.text);
  console.log('');

  // 3. Test avec une question spécifique sur l'identité
  console.log('🎯 Test d\'identification spécifique...');
  const identityResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${token}`
    },
    body: JSON.stringify({
      messages: [{ id: '2', text: 'Dis-moi mon prénom, mon âge et mon type d\'utilisateur', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const identityData = await identityResponse.json();
  console.log('📝 Réponse identité:', identityData.text);

  console.log('\n✅ Test terminé !');
}

testFrontendAuth().catch(console.error);

