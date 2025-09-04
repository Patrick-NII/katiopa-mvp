// Script pour déboguer l'authentification
import fetch from 'node-fetch'

async function debugAuth() {
  console.log('🔍 Débogage de l\'authentification...')
  
  try {
    // 1. Se connecter en tant que parent
    console.log('🔐 Tentative de connexion...')
    
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
    
    console.log('📊 Status de la réponse:', loginResponse.status)
    console.log('📋 Headers:', Object.fromEntries(loginResponse.headers.entries()))
    
    const loginData = await loginResponse.json()
    console.log('📄 Données de réponse:', JSON.stringify(loginData, null, 2))
    
    if (loginData.token) {
      console.log('✅ Token trouvé dans la réponse')
      
      // Tester la vérification du token
      console.log('\n🔍 Test de vérification du token...')
      
      const verifyResponse = await fetch('http://localhost:4000/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      })
      
      console.log('📊 Status vérification:', verifyResponse.status)
      const verifyData = await verifyResponse.json()
      console.log('📄 Données vérification:', JSON.stringify(verifyData, null, 2))
      
    } else {
      console.log('❌ Pas de token dans la réponse')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error)
  }
}

// Exécuter le débogage
debugAuth()
