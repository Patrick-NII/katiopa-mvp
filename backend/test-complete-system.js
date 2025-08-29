const BASE_URL = 'http://localhost:4000/api';

// Comptes de test avec leurs caractéristiques
const testAccounts = [
  {
    name: 'Emma Martin (PRO - 6 ans)',
    sessionId: 'EMMA_006',
    password: 'password123',
    expectedActivities: 3,
    expectedDomains: ['maths', 'francais', 'sciences']
  },
  {
    name: 'Alex Bernard (PRO_PLUS - 8 ans)',
    sessionId: 'ALEX_008',
    password: 'password123',
    expectedActivities: 3,
    expectedDomains: ['maths', 'history', 'coding']
  },
  {
    name: 'Lucas Dupont (FREE - 5 ans)',
    sessionId: 'LUCAS_005',
    password: 'password123',
    expectedActivities: 2,
    expectedDomains: ['maths', 'francais']
  }
];

async function testCompleteSystem() {
  console.log('🧪 TEST COMPLET DU SYSTÈME KATIOPA\n');
  
  for (const account of testAccounts) {
    console.log(`🔐 Test de ${account.name}...`);
    console.log('=' .repeat(60));
    
    try {
      // 1. Test de connexion
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
      
      // 2. Test du profil utilisateur
      const profileResponse = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log(`📊 Profil: ${profileData.user.firstName} ${profileData.user.lastName}`);
        console.log(`   Type: ${profileData.user.userType}, Âge: ${profileData.user.age}`);
        console.log(`   Niveau: ${profileData.user.grade || 'N/A'}`);
        console.log(`   Abonnement: ${profileData.user.subscriptionType}`);
      } else {
        console.log(`❌ Erreur profil: ${profileResponse.status}`);
      }
      
      // 3. Test des activités
      const activitiesResponse = await fetch(`${BASE_URL}/stats/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (activitiesResponse.ok) {
        const activities = await activitiesResponse.json();
        console.log(`🎯 Activités: ${activities.length} trouvées (attendu: ${account.expectedActivities})`);
        
        if (activities.length === account.expectedActivities) {
          console.log(`✅ Nombre d'activités correct`);
        } else {
          console.log(`⚠️  Nombre d'activités incorrect`);
        }
        
        // Vérifier les domaines
        const domains = [...new Set(activities.map(a => a.domain))];
        console.log(`   Domaines: ${domains.join(', ')}`);
        
        const missingDomains = account.expectedDomains.filter(d => !domains.includes(d));
        if (missingDomains.length === 0) {
          console.log(`✅ Tous les domaines attendus sont présents`);
        } else {
          console.log(`⚠️  Domaines manquants: ${missingDomains.join(', ')}`);
        }
        
        // Analyser les scores et durées
        if (activities.length > 0) {
          const scores = activities.map(a => a.score);
          const durations = activities.map(a => a.durationMs);
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const totalDuration = Math.round(durations.reduce((a, b) => a + b, 0) / 60000);
          
          console.log(`   Score moyen: ${avgScore.toFixed(1)}/100`);
          console.log(`   Durée totale: ${totalDuration} minutes`);
          
          // Vérifier la cohérence des scores
          const invalidScores = scores.filter(s => s < 0 || s > 100);
          if (invalidScores.length === 0) {
            console.log(`✅ Tous les scores sont valides (0-100)`);
          } else {
            console.log(`⚠️  Scores invalides: ${invalidScores.join(', ')}`);
          }
          
          // Vérifier la cohérence des durées
          const invalidDurations = durations.filter(d => d < 0 || d > 3600000);
          if (invalidDurations.length === 0) {
            console.log(`✅ Toutes les durées sont valides (0-60min)`);
          } else {
            console.log(`⚠️  Durées invalides: ${invalidDurations.join(', ')}`);
          }
        }
      } else {
        console.log(`❌ Erreur activités: ${activitiesResponse.status}`);
      }
      
      // 4. Test des statistiques
      const statsResponse = await fetch(`${BASE_URL}/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log(`📈 Statistiques:`);
        console.log(`   Total activités: ${stats.totalActivities}`);
        console.log(`   Temps total: ${stats.totalTime} minutes`);
        console.log(`   Score moyen: ${stats.averageScore}/100`);
        console.log(`   Domaines: ${stats.domains.length}`);
        
        // Vérifier la cohérence avec les activités
        if (stats.totalActivities === account.expectedActivities) {
          console.log(`✅ Total d'activités cohérent`);
        } else {
          console.log(`⚠️  Total d'activités incohérent`);
        }
        
        if (stats.domains.length === account.expectedDomains.length) {
          console.log(`✅ Nombre de domaines cohérent`);
        } else {
          console.log(`⚠️  Nombre de domaines incohérent`);
        }
      } else {
        console.log(`❌ Erreur statistiques: ${statsResponse.status}`);
      }
      
      // 5. Test de l'évaluation IA
      const llmResponse = await fetch(`${BASE_URL}/llm/evaluate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ focus: 'maths' })
      });
      
      if (llmResponse.ok) {
        const llmData = await llmResponse.json();
        console.log(`🤖 Évaluation IA:`);
        console.log(`   Assessment: ${llmData.assessment ? '✅ Présent' : '❌ Manquant'}`);
        console.log(`   Exercices: ${llmData.exercises ? llmData.exercises.length : 0}`);
        
        if (llmData.exercises && llmData.exercises.length > 0) {
          // Vérifier la structure des exercices
          const validExercises = llmData.exercises.filter(ex => 
            ex.title && ex.nodeKey && ex.description
          );
          
          if (validExercises.length === llmData.exercises.length) {
            console.log(`✅ Tous les exercices ont la structure requise`);
          } else {
            console.log(`⚠️  ${llmData.exercises.length - validExercises.length} exercices incomplets`);
          }
          
          // Vérifier les nodeKeys
          const validNodeKeys = validExercises.filter(ex => 
            ex.nodeKey.match(/^(maths|francais|sciences|coding)\..*/)
          );
          
          if (validNodeKeys.length === validExercises.length) {
            console.log(`✅ Tous les nodeKeys sont valides`);
          } else {
            console.log(`⚠️  ${validExercises.length - validNodeKeys.length} nodeKeys invalides`);
          }
        }
      } else {
        console.log(`❌ Erreur évaluation IA: ${llmResponse.status}`);
      }
      
      // 6. Test de création d'activité
      const newActivity = {
        domain: 'maths',
        nodeKey: 'maths.test.new_activity',
        score: 85,
        attempts: 1,
        durationMs: 12000
      };
      
      const createResponse = await fetch(`${BASE_URL}/activity`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newActivity)
      });
      
      if (createResponse.ok) {
        const createdActivity = await createResponse.json();
        console.log(`➕ Nouvelle activité créée:`);
        console.log(`   ID: ${createdActivity.id}`);
        console.log(`   Score: ${createdActivity.score}/100`);
        console.log(`   Durée: ${Math.round(createdActivity.durationMs / 1000)}s`);
        
        // Vérifier que l'activité apparaît dans les statistiques
        const updatedStatsResponse = await fetch(`${BASE_URL}/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (updatedStatsResponse.ok) {
          const updatedStats = await updatedStatsResponse.json();
          const expectedTotal = account.expectedActivities + 1;
          
          if (updatedStats.totalActivities === expectedTotal) {
            console.log(`✅ Statistiques mises à jour correctement`);
          } else {
            console.log(`⚠️  Statistiques non mises à jour: ${updatedStats.totalActivities} vs ${expectedTotal}`);
          }
        }
      } else {
        console.log(`❌ Erreur création activité: ${createResponse.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur pour ${account.name}: ${error.message}`);
    }
    
    console.log(''); // Ligne vide pour la lisibilité
  }
  
  console.log('🏁 Tests terminés !');
}

// Exécuter les tests
testCompleteSystem().catch(console.error);
