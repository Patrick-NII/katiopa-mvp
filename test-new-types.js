#!/usr/bin/env node

const testRegistrationWithNewTypes = async () => {
  console.log('🧪 TEST D\'INSCRIPTION AVEC NOUVEAUX TYPES');
  console.log('==========================================\n');

  const timestamp = Date.now();
  const testData = {
    email: `test.newtypes.${timestamp}@example.com`,
    firstName: `Test${timestamp}`,
    lastName: "NewTypes",
    password: "password123",
    confirmPassword: "password123",
    subscriptionType: "DECOUVERTE", // Nouveau type
    familyMembers: [
      {
        firstName: `Test${timestamp}`,
        lastName: "NewTypes",
        gender: "UNKNOWN",
        userType: "PARENT",
        dateOfBirth: "01/01/1990",
        grade: "",
        username: `testnewtypes${timestamp}`,
        sessionPassword: "password123"
      }
    ],
    parentPrompts: {
      objectives: "Test des nouveaux types",
      preferences: "Validation des corrections",
      concerns: "Vérification du mapping"
    },
    selectedPaymentMethod: "paypal",
    payPaypal: {
      email: "test.newtypes@paypal.com"
    },
    promoCode: "",
    acceptTerms: true
  };

  try {
    console.log('📤 Test avec le nouveau type DECOUVERTE...');
    console.log('📧 Email:', testData.email);
    console.log('💳 Type d\'abonnement:', testData.subscriptionType);
    console.log('');

    const response = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('📊 RÉSULTAT:');
    console.log('============');
    console.log('Status HTTP:', response.status);
    console.log('Succès:', response.ok ? '✅' : '❌');
    console.log('');

    if (response.ok) {
      console.log('✅ INSCRIPTION RÉUSSIE AVEC NOUVEAUX TYPES !');
      console.log('🆔 Account ID:', result.data?.accountId || 'N/A');
      console.log('👥 Sessions créées:', result.data?.sessions?.length || 0);
      console.log('💳 Type d\'abonnement:', testData.subscriptionType);
      console.log('');
      
      if (result.data?.sessions) {
        console.log('👤 Sessions créées:');
        result.data.sessions.forEach((session, index) => {
          console.log(`  ${index + 1}. ${session.firstName} ${session.lastName} (${session.userType})`);
          console.log(`     - Session ID: ${session.sessionId}`);
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
  }

  console.log('\n🏁 Test terminé');
};

testRegistrationWithNewTypes();

