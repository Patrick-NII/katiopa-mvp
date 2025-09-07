#!/usr/bin/env node

const verifyUserViaAPI = async () => {
  console.log('🔍 VÉRIFICATION VIA API');
  console.log('=======================\n');

  try {
    const testSessionId = "test1757222694605_parent";
    const testPassword = "password123";

    console.log('🔐 Test de connexion...');
    console.log('🆔 Session ID:', testSessionId);
    console.log('🔑 Mot de passe:', testPassword);
    console.log('');

    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: testSessionId,
        password: testPassword
      })
    });

    const loginResult = await loginResponse.json();

    if (loginResponse.ok) {
      console.log('✅ CONNEXION RÉUSSIE !');
      console.log('=====================');
      console.log('📧 Email:', loginResult.data?.account?.email);
      console.log('🆔 Account ID:', loginResult.data?.account?.id);
      console.log('💳 Type d\'abonnement:', loginResult.data?.account?.subscriptionType);
      console.log('👥 Sessions max:', loginResult.data?.account?.maxSessions);
      console.log('');
      console.log('👤 SESSION UTILISATEUR:');
      console.log('🆔 Session ID:', loginResult.data?.userSession?.sessionId);
      console.log('👤 Nom:', loginResult.data?.userSession?.firstName, loginResult.data?.userSession?.lastName);
      console.log('🏷️ Type:', loginResult.data?.userSession?.userType);
      console.log('📋 Profil:', loginResult.data?.userSession?.profile ? '✅ Créé' : '❌ Manquant');
      console.log('');

      // Test d'accès aux sessions
      console.log('📋 Test d\'accès aux sessions...');
      const sessionsResponse = await fetch('http://localhost:4000/api/sessions', {
        headers: {
          'Authorization': `Bearer ${loginResult.token}`
        }
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        console.log('✅ Accès aux sessions réussi');
        console.log('👥 Sessions disponibles:', sessionsData.sessions?.length || 0);
        
        if (sessionsData.sessions) {
          sessionsData.sessions.forEach((session, index) => {
            console.log(`  ${index + 1}. ${session.firstName} ${session.lastName} (${session.userType})`);
            console.log(`     - Session ID: ${session.sessionId}`);
            console.log(`     - Actif: ${session.isActive ? '✅' : '❌'}`);
          });
        }
      } else {
        console.log('❌ Échec d\'accès aux sessions');
      }

    } else {
      console.log('❌ ÉCHEC DE CONNEXION');
      console.log('Erreur:', loginResult.error || 'Erreur inconnue');
      console.log('Code:', loginResult.code || 'N/A');
    }

  } catch (error) {
    console.log('💥 ERREUR DE CONNEXION');
    console.log('Erreur:', error.message);
  }

  console.log('\n🏁 Vérification terminée');
};

verifyUserViaAPI();
