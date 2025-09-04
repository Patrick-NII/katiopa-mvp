import fetch from 'node-fetch';

async function testSimpleAuth() {
  console.log('🧪 Test simple d\'authentification...\n');

  // Connexion pour obtenir un token
  console.log('🔐 Connexion...');
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

  // Test de l'API chat avec le token dans Authorization
  console.log('💬 Test de l\'API chat avec Authorization...');
  const chatResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Dis-moi exactement qui je suis', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const chatData = await chatResponse.json();
  console.log('📝 Réponse:', chatData.text);

  console.log('\n✅ Test terminé !');
}

testSimpleAuth().catch(console.error);

