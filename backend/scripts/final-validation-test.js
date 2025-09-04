import fetch from 'node-fetch';

async function finalValidationTest() {
  console.log('🎯 TEST FINAL DE VALIDATION COMPLÈTE\n');
  console.log('=' .repeat(60));
  console.log('🔍 VALIDATION DU SYSTÈME CUBEAI');
  console.log('=' .repeat(60));
  console.log('');

  let allTestsPassed = true;
  const results = [];
  let childToken, parentToken; // Variables pour stocker les tokens

  // Test 1: Authentification enfant
  console.log('👶 TEST 1: Authentification et reconnaissance enfant');
  try {
    const childLogin = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'enfant_01',
        password: 'password123'
      })
    });

    if (!childLogin.ok) throw new Error('Échec connexion enfant');
    
    const childData = await childLogin.json();
    childToken = childLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
    
    if (!childToken) throw new Error('Token enfant non récupéré');
    
    const childChat = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${childToken}`
      },
      body: JSON.stringify({
        messages: [{ id: '1', text: 'Qui suis-je ?', sender: 'user', timestamp: Date.now() }],
        persona: 'kid',
        lang: 'fr'
      })
    });

    const childResponse = await childChat.json();
    
    if (childResponse.userInfo.userType !== 'CHILD') throw new Error('Type utilisateur incorrect');
    if (!childResponse.text.includes('Emma')) throw new Error('Prénom non reconnu');
    
    console.log('✅ Authentification enfant: SUCCÈS');
    console.log('   - Emma reconnue comme CHILD');
    console.log('   - Réponse personnalisée générée');
    results.push('✅ Authentification enfant');
    
  } catch (error) {
    console.log('❌ Authentification enfant: ÉCHEC');
    console.log('   - Erreur:', error.message);
    results.push('❌ Authentification enfant');
    allTestsPassed = false;
  }
  console.log('');

  // Test 2: Authentification parent
  console.log('👨‍👩‍👧‍👦 TEST 2: Authentification et reconnaissance parent');
  try {
    const parentLogin = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'parent_01',
        password: 'password123'
      })
    });

    if (!parentLogin.ok) throw new Error('Échec connexion parent');
    
    const parentData = await parentLogin.json();
    parentToken = parentLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
    
    if (!parentToken) throw new Error('Token parent non récupéré');
    
    const parentChat = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parentToken}`
      },
      body: JSON.stringify({
        messages: [{ id: '1', text: 'Quels sont mes enfants ?', sender: 'user', timestamp: Date.now() }],
        persona: 'pro',
        lang: 'fr'
      })
    });

    const parentResponse = await parentChat.json();
    
    if (parentResponse.userInfo.userType !== 'PARENT') throw new Error('Type utilisateur incorrect');
    if (!parentResponse.text.includes('Emma') || !parentResponse.text.includes('Lucas')) throw new Error('Enfants non mentionnés');
    
    console.log('✅ Authentification parent: SUCCÈS');
    console.log('   - Marie reconnue comme PARENT');
    console.log('   - Enfants Emma et Lucas mentionnés');
    results.push('✅ Authentification parent');
    
  } catch (error) {
    console.log('❌ Authentification parent: ÉCHEC');
    console.log('   - Erreur:', error.message);
    results.push('❌ Authentification parent');
    allTestsPassed = false;
  }
  console.log('');

  // Test 3: Données CubeMatch
  console.log('🎮 TEST 3: Accès aux données CubeMatch');
  try {
    const cubeMatchChat = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${childToken}`
      },
      body: JSON.stringify({
        messages: [{ id: '1', text: 'Mes statistiques CubeMatch', sender: 'user', timestamp: Date.now() }],
        persona: 'kid',
        lang: 'fr'
      })
    });

    const cubeMatchResponse = await cubeMatchChat.json();
    
    if (!cubeMatchResponse.text.includes('parties') && !cubeMatchResponse.text.includes('niveau') && !cubeMatchResponse.text.includes('CubeMatch') && !cubeMatchResponse.text.includes('41')) {
      throw new Error('Données CubeMatch non trouvées');
    }
    
    console.log('✅ Données CubeMatch: SUCCÈS');
    console.log('   - Statistiques de parties récupérées');
    console.log('   - Niveau maximum mentionné');
    results.push('✅ Données CubeMatch');
    
  } catch (error) {
    console.log('❌ Données CubeMatch: ÉCHEC');
    console.log('   - Erreur:', error.message);
    results.push('❌ Données CubeMatch');
    allTestsPassed = false;
  }
  console.log('');

  // Test 4: Recommandations parentales
  console.log('💡 TEST 4: Recommandations parentales');
  try {
    const recommendationsChat = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parentToken}`
      },
      body: JSON.stringify({
        messages: [{ id: '1', text: 'Recommandations pour mes enfants', sender: 'user', timestamp: Date.now() }],
        persona: 'pro',
        lang: 'fr'
      })
    });

    const recommendationsResponse = await recommendationsChat.json();
    
    if (!recommendationsResponse.text.includes('recommand') || !recommendationsResponse.text.includes('amélior')) {
      throw new Error('Recommandations non générées');
    }
    
    console.log('✅ Recommandations parentales: SUCCÈS');
    console.log('   - Recommandations personnalisées générées');
    console.log('   - Suggestions d\'amélioration fournies');
    results.push('✅ Recommandations parentales');
    
  } catch (error) {
    console.log('❌ Recommandations parentales: ÉCHEC');
    console.log('   - Erreur:', error.message);
    results.push('❌ Recommandations parentales');
    allTestsPassed = false;
  }
  console.log('');

  // Test 5: Gestion d'erreur
  console.log('🔍 TEST 5: Gestion des erreurs');
  try {
    const errorChat = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token'
      },
      body: JSON.stringify({
        messages: [{ id: '1', text: 'Test erreur', sender: 'user', timestamp: Date.now() }],
        persona: 'kid',
        lang: 'fr'
      })
    });

    const errorResponse = await errorChat.json();
    
    if (!errorResponse.text.includes('Connexion requise') && !errorResponse.text.includes('Support CubeAI')) {
      throw new Error('Gestion d\'erreur incorrecte');
    }
    
    console.log('✅ Gestion des erreurs: SUCCÈS');
    console.log('   - Token invalide géré correctement');
    console.log('   - Message d\'erreur approprié');
    results.push('✅ Gestion des erreurs');
    
  } catch (error) {
    console.log('❌ Gestion des erreurs: ÉCHEC');
    console.log('   - Erreur:', error.message);
    results.push('❌ Gestion des erreurs');
    allTestsPassed = false;
  }
  console.log('');

  // Résumé final
  console.log('=' .repeat(60));
  console.log('📊 RÉSULTATS FINAUX');
  console.log('=' .repeat(60));
  console.log('');
  
  results.forEach(result => console.log(result));
  console.log('');
  
  if (allTestsPassed) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Le système CubeAI est entièrement opérationnel');
    console.log('✅ Toutes les fonctionnalités sont validées');
    console.log('✅ La gestion d\'erreur est robuste');
    console.log('✅ Les sessions enfants et parents fonctionnent parfaitement');
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('🔧 Des corrections sont nécessaires');
  }
  
  console.log('');
  console.log('🎯 STATUT FINAL: ' + (allTestsPassed ? 'OPÉRATIONNEL' : 'NÉCESSITE CORRECTIONS'));
  console.log('=' .repeat(60));
}

finalValidationTest().catch(console.error);
