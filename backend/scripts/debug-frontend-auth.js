import fetch from 'node-fetch';

async function debugFrontendAuth() {
  console.log('🔍 Debug de l\'authentification frontend...\n');

  // 1. Connexion pour obtenir un token valide
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

  // 2. Test avec Cookie header
  console.log('🍪 Test avec Cookie header...');
  const cookieResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${token}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Qui suis-je ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const cookieData = await cookieResponse.json();
  console.log('📝 Réponse avec Cookie:', cookieData.text.substring(0, 100) + '...');
  console.log('');

  // 3. Test avec Authorization header
  console.log('🔑 Test avec Authorization header...');
  const authResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Qui suis-je ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const authData = await authResponse.json();
  console.log('📝 Réponse avec Authorization:', authData.text.substring(0, 100) + '...');
  console.log('');

  // 4. Test avec les deux headers
  console.log('🔑🍪 Test avec les deux headers...');
  const bothResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${token}`,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Qui suis-je ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const bothData = await bothResponse.json();
  console.log('📝 Réponse avec les deux headers:', bothData.text.substring(0, 100) + '...');
  console.log('');

  // 5. Vérifier les headers de réponse
  console.log('📋 Headers de réponse (Cookie):');
  console.log('Set-Cookie:', cookieResponse.headers.get('set-cookie'));
  console.log('Content-Type:', cookieResponse.headers.get('content-type'));
  console.log('');

  console.log('📋 Headers de réponse (Authorization):');
  console.log('Set-Cookie:', authResponse.headers.get('set-cookie'));
  console.log('Content-Type:', authResponse.headers.get('content-type'));
  console.log('');

  console.log('✅ Debug terminé !');
}

debugFrontendAuth().catch(console.error);

