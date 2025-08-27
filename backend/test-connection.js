import fetch from 'node-fetch';

async function testConnection() {
  console.log('🧪 Test de connexion avec les comptes de test...\n');

  const testAccounts = [
    { sessionId: 'LUCAS_001', password: 'lucas123', name: 'Lucas' },
    { sessionId: 'EMMA_002', password: 'emma123', name: 'Emma' },
    { sessionId: 'PATRICK_007', password: 'patrick123', name: 'Patrick' },
    { sessionId: 'AYLON_008', password: 'aylon123', name: 'Aylon' }
  ];

  for (const account of testAccounts) {
    try {
      console.log(`🔐 Test de connexion pour ${account.name} (${account.sessionId})...`);
      
      const response = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: account.sessionId,
          password: account.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Connexion réussie pour ${account.name}!`);
        console.log(`   Token: ${data.token.substring(0, 20)}...`);
        console.log(`   Utilisateur: ${data.user.firstName} ${data.user.lastName}`);
        console.log(`   Type: ${data.user.userType}`);
        console.log(`   Abonnement: ${data.user.subscriptionType}\n`);
        
        // Test de récupération du profil
        const profileResponse = await fetch('http://localhost:4000/auth/me', {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log(`📋 Profil récupéré avec succès pour ${account.name}!`);
          console.log(`   Email: ${profileData.user.email}`);
          console.log(`   ID Compte: ${profileData.user.accountId}\n`);
        } else {
          console.log(`❌ Erreur lors de la récupération du profil pour ${account.name}\n`);
        }
      } else {
        console.log(`❌ Échec de connexion pour ${account.name}: ${data.error || 'Erreur inconnue'}\n`);
      }
    } catch (error) {
      console.log(`❌ Erreur de connexion pour ${account.name}: ${error.message}\n`);
    }
  }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  testConnection();
}, 3000); 