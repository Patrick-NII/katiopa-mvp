// Script de test pour vérifier l'accès aux données via l'API
import fetch from 'node-fetch'

async function testBubixDataAccess() {
  console.log('🧪 Test de l\'accès aux données via Bubix...')
  
  try {
    // 1. Se connecter en tant que parent
    console.log('🔐 Connexion en tant que parent...')
    
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'parent_01',
        password: 'password123'
      })
    })
    
    if (!loginResponse.ok) {
      throw new Error(`Erreur de connexion: ${loginResponse.status}`)
    }
    
    // Récupérer le cookie d'authentification
    const setCookieHeader = loginResponse.headers.get('set-cookie')
    console.log('🍪 Cookie reçu:', setCookieHeader ? 'Oui' : 'Non')
    
    if (!setCookieHeader) {
      throw new Error('Pas de cookie d\'authentification reçu')
    }
    
    // Extraire le token du cookie
    const authTokenMatch = setCookieHeader.match(/authToken=([^;]+)/)
    const authToken = authTokenMatch ? authTokenMatch[1] : null
    
    console.log('🔑 Token extrait:', authToken ? 'Oui' : 'Non')
    
    const loginData = await loginResponse.json()
    console.log('✅ Connexion réussie pour:', loginData.data.userSession.firstName)
    
    // 2. Tester l'accès aux données via la route /api/chat/data
    console.log('\n📊 Test de l\'accès aux données enfants...')
    
    const dataResponse = await fetch('http://localhost:3000/api/chat/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${authToken}`
      },
      body: JSON.stringify({
        type: 'performance',
        timeRange: 'all'
      })
    })
    
    if (!dataResponse.ok) {
      console.log('❌ Erreur accès données:', dataResponse.status)
      const errorText = await dataResponse.text()
      console.log('Détails:', errorText)
    } else {
      const dataResult = await dataResponse.json()
      console.log('✅ Données récupérées avec succès')
      console.log('📈 Résultats:', JSON.stringify(dataResult, null, 2))
    }
    
    // 3. Tester l'accès via la route chat principale
    console.log('\n💬 Test de l\'accès via Bubix chat...')
    
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${authToken}`
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
testBubixDataAccess()
