// Test simple pour vérifier l'API frontend
async function testFrontendAPI() {
  console.log('🔍 Test de l\'API frontend...\n');

  try {
    // Simuler une requête à l'API frontend
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Token de test
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'je souhaiterais que Emma passe plus de temps sur CubeMatch'
          }
        ],
        persona: 'pro'
      })
    });

    const data = await response.json();
    
    console.log('📊 Réponse de l\'API frontend:');
    console.log(`✅ Status: ${response.status}`);
    console.log(`📝 Réponse: ${data.text?.substring(0, 100)}...`);
    console.log(`🎫 Model: ${data.model}`);
    console.log(`👤 UserInfo: ${data.userInfo?.name}`);
    console.log(`🎫 UserType: ${data.userInfo?.userType}`);

  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API frontend:', error);
  }
}

// Test avec curl pour simuler une requête
async function testWithCurl() {
  console.log('🔍 Test avec curl...\n');

  const curlCommand = `curl -X POST http://localhost:3000/api/chat \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer test-token" \\
    -d '{
      "messages": [
        {
          "role": "user",
          "content": "je souhaiterais que Emma passe plus de temps sur CubeMatch"
        }
      ],
      "persona": "pro"
    }'`;

  console.log('📝 Commande curl:');
  console.log(curlCommand);
  console.log('\n🎯 Exécutez cette commande dans un terminal pour tester l\'API');
}

testFrontendAPI();
testWithCurl();
