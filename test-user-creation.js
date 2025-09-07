#!/usr/bin/env node

const testUserCreation = async () => {
  console.log('🧪 TEST DE CRÉATION D\'UTILISATEUR');
  console.log('=====================================\n');

  const timestamp = Date.now();
  const testData = {
    email: `test.user.${timestamp}@example.com`,
    firstName: `Test${timestamp}`,
    lastName: "User",
    password: "password123",
    confirmPassword: "password123",
    subscriptionType: "FREE",
    familyMembers: [
      {
        firstName: `Test${timestamp}`,
        lastName: "User",
        gender: "UNKNOWN",
        userType: "PARENT",
        dateOfBirth: "01/01/1990",
        grade: "",
        username: `testuser${timestamp}`,
        sessionPassword: "password123"
      }
    ],
    parentPrompts: {
      objectives: "Apprentissage personnalisé",
      preferences: "Méthode ludique",
      concerns: "Motivation de l'enfant"
    },
    selectedPaymentMethod: "paypal",
    payPaypal: {
      email: "test.user@paypal.com"
    },
    promoCode: "",
    acceptTerms: true
  };

  try {
    console.log('📤 Envoi de la requête d\'inscription...');
    console.log('📧 Email:', testData.email);
    console.log('👤 Nom:', testData.firstName, testData.lastName);
    console.log('💳 Méthode de paiement:', testData.selectedPaymentMethod);
    console.log('');

    const response = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('📊 RÉSULTAT DU TEST:');
    console.log('===================');
    console.log('Status HTTP:', response.status);
    console.log('Succès:', response.ok ? '✅' : '❌');
    console.log('');

    if (response.ok) {
      console.log('✅ INSCRIPTION RÉUSSIE !');
      console.log('📋 Données retournées:');
      console.log('- Account ID:', result.data?.accountId || 'N/A');
      console.log('- Sessions créées:', result.data?.sessions?.length || 0);
      console.log('- Email envoyé:', result.data?.emailSent ? '✅' : '❌');
      console.log('');
      
      if (result.data?.sessions) {
        console.log('👥 Sessions créées:');
        result.data.sessions.forEach((session, index) => {
          console.log(`  ${index + 1}. ${session.firstName} ${session.lastName} (${session.userType})`);
          console.log(`     - Session ID: ${session.sessionId}`);
          console.log(`     - Username: ${session.username || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ ÉCHEC DE L\'INSCRIPTION');
      console.log('Erreur:', result.error || 'Erreur inconnue');
      console.log('Code:', result.code || 'N/A');
      if (result.details) {
        console.log('Détails:', result.details);
      }
    }

  } catch (error) {
    console.log('💥 ERREUR DE CONNEXION');
    console.log('Erreur:', error.message);
    console.log('');
    console.log('🔍 Vérifications à effectuer:');
    console.log('- Le serveur backend est-il démarré ? (port 4000)');
    console.log('- La base de données est-elle accessible ?');
    console.log('- Les variables d\'environnement sont-elles configurées ?');
  }

  console.log('\n🏁 Test terminé');
};

testUserCreation();
