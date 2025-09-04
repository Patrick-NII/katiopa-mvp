import fetch from 'node-fetch';

async function testDebugEndpoint() {
  console.log('🔍 Test de l\'endpoint de debug...\n');

  // 1. Connexion pour obtenir un token
  console.log('🔐 Connexion pour obtenir un token...');
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
  console.log('📋 Utilisateur connecté:', loginData.data.userSession.firstName, loginData.data.userSession.userType);
  
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

  // 2. Test de l'endpoint de debug
  console.log('🔍 Test de l\'endpoint /api/test-auth...');
  
  const response = await fetch('http://localhost:3000/api/test-auth', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({})
  });

  const data = await response.json();
  console.log('📝 Réponse de debug:', JSON.stringify(data, null, 2));
  console.log('');

  console.log('✅ Test terminé !');
}

testDebugEndpoint().catch(console.error);

