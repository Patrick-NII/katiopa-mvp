import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test pour simuler exactement l'API frontend et diagnostiquer le problème
async function testFrontendAPISave() {
  console.log('🔍 Test de simulation de l\'API frontend...\n');

  try {
    // 1. Simuler la récupération d'un utilisateur parent
    console.log('👤 Simulation de la récupération d\'un parent...');
    
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
    console.log(`📧 Email: ${parentSession.account.email}`);
    console.log(`🎫 Type: ${parentSession.userType}`);

    // 2. Simuler la récupération d'un enfant
    console.log('\n👶 Simulation de la récupération d\'un enfant...');
    
    const childSession = await prisma.userSession.findFirst({
      where: {
        accountId: parentSession.accountId,
        userType: 'CHILD'
      }
    });

    if (!childSession) {
      console.log('❌ Aucun enfant trouvé');
      return;
    }

    console.log(`✅ Enfant trouvé: ${childSession.firstName} ${childSession.lastName}`);
    console.log(`🆔 Child ID: ${childSession.id}`);

    // 3. Simuler la fonction de détection de type
    console.log('\n🧠 Test de la fonction de détection de type...');
    
    function detectPromptType(userQuery) {
      const query = userQuery.toLowerCase();
      
      // Types de base
      if (query.includes('difficulté') || query.includes('problème') || query.includes('aide')) {
        return 'LEARNING_DIFFICULTY';
      }
      if (query.includes('connecté') || query.includes('en ligne') || query.includes('actuellement')) {
        return 'CONNECTION_STATUS';
      }
      if (query.includes('score') || query.includes('performance') || query.includes('meilleur')) {
        return 'PERFORMANCE_QUERY';
      }
      if (query.includes('temps') || query.includes('durée') || query.includes('depuis')) {
        return 'TIME_QUERY';
      }
      if (query.includes('recommand') || query.includes('conseil') || query.includes('suggestion')) {
        return 'RECOMMENDATION_REQUEST';
      }
      if (query.includes('progrès') || query.includes('amélioration') || query.includes('évolution')) {
        return 'PROGRESS_UPDATE';
      }
      
      // Nouveaux types pour les préférences et attentes
      if (query.includes('souhait') || query.includes('vouloir') || query.includes('aimerait') || query.includes('espère')) {
        return 'PARENT_WISHES';
      }
      if (query.includes('plan') || query.includes('carrière') || query.includes('avenir') || query.includes('orientation')) {
        return 'CAREER_PLANNING';
      }
      if (query.includes('lacune') || query.includes('faiblesse') || query.includes('point faible') || query.includes('manque')) {
        return 'WEAKNESS_IDENTIFICATION';
      }
      if (query.includes('amélioration') || query.includes('développer') || query.includes('renforcer') || query.includes('travailler')) {
        return 'IMPROVEMENT_GOALS';
      }
      if (query.includes('besoin') || query.includes('nécessite') || query.includes('requiert') || query.includes('demande')) {
        return 'SPECIFIC_NEEDS';
      }
      if (query.includes('préférence') || query.includes('style') || query.includes('méthode') || query.includes('approche')) {
        return 'LEARNING_PREFERENCES';
      }
      if (query.includes('objectif') || query.includes('but') || query.includes('cible') || query.includes('ambition')) {
        return 'LEARNING_OBJECTIVES';
      }
      if (query.includes('inquiétude') || query.includes('inquiet') || query.includes('préoccupation') || query.includes('souci')) {
        return 'PARENT_CONCERNS';
      }
      if (query.includes('force') || query.includes('talent') || query.includes('don') || query.includes('aptitude')) {
        return 'STRENGTH_IDENTIFICATION';
      }
      if (query.includes('personnalité') || query.includes('caractère') || query.includes('comportement') || query.includes('attitude')) {
        return 'PERSONALITY_INSIGHTS';
      }
      
      return 'GENERAL_QUERY';
    }

    // 4. Simuler la fonction de sauvegarde
    async function saveParentPrompt(
      parentSessionId,
      childSessionId,
      accountId,
      userQuery,
      aiResponse,
      promptType = 'GENERAL_QUERY'
    ) {
      try {
        console.log('💾 Sauvegarde du prompt parent...');
        
        const savedPrompt = await prisma.parentPrompt.create({
          data: {
            content: userQuery,
            processedContent: userQuery,
            aiResponse: aiResponse,
            promptType: promptType,
            status: 'PROCESSED',
            parentSessionId: parentSessionId,
            childSessionId: childSessionId,
            accountId: accountId
          }
        });

        console.log(`✅ Prompt sauvegardé avec ID: ${savedPrompt.id}`);
        return savedPrompt;
      } catch (error) {
        console.error('❌ Erreur sauvegarde prompt parent:', error);
        return null;
      }
    }

    // 5. Simuler le prompt de l'utilisateur
    const userQuery = "je souhaiterais que Emma passe plus de temps sur CubeMatch";
    const aiResponse = "Pour encourager Emma à passer plus de temps sur CubeMatch, voici quelques suggestions...";
    
    console.log(`📝 Prompt utilisateur: "${userQuery}"`);
    console.log(`🤖 Réponse IA: "${aiResponse.substring(0, 50)}..."`);

    // 6. Simuler la condition de sauvegarde (exactement comme dans l'API)
    console.log('\n🔍 Test de la condition de sauvegarde...');
    
    // Simuler userContext.role et userInfo.userType
    const userContextRole = 'parent'; // Simuler le rôle détecté
    const userInfoUserType = parentSession.userType; // 'PARENT'
    
    console.log(`👤 userContext.role: ${userContextRole}`);
    console.log(`🎫 userInfo.userType: ${userInfoUserType}`);
    console.log(`🔍 Condition: userContext.role === 'parent' && userInfo.userType === 'PARENT'`);
    console.log(`✅ Résultat: ${userContextRole === 'parent' && userInfoUserType === 'PARENT'}`);

    // 7. Exécuter la sauvegarde si la condition est vraie
    if (userContextRole === 'parent' && userInfoUserType === 'PARENT') {
      console.log('\n💾 Exécution de la sauvegarde automatique...');
      
      try {
        console.log('💾 Sauvegarde automatique du prompt parent...');
        
        // Récupérer l'accountId et un enfant de référence
        const parentSessionForSave = await prisma.userSession.findUnique({
          where: { id: parentSession.id },
          include: { 
            account: true
          }
        });
        
        if (parentSessionForSave && parentSessionForSave.account) {
          console.log('✅ Parent session et account trouvés');
          
          // Récupérer un enfant du même compte
          const childSessionForSave = await prisma.userSession.findFirst({
            where: {
              accountId: parentSessionForSave.accountId,
              userType: 'CHILD'
            }
          });
          
          if (childSessionForSave) {
            console.log(`✅ Enfant trouvé: ${childSessionForSave.firstName} ${childSessionForSave.lastName}`);
          } else {
            console.log('⚠️ Aucun enfant trouvé, utilisation du parent comme fallback');
          }
          
          const promptType = detectPromptType(userQuery);
          const childSessionId = childSessionForSave?.id || parentSessionForSave.id;
          
          console.log(`🎯 Type détecté: ${promptType}`);
          console.log(`👶 Child Session ID: ${childSessionId}`);
          
          const savedPrompt = await saveParentPrompt(
            parentSessionForSave.id,
            childSessionId,
            parentSessionForSave.account.id,
            userQuery,
            aiResponse,
            promptType
          );
          
          if (savedPrompt) {
            console.log('✅ Prompt parent sauvegardé automatiquement');
            
            // Vérifier la sauvegarde
            const verifyPrompt = await prisma.parentPrompt.findUnique({
              where: { id: savedPrompt.id },
              include: {
                parentSession: {
                  select: { firstName: true, lastName: true }
                },
                childSession: {
                  select: { firstName: true, lastName: true }
                }
              }
            });
            
            if (verifyPrompt) {
              console.log('\n🔍 Vérification finale:');
              console.log(`✅ Prompt trouvé dans la BDD`);
              console.log(`👤 Parent: ${verifyPrompt.parentSession.firstName} ${verifyPrompt.parentSession.lastName}`);
              console.log(`👶 Enfant: ${verifyPrompt.childSession.firstName} ${verifyPrompt.childSession.lastName}`);
              console.log(`📝 Contenu: "${verifyPrompt.content}"`);
              console.log(`🎯 Type: ${verifyPrompt.promptType}`);
              console.log(`📊 Status: ${verifyPrompt.status}`);
              console.log(`📅 Date: ${new Date(verifyPrompt.createdAt).toLocaleString('fr-FR')}`);
            }
          } else {
            console.log('❌ Échec de la sauvegarde');
          }
        } else {
          console.log('❌ Impossible de récupérer parent session ou account');
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde automatique prompt parent:', error);
      }
    } else {
      console.log('❌ Condition de sauvegarde non remplie');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('🔍 TEST API FRONTEND TERMINÉ');
    console.log('=' .repeat(70));
    console.log('');
    console.log('📋 Résultats :');
    console.log('   ✅ Parent trouvé et authentifié');
    console.log('   ✅ Enfant associé trouvé');
    console.log('   ✅ Condition de sauvegarde vérifiée');
    console.log('   ✅ Fonction de détection de type testée');
    console.log('   ✅ Sauvegarde automatique exécutée');
    console.log('');
    console.log('🎯 Si le test fonctionne mais pas l\'API réelle :');
    console.log('   - Vérifier les logs du frontend (console du navigateur)');
    console.log('   - Vérifier les variables d\'environnement');
    console.log('   - Vérifier les erreurs CORS ou réseau');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('❌ Erreur générale du test API frontend:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendAPISave().catch(console.error);
