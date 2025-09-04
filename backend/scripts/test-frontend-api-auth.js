import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Test avec authentification réelle
async function testFrontendAPIWithAuth() {
  console.log('🔍 Test de l\'API frontend avec authentification...\n');

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
    console.log(`🆔 Parent ID: ${parentSession.id}`);

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

    console.log(`🔐 Token JWT créé: ${token.substring(0, 50)}...`);

    // 3. Tester l'API avec le token valide
    console.log('\n📡 Test de l\'API avec authentification...');
    
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
            content: 'je souhaiterais que Emma passe plus de temps sur CubeMatch'
          }
        ],
        persona: 'pro'
      })
    });

    const data = await response.json();
    
    console.log('📊 Réponse de l\'API frontend:');
    console.log(`✅ Status: ${response.status}`);
    console.log(`📝 Réponse: ${data.text?.substring(0, 100)}...`);
    console.log(`🎫 Model: ${data.model}`);
    console.log(`👤 UserInfo: ${data.userInfo?.name}`);
    console.log(`🎫 UserType: ${data.userInfo?.userType}`);
    console.log(`🔒 SubscriptionType: ${data.userInfo?.subscriptionType}`);

    // 4. Vérifier si le prompt a été sauvegardé
    console.log('\n🔍 Vérification de la sauvegarde...');
    
    const recentPrompts = await prisma.parentPrompt.findMany({
      where: {
        accountId: parentSession.accountId,
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 1000) // Prompts des 2 dernières minutes
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });

    if (recentPrompts.length > 0) {
      const latestPrompt = recentPrompts[0];
      console.log('✅ Prompt sauvegardé trouvé !');
      console.log(`🆔 ID: ${latestPrompt.id}`);
      console.log(`📝 Contenu: "${latestPrompt.content}"`);
      console.log(`🎯 Type: ${latestPrompt.promptType}`);
      console.log(`📊 Status: ${latestPrompt.status}`);
      console.log(`📅 Date: ${new Date(latestPrompt.createdAt).toLocaleString('fr-FR')}`);
    } else {
      console.log('❌ Aucun prompt récent trouvé');
      console.log('🔍 Vérification des prompts plus anciens...');
      
      const allPrompts = await prisma.parentPrompt.findMany({
        where: {
          accountId: parentSession.accountId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3
      });
      
      console.log(`📊 ${allPrompts.length} prompts trouvés au total`);
      allPrompts.forEach((prompt, index) => {
        console.log(`${index + 1}. "${prompt.content.substring(0, 50)}..." - ${new Date(prompt.createdAt).toLocaleString('fr-FR')}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API frontend:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendAPIWithAuth().catch(console.error);
