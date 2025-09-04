import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Test de contextualisation améliorée
async function testImprovedContextualization() {
  console.log('🧠 Test de contextualisation améliorée...\n');

  try {
    // 1. Récupérer un parent de test
    console.log('👤 Récupération d\'un parent de test...');
    
    const parentSession = await prisma.userSession.findFirst({
      where: {
        userType: 'PARENT'
      },
      include: {
        account: true
      }
    });

    if (!parentSession) {
      console.log('❌ Aucun parent trouvé');
      return;
    }

    console.log(`✅ Parent trouvé: ${parentSession.firstName} ${parentSession.lastName}`);

    // 2. Créer un token JWT valide
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        userId: parentSession.id,
        accountId: parentSession.accountId,
        email: parentSession.account.email,
        userType: parentSession.userType
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 3. Tester avec des questions spécifiques
    const testQuestions = [
      "je souhaiterais que Emma passe plus de temps sur CubeMatch",
      "je souhaite que tu propose a emma plus de soustraction, elle n'aiment pas vraiment cela et preferes faire autre chose au moment de faire ces devoirs de maths",
      "Comment va Emma en mathématiques ?",
      "Quelles sont les forces d'Emma ?",
      "Que recommandes-tu pour améliorer les résultats d'Emma ?"
    ];

    console.log('📝 Test des questions de contextualisation...\n');

    for (const question of testQuestions) {
      console.log(`🔍 Question: "${question}"`);
      
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: question
            }
          ],
          persona: 'pro'
        })
      });

      const data = await response.json();
      
      console.log(`📊 Réponse: ${data.text?.substring(0, 150)}...`);
      
      // Analyser la réponse pour la contextualisation
      const responseText = data.text?.toLowerCase() || '';
      const hasSpecificData = responseText.includes('emma') || responseText.includes('score') || responseText.includes('activité');
      const hasNumbers = /\d+/.test(responseText);
      const hasRecommendations = responseText.includes('recommand') || responseText.includes('suggér');
      
      console.log(`✅ Contextualisation: ${hasSpecificData ? 'OUI' : 'NON'}`);
      console.log(`📊 Données chiffrées: ${hasNumbers ? 'OUI' : 'NON'}`);
      console.log(`💡 Recommandations: ${hasRecommendations ? 'OUI' : 'NON'}`);
      console.log('');
    }

    // 4. Vérifier les prompts sauvegardés
    console.log('🔍 Vérification des prompts sauvegardés...');
    
    const recentPrompts = await prisma.parentPrompt.findMany({
      where: {
        accountId: parentSession.accountId,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Prompts des 10 dernières minutes
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📝 ${recentPrompts.length} prompts récents trouvés`);
    
    if (recentPrompts.length > 0) {
      console.log('\n📋 Derniers prompts:');
      recentPrompts.forEach((prompt, index) => {
        console.log(`${index + 1}. "${prompt.content}"`);
        console.log(`   Type: ${prompt.promptType}`);
        console.log(`   Date: ${new Date(prompt.createdAt).toLocaleString('fr-FR')}`);
        console.log('');
      });
    }

    console.log('=' .repeat(70));
    console.log('🧠 TEST DE CONTEXTUALISATION TERMINÉ');
    console.log('=' .repeat(70));
    console.log('');
    console.log('📋 Améliorations apportées :');
    console.log('   ✅ Formatage détaillé des données enfants');
    console.log('   ✅ Analyse par domaine avec tendances');
    console.log('   ✅ Intégration des données CubeMatch');
    console.log('   ✅ Recommandations personnalisées');
    console.log('   ✅ Instructions de contextualisation');
    console.log('   ✅ Exemples de réponses contextualisées');
    console.log('');
    console.log('🎯 Résultats attendus :');
    console.log('   - Réponses avec données chiffrées spécifiques');
    console.log('   - Mentions des domaines forts/faibles');
    console.log('   - Recommandations basées sur les données');
    console.log('   - Utilisation de l\'historique parent');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('❌ Erreur lors du test de contextualisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImprovedContextualization().catch(console.error);
