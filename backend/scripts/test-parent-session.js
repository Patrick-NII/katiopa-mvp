import fetch from 'node-fetch';

async function testParentSession() {
  console.log('🔍 Test de session parent...\n');

  // 1. Connexion parent
  console.log('🔐 Connexion parent...');
  const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
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
  console.log('✅ Connexion parent réussie');
  console.log('📋 Parent connecté:', loginData.data.userSession.firstName, loginData.data.userSession.userType);
  
  // Extraire le token du cookie
  const cookies = loginResponse.headers.get('set-cookie');
  let token = null;
  if (cookies) {
    const authCookie = cookies.split(',').find(cookie => cookie.includes('authToken='));
    if (authCookie) {
      token = authCookie.split('authToken=')[1]?.split(';')[0];
    }
  }
  
  console.log('🔑 Token extrait:', token ? token.substring(0, 50) + '...' : 'Aucun token');
  console.log('');

  // 2. Test de l'API chat avec le parent
  console.log('💬 Test de l\'API chat avec parent...');
  
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Qui suis-je et quels sont mes enfants ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const data = await response.json();
  console.log('📝 Réponse parent:', JSON.stringify(data, null, 2));
  console.log('');

  console.log('✅ Test parent terminé !');
}

testParentSession().catch(console.error);

