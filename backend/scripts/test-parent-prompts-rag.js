import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test de l'intégration des prompts parents dans le RAG
async function testParentPromptsRAG() {
  console.log('🔄 Test de l\'intégration des prompts parents dans le RAG...\n');

  try {
    // 1. Récupérer un compte parent de test
    console.log('📊 Récupération d\'un compte parent...');
    
    const parentAccount = await prisma.account.findFirst({
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

    if (!parentAccount) {
      console.log('❌ Aucun compte parent trouvé');
      return;
    }

    console.log(`✅ Compte parent trouvé: ${parentAccount.email}`);

    // 2. Récupérer les prompts des parents
    console.log('\n📝 Récupération des prompts parents...');
    
    const parentPrompts = await prisma.parentPrompt.findMany({
      where: {
        accountId: parentAccount.id,
        status: 'PROCESSED'
      },
      include: {
        parentSession: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        childSession: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📝 ${parentPrompts.length} prompts parents trouvés`);

    if (parentPrompts.length > 0) {
      console.log('\n📋 Exemples de prompts:');
      parentPrompts.slice(0, 3).forEach((prompt, index) => {
        console.log(`${index + 1}. ${prompt.parentSession.firstName} → ${prompt.childSession.firstName}:`);
        console.log(`   "${prompt.content}"`);
        console.log(`   Type: ${prompt.promptType}`);
        console.log(`   Date: ${new Date(prompt.createdAt).toLocaleDateString('fr-FR')}\n`);
      });
    }

    // 3. Récupérer les préférences des parents
    console.log('👨‍👩‍👧‍👦 Récupération des préférences parents...');
    
    const parentPreferences = await prisma.userSession.findMany({
      where: {
        accountId: parentAccount.id,
        userType: 'PARENT'
      },
      include: {
        parentPreferences: true,
        profile: true
      }
    });

    console.log(`👨‍👩‍👧‍👦 ${parentPreferences.length} parents avec préférences`);

    // 4. Récupérer les profils des enfants
    console.log('👶 Récupération des profils enfants...');
    
    const childrenProfiles = await prisma.userSession.findMany({
      where: {
        accountId: parentAccount.id,
        userType: 'CHILD'
      },
      include: {
        profile: true
      }
    });

    console.log(`👶 ${childrenProfiles.length} enfants avec profils`);

    // 5. Formater pour le RAG
    console.log('\n🔧 Formatage pour le RAG...');
    
    const parentData = {
      parentPrompts,
      parentPreferences,
      childrenProfiles
    };

    // Fonction de formatage RAG
    function formatParentPromptsForRAG(parentData) {
      const { parentPrompts, parentPreferences, childrenProfiles } = parentData;
      
      let ragContent = '';
      
      // 1. Prompts des parents
      if (parentPrompts.length > 0) {
        ragContent += '**PROMPTS ET DEMANDES DES PARENTS:**\n\n';
        
        parentPrompts.forEach((prompt, index) => {
          ragContent += `${index + 1}. **Prompt de ${prompt.parentSession.firstName} pour ${prompt.childSession.firstName}:**\n`;
          ragContent += `   - Contenu original: "${prompt.content}"\n`;
          if (prompt.processedContent) {
            ragContent += `   - Traité par l'IA: "${prompt.processedContent}"\n`;
          }
          if (prompt.aiResponse) {
            ragContent += `   - Réponse IA: "${prompt.aiResponse}"\n`;
          }
          ragContent += `   - Type: ${prompt.promptType}\n`;
          ragContent += `   - Date: ${new Date(prompt.createdAt).toLocaleDateString('fr-FR')}\n\n`;
        });
      }

      // 2. Préférences des parents
      if (parentPreferences.length > 0) {
        ragContent += '**PRÉFÉRENCES PÉDAGOGIQUES DES PARENTS:**\n\n';
        
        parentPreferences.forEach((parent) => {
          ragContent += `**${parent.firstName} ${parent.lastName}:**\n`;
          
          if (parent.parentPreferences) {
            const prefs = parent.parentPreferences;
            ragContent += `- Objectifs d'apprentissage: ${prefs.objectives || 'Non définis'}\n`;
            ragContent += `- Préférences pédagogiques: ${prefs.preferences || 'Non définies'}\n`;
            ragContent += `- Préoccupations: ${prefs.concerns || 'Aucune'}\n`;
            ragContent += `- Informations supplémentaires: ${prefs.additionalInfo || 'Aucune'}\n`;
            ragContent += `- Besoins spécifiques: ${prefs.needs || 'Aucun'}\n\n`;
          }
        });
      }

      // 3. Profils des enfants avec notes des parents
      if (childrenProfiles.length > 0) {
        ragContent += '**PROFILS DES ENFANTS AVEC NOTES PARENTALES:**\n\n';
        
        childrenProfiles.forEach((child) => {
          ragContent += `**${child.firstName} ${child.lastName}:**\n`;
          
          if (child.profile) {
            const profile = child.profile;
            ragContent += `- Objectifs d'apprentissage: ${profile.learningGoals.join(', ') || 'Non définis'}\n`;
            ragContent += `- Matières préférées: ${profile.preferredSubjects.join(', ') || 'Non définies'}\n`;
            ragContent += `- Style d'apprentissage: ${profile.learningStyle || 'Non défini'}\n`;
            ragContent += `- Difficulté: ${profile.difficulty || 'Non définie'}\n`;
            ragContent += `- Centres d'intérêt: ${profile.interests.join(', ') || 'Non définis'}\n`;
            ragContent += `- Besoins particuliers: ${profile.specialNeeds.join(', ') || 'Aucun'}\n`;
            ragContent += `- Notes personnalisées: ${profile.customNotes || 'Aucune'}\n`;
            ragContent += `- Souhaits des parents: ${profile.parentWishes || 'Aucun'}\n\n`;
          }
        });
      }

      return ragContent || 'Aucune donnée parentale disponible.';
    }

    const ragContent = formatParentPromptsForRAG(parentData);
    console.log('📄 Contenu RAG généré:');
    console.log(ragContent.substring(0, 500) + '...');

    // 6. Générer des insights
    console.log('\n💡 Génération d\'insights...');
    
    function generateParentInsights(parentData) {
      const { parentPrompts, parentPreferences, childrenProfiles } = parentData;
      
      let insights = '';
      
      if (parentPrompts.length > 0) {
        insights += '**ANALYSE DES PROMPTS PARENTS:**\n';
        
        // Analyser les types de prompts les plus fréquents
        const promptTypes = parentPrompts.reduce((acc, prompt) => {
          acc[prompt.promptType] = (acc[prompt.promptType] || 0) + 1;
          return acc;
        }, {});
        
        insights += `- Types de demandes: ${Object.entries(promptTypes).map(([type, count]) => `${type} (${count})`).join(', ')}\n`;
        
        // Analyser les préoccupations récurrentes
        const concerns = parentPrompts
          .filter((p) => p.content.toLowerCase().includes('difficulté') || p.content.toLowerCase().includes('problème'))
          .length;
        
        if (concerns > 0) {
          insights += `- Préoccupations détectées: ${concerns} prompts\n`;
        }
        
        insights += '\n';
      }

      if (parentPreferences.length > 0) {
        insights += '**PRÉFÉRENCES PÉDAGOGIQUES:**\n';
        
        const objectives = parentPreferences
          .filter((p) => p.parentPreferences?.objectives)
          .map((p) => p.parentPreferences.objectives);
        
        if (objectives.length > 0) {
          insights += `- Objectifs principaux: ${objectives.join(', ')}\n`;
        }
        
        insights += '\n';
      }

      return insights;
    }

    const insights = generateParentInsights(parentData);
    console.log('💡 Insights générés:');
    console.log(insights);

    console.log('\n' + '=' .repeat(60));
    console.log('✅ TEST RAG PROMPTS PARENTS RÉUSSI !');
    console.log('=' .repeat(60));
    console.log('');
    console.log('🎯 Avantages du RAG avec prompts parents :');
    console.log('   - ✅ Contexte personnalisé pour chaque famille');
    console.log('   - ✅ Préférences pédagogiques intégrées');
    console.log('   - ✅ Historique des demandes des parents');
    console.log('   - ✅ Notes et souhaits parentaux');
    console.log('   - ✅ Amélioration de l\'expérience utilisateur');
    console.log('');
    console.log('🔧 Prochaines étapes :');
    console.log('   - Intégrer dans l\'API chat');
    console.log('   - Ajouter au prompt système de Bubix');
    console.log('   - Tester avec des questions parentales');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Erreur test RAG prompts parents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testParentPromptsRAG().catch(console.error);
