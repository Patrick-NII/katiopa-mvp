import fetch from 'node-fetch';

async function debugChildSession() {
  console.log('🔍 Debug de la session enfant...\n');

  // Connexion enfant
  console.log('🔐 Connexion en tant qu\'enfant...');
  const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
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
  console.log('✅ Connexion réussie');
  console.log('🔑 Token reçu:', authToken ? authToken.substring(0, 20) + '...' : 'Aucun token');
  console.log('📋 Données de connexion:', JSON.stringify(loginData, null, 2));
  console.log('');
  
  // Récupérer le token depuis les cookies
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('🍪 Cookies reçus:', cookies);
  
  // Extraire le token du cookie
  let tokenFromCookie = null;
  if (cookies) {
    const authCookie = cookies.split(',').find(cookie => cookie.includes('authToken='));
    if (authCookie) {
      tokenFromCookie = authCookie.split('authToken=')[1]?.split(';')[0];
      console.log('🔑 Token extrait du cookie:', tokenFromCookie ? tokenFromCookie.substring(0, 20) + '...' : 'Aucun token');
    }
  }
  
  const finalToken = authToken || tokenFromCookie;
  console.log('🔑 Token final utilisé:', finalToken ? finalToken.substring(0, 20) + '...' : 'Aucun token');
  console.log('');

  // Test de vérification d'auth
  console.log('🔍 Test de vérification d\'authentification...');
  const verifyResponse = await fetch('http://localhost:4000/api/auth/verify', {
    headers: { 
      'Cookie': `authToken=${finalToken}`
    }
  });

  if (verifyResponse.ok) {
    const verifyData = await verifyResponse.json();
    console.log('✅ Vérification réussie:');
    console.log('   - ID:', verifyData.user?.id);
    console.log('   - Session ID:', verifyData.user?.sessionId);
    console.log('   - Nom:', verifyData.user?.firstName, verifyData.user?.lastName);
    console.log('   - Type:', verifyData.user?.userType);
    console.log('');
  } else {
    console.log('❌ Échec de la vérification');
  }

  // Test de chat avec debug
  console.log('💬 Test de chat avec debug...');
  const chatResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${finalToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Qui suis-je ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const chatData = await chatResponse.json();
  console.log('📝 Réponse chat:', chatData.text);
  console.log('');

  // Test avec question spécifique
  console.log('🎯 Test avec question spécifique...');
  const specificResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `authToken=${finalToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '2', text: 'Dis-moi mon prénom et mon âge', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const specificData = await specificResponse.json();
  console.log('📝 Réponse spécifique:', specificData.text);

  console.log('\n✅ Debug terminé !');
}

debugChildSession().catch(console.error);
