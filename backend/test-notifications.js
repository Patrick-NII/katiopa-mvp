// Script de test pour le service de notifications
import { sendAllRegistrationNotifications } from './src/services/notifications.js';

// Données de test
const testSessions = [
  {
    firstName: "Alice",
    lastName: "Dupont",
    sessionId: "AD_123456_abc123",
    password: "alice123",
    userType: "CHILD"
  },
  {
    firstName: "Marie",
    lastName: "Dupont",
    sessionId: "MD_123456_def456",
    password: "marie456",
    userType: "PARENT"
  }
];

const testAccount = {
  id: "acc_test_123",
  email: "test@example.com",
  subscriptionType: "PRO_PLUS",
  maxSessions: 4,
  createdAt: new Date()
};

// Test des notifications
async function testNotifications() {
  console.log('🧪 Test des notifications Katiopa');
  console.log('=====================================\n');
  
  try {
    const result = await sendAllRegistrationNotifications(
      testAccount.email,
      testSessions,
      testAccount
    );
    
    console.log('\n📊 Résultats des tests:');
    console.log(`   Email: ${result.email ? '✅ Succès' : '❌ Échec'}`);
    console.log(`   WhatsApp: ${result.whatsapp ? '✅ Succès' : '❌ Échec'}`);
    
    if (result.email && result.whatsapp) {
      console.log('\n🎉 Tous les tests sont passés avec succès !');
    } else {
      console.log('\n⚠️ Certains tests ont échoué.');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
testNotifications();
