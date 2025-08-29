const BASE_URL = 'http://localhost:4000/api';

// Test des types d'abonnement
const testAccounts = [
  {
    name: 'Marie Dupont (FREE)',
    sessionId: 'MARIE_DUPONT',
    password: 'password123',
    expectedType: 'FREE'
  },
  {
    name: 'Patrick Martin (PRO)',
    sessionId: 'PATRICK_MARTIN',
    password: 'password123',
    expectedType: 'PRO'
  },
  {
    name: 'Sophie Bernard (PRO_PLUS)',
    sessionId: 'SOPHIE_BERNARD',
    password: 'password123',
    expectedType: 'PRO_PLUS'
  }
];

async function testSubscriptionTypes() {
  console.log('🧪 TEST DES TYPES D\'ABONNEMENT\n');
  
  for (const account of testAccounts) {
    console.log(`🔐 Test de ${account.name}...`);
    
    try {
      // Test de connexion
      const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: account.sessionId,
          password: account.password
        })
      });
      
      if (!loginResponse.ok) {
        throw new Error(`Connexion échouée: ${loginResponse.status}`);
      }
      
      const loginData = await loginResponse.json();
      const token = loginData.token;
      console.log(`✅ Connexion réussie`);
      
      // Test du profil utilisateur
      const profileResponse = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const actualType = profileData.user.subscriptionType;
        
        console.log(`📊 Profil: ${profileData.user.firstName} ${profileData.user.lastName}`);
        console.log(`   Type d'abonnement: ${actualType} (attendu: ${account.expectedType})`);
        
        if (actualType === account.expectedType) {
          console.log(`✅ Type d'abonnement correct`);
        } else {
          console.log(`❌ Type d'abonnement incorrect`);
        }
        
        // Vérifier que le champ subscriptionType est présent
        if (actualType) {
          console.log(`✅ Champ subscriptionType présent`);
        } else {
          console.log(`❌ Champ subscriptionType manquant`);
        }
        
      } else {
        console.log(`❌ Erreur profil: ${profileResponse.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur pour ${account.name}: ${error.message}`);
    }
    
    console.log(''); // Ligne vide pour la lisibilité
  }
  
  console.log('🏁 Tests terminés !');
}

// Exécuter les tests
testSubscriptionTypes().catch(console.error);
