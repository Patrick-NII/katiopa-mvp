import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Script de debug pour diagnostiquer la sauvegarde des prompts parents
async function debugParentPromptSave() {
  console.log('🔍 Debug de la sauvegarde des prompts parents...\n');

  try {
    // 1. Vérifier les comptes parents existants
    console.log('📊 Vérification des comptes parents...');
    
    const parentAccounts = await prisma.account.findMany({
      where: {
        userSessions: {
          some: {
            userType: 'PARENT'
          }
        }
      },
      include: {
        userSessions: {
          where: {
            userType: 'PARENT'
          }
        }
      }
    });

    console.log(`✅ ${parentAccounts.length} comptes parents trouvés`);

    if (parentAccounts.length === 0) {
      console.log('❌ Aucun compte parent trouvé');
      return;
    }

    const testAccount = parentAccounts[0];
    const parentSession = testAccount.userSessions[0];
    
    console.log(`👨‍👩‍👧‍👦 Compte test: ${testAccount.email}`);
    console.log(`👤 Parent: ${parentSession.firstName} ${parentSession.lastName}`);
    console.log(`🆔 Parent Session ID: ${parentSession.id}`);

    // 2. Vérifier les enfants du compte
    console.log('\n👶 Vérification des enfants...');
    
    const children = await prisma.userSession.findMany({
      where: {
        accountId: testAccount.id,
        userType: 'CHILD'
      }
    });

    console.log(`✅ ${children.length} enfants trouvés`);
    
    if (children.length === 0) {
      console.log('❌ Aucun enfant trouvé pour ce compte');
      return;
    }

    const testChild = children[0];
    console.log(`👶 Enfant test: ${testChild.firstName} ${testChild.lastName}`);
    console.log(`🆔 Child Session ID: ${testChild.id}`);

    // 3. Vérifier les prompts existants
    console.log('\n📝 Vérification des prompts existants...');
    
    const existingPrompts = await prisma.parentPrompt.findMany({
      where: {
        accountId: testAccount.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`📊 ${existingPrompts.length} prompts existants trouvés`);
    
    if (existingPrompts.length > 0) {
      console.log('\n📋 Derniers prompts:');
      existingPrompts.forEach((prompt, index) => {
        console.log(`${index + 1}. "${prompt.content.substring(0, 50)}..."`);
        console.log(`   Type: ${prompt.promptType}`);
        console.log(`   Status: ${prompt.status}`);
        console.log(`   Date: ${new Date(prompt.createdAt).toLocaleString('fr-FR')}`);
        console.log('');
      });
    }

    // 4. Tester la fonction de détection de type
    console.log('🧠 Test de la fonction de détection de type...');
    
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

    // Test avec le prompt de l'utilisateur
    const testPrompt = "je souhaiterais que Emma passe plus de temps sur CubeMatch";
    const detectedType = detectPromptType(testPrompt);
    
    console.log(`📝 Test prompt: "${testPrompt}"`);
    console.log(`🎯 Type détecté: ${detectedType}`);

    // 5. Tester la sauvegarde manuelle
    console.log('\n💾 Test de sauvegarde manuelle...');
    
    try {
      const savedPrompt = await prisma.parentPrompt.create({
        data: {
          content: testPrompt,
          processedContent: testPrompt,
          aiResponse: "Test de réponse automatique pour debug",
          promptType: detectedType,
          status: 'PROCESSED',
          parentSessionId: parentSession.id,
          childSessionId: testChild.id,
          accountId: testAccount.id
        }
      });

      console.log(`✅ Prompt sauvegardé avec succès !`);
      console.log(`🆔 ID: ${savedPrompt.id}`);
      console.log(`📅 Date: ${new Date(savedPrompt.createdAt).toLocaleString('fr-FR')}`);

      // 6. Vérifier que le prompt est bien enregistré
      console.log('\n🔍 Vérification de la sauvegarde...');
      
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
        console.log(`✅ Prompt vérifié dans la base de données`);
        console.log(`👤 Parent: ${verifyPrompt.parentSession.firstName} ${verifyPrompt.parentSession.lastName}`);
        console.log(`👶 Enfant: ${verifyPrompt.childSession.firstName} ${verifyPrompt.childSession.lastName}`);
        console.log(`📝 Contenu: "${verifyPrompt.content}"`);
        console.log(`🎯 Type: ${verifyPrompt.promptType}`);
        console.log(`📊 Status: ${verifyPrompt.status}`);
      } else {
        console.log('❌ Prompt non trouvé après sauvegarde');
      }

    } catch (saveError) {
      console.error('❌ Erreur lors de la sauvegarde manuelle:', saveError);
      
      // Afficher les détails de l'erreur
      if (saveError.code) {
        console.log(`🔍 Code d'erreur: ${saveError.code}`);
      }
      if (saveError.meta) {
        console.log(`🔍 Métadonnées:`, saveError.meta);
      }
    }

    // 7. Vérifier la structure de la table
    console.log('\n🗄️ Vérification de la structure de la table...');
    
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'parent_prompts' 
        ORDER BY ordinal_position
      `;
      
      console.log('📋 Structure de la table parent_prompts:');
      tableInfo.forEach(column => {
        console.log(`   ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
      });
    } catch (structureError) {
      console.error('❌ Erreur lors de la vérification de la structure:', structureError);
    }

    console.log('\n' + '=' .repeat(70));
    console.log('🔍 DIAGNOSTIC TERMINÉ');
    console.log('=' .repeat(70));
    console.log('');
    console.log('📋 Points à vérifier :');
    console.log('   1. ✅ Comptes parents existants');
    console.log('   2. ✅ Enfants associés');
    console.log('   3. ✅ Fonction de détection de type');
    console.log('   4. ✅ Sauvegarde manuelle');
    console.log('   5. ✅ Structure de la table');
    console.log('');
    console.log('🎯 Prochaines étapes :');
    console.log('   - Vérifier les logs du frontend pour les erreurs');
    console.log('   - Tester la sauvegarde via l\'API frontend');
    console.log('   - Vérifier les permissions de la base de données');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('❌ Erreur générale du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugParentPromptSave().catch(console.error);
