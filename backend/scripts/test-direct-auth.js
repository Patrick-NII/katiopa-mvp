// Test direct de l'authentification en mode développement
import fetch from 'node-fetch'

async function testDirectAuth() {
  console.log('🧪 Test direct de l\'authentification...')
  
  try {
    // Test direct de la route chat sans authentification (mode dev)
    console.log('💬 Test direct de Bubix en mode développement...')
    
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            id: '1',
            text: 'Peux-tu me faire un compte rendu de mon fils Lucas ?',
            sender: 'user',
            timestamp: Date.now()
          }
        ],
        persona: 'pro',
        lang: 'fr'
      })
    })
    
    if (!chatResponse.ok) {
      console.log('❌ Erreur chat:', chatResponse.status)
      const errorText = await chatResponse.text()
      console.log('Détails:', errorText)
    } else {
      const chatResult = await chatResponse.json()
      console.log('✅ Réponse Bubix obtenue')
      console.log('💭 Réponse:', chatResult.text)
      console.log('🔍 Données utilisées:', chatResult.model ? 'Oui' : 'Non')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testDirectAuth()
