import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api';

// Comptes de test mis à jour
const testAccounts = [
  {
    name: 'Marie Dupont (FREE)',
    sessionId: 'MARIE_DUPONT',
    password: 'password123'
  },
  {
    name: 'Lucas Dupont (FREE)',
    sessionId: 'LUCAS_005',
    password: 'password123'
  },
  {
    name: 'Patrick Martin (PRO)',
    sessionId: 'PATRICK_MARTIN',
    password: 'password123'
  },
  {
    name: 'Emma Martin (PRO)',
    sessionId: 'EMMA_006',
    password: 'password123'
  },
  {
    name: 'Thomas Martin (PRO)',
    sessionId: 'THOMAS_007',
    password: 'password123'
  },
  {
    name: 'Sophie Bernard (PRO_PLUS)',
    sessionId: 'SOPHIE_BERNARD',
    password: 'password123'
  },
  {
    name: 'Julia Bernard (PRO_PLUS)',
    sessionId: 'JULIA_004',
    password: 'password123'
  },
  {
    name: 'Alex Bernard (PRO_PLUS)',
    sessionId: 'ALEX_008',
    password: 'password123'
  }
];

async function testConnection(account) {
  try {
    console.log(`🔐 Test de connexion pour ${account.name}...`);
    
    // Test de connexion
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: account.sessionId,
        password: account.password
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.success) {
      const token = loginData.token;
      console.log(`✅ Connexion réussie pour ${account.name}`);
      
      // Test du profil utilisateur
      try {
        const profileResponse = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileResponse.json();
        if (profileResponse.ok) {
          console.log(`   📊 Profil: ${profileData.user.firstName} ${profileData.user.lastName} (${profileData.user.userType})`);
        } else {
          console.log(`   ❌ Erreur profil: ${profileData.message || 'Erreur inconnue'}`);
        }
      } catch (error) {
        console.log(`   ❌ Erreur profil: ${error.message}`);
      }
      
      // Test des statistiques
      try {
        const statsResponse = await fetch(`${BASE_URL}/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statsData = await statsResponse.json();
        if (statsResponse.ok) {
          console.log(`   📈 Statistiques: ${statsData.totalActivities} activités, ${statsData.totalTime} minutes`);
        } else {
          console.log(`   ❌ Erreur stats: ${statsData.message || 'Erreur inconnue'}`);
        }
      } catch (error) {
        console.log(`   ❌ Erreur stats: ${error.message}`);
      }
      
      // Test des activités
      try {
        const activitiesResponse = await fetch(`${BASE_URL}/stats/activities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const activitiesData = await activitiesResponse.json();
        if (activitiesResponse.ok) {
          console.log(`   🎯 Activités: ${activitiesData.length} activités trouvées`);
        } else {
          console.log(`   ❌ Erreur activités: ${activitiesData.message || 'Erreur inconnue'}`);
        }
      } catch (error) {
        console.log(`   ❌ Erreur activités: ${error.message}`);
      }
      
    } else {
      console.log(`❌ Échec de connexion pour ${account.name}: ${loginData.message || 'Erreur inconnue'}`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur réseau pour ${account.name}: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Test de connexion avec les comptes de test...\n');
  
  for (const account of testAccounts) {
    await testConnection(account);
    console.log(''); // Ligne vide pour la lisibilité
  }
  
  console.log('🏁 Tests terminés !');
}

// Vérifier que le serveur est démarré
runTests().catch(console.error); 