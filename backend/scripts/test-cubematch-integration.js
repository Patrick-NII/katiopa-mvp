// Test de l'intégration CubeMatch dans Bubix avec debug
import fetch from 'node-fetch';

async function testCubeMatchIntegration() {
  console.log('🧪 Test de l\'intégration CubeMatch dans Bubix...');
  
  try {
    // 1. Se connecter en tant que parent
    console.log('🔐 Connexion en tant que parent...');
    
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'parent_01',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Erreur de connexion: ${loginResponse.status}`);
    }
    
    // Récupérer le cookie d'authentification
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const authTokenMatch = setCookieHeader.match(/authToken=([^;]+)/);
    const authToken = authTokenMatch ? authTokenMatch[1] : null;
    
    if (!authToken) {
      throw new Error('Token d\'authentification non trouvé');
    }
    
    console.log('✅ Connexion réussie');
    
    // 2. Tester une question sur CubeMatch
    console.log('\n🎮 Test question sur CubeMatch...');
    
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${authToken}`
      },
      body: JSON.stringify({
        messages: [{
          id: '1',
          text: 'Peux-tu me parler des performances de mes enfants dans CubeMatch ?',
          sender: 'user',
          timestamp: Date.now()
        }]
      })
    });
    
    if (!chatResponse.ok) {
      throw new Error(`Erreur chat: ${chatResponse.status}`);
    }
    
    const chatData = await chatResponse.json();
    console.log('📝 Réponse complète:', JSON.stringify(chatData, null, 2));
          console.log('📝 Réponse Bubix:', chatData.text);
    
    // 3. Tester une question spécifique sur les opérations
    console.log('\n🔢 Test question sur les opérations...');
    
    const chatResponse2 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${authToken}`
      },
      body: JSON.stringify({
        messages: [{
          id: '2',
          text: 'Quelle opération mathématique est la plus difficile pour mes enfants ?',
          sender: 'user',
          timestamp: Date.now()
        }]
      })
    });
    
    if (!chatResponse2.ok) {
      throw new Error(`Erreur chat: ${chatResponse2.status}`);
    }
    
    const chatData2 = await chatResponse2.json();
    console.log('📝 Réponse complète 2:', JSON.stringify(chatData2, null, 2));
          console.log('📝 Réponse Bubix 2:', chatData2.text);
    
    console.log('\n✅ Test d\'intégration CubeMatch terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testCubeMatchIntegration();
