import fetch from 'node-fetch';

async function testFrontendCookies() {
  console.log('🧪 Test des cookies frontend...\n');

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

  const loginData = await loginResponse.json();
  console.log('✅ Connexion réussie');
  
  // Récupérer le token du cookie
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

  // 2. Test de l'API chat avec le cookie dans le header Cookie
  console.log('💬 Test de l\'API chat avec header Cookie...');
  const chatResponse1 = await fetch('http://localhost:3000/api/chat', {
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

  const chatData1 = await chatResponse1.json();
  console.log('📝 Réponse avec header Cookie:', chatData1.text);
  console.log('');

  // 3. Test de l'API chat avec le cookie dans les cookies de la requête
  console.log('💬 Test de l\'API chat avec cookies de requête...');
  const chatResponse2 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [{ id: '2', text: 'Qui suis-je ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    }),
    credentials: 'include'
  });

  const chatData2 = await chatResponse2.json();
  console.log('📝 Réponse avec credentials include:', chatData2.text);
  console.log('');

  // 4. Test de l'API chat avec le token dans le header Authorization
  console.log('💬 Test de l\'API chat avec header Authorization...');
  const chatResponse3 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ id: '3', text: 'Qui suis-je ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const chatData3 = await chatResponse3.json();
  console.log('📝 Réponse avec Authorization:', chatData3.text);

  console.log('\n✅ Test terminé !');
}

testFrontendCookies().catch(console.error);

