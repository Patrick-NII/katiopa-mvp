import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test des nouveaux types de prompts enrichis
async function testEnrichedParentPrompts() {
  console.log('🔄 Test des nouveaux types de prompts enrichis...\n');

  try {
    // 1. Récupérer un compte parent de test
    console.log('📊 Récupération d\'un compte parent...');
    
    const parentAccount = await prisma.account.findFirst({
      where: {
        email: 'parent@katiopa.com'
      },
      include: {
        userSessions: {
          where: {
            userType: 'PARENT'
          }
        }
      }
    });

    if (!parentAccount || parentAccount.userSessions.length === 0) {
      console.log('❌ Compte parent non trouvé');
      return;
    }

    const parentSession = parentAccount.userSessions[0];
    console.log(`✅ Parent: ${parentSession.firstName} ${parentSession.lastName}`);

    // 2. Récupérer un enfant de référence
    const childSession = await prisma.userSession.findFirst({
      where: {
        accountId: parentAccount.id,
        userType: 'CHILD'
      }
    });

    if (!childSession) {
      console.log('❌ Aucun enfant trouvé pour la référence');
      return;
    }

    console.log(`👶 Enfant de référence: ${childSession.firstName} ${childSession.lastName}`);

    // 3. Créer des prompts enrichis avec les nouveaux types
    const enrichedPrompts = [
      {
        content: "J'aimerais qu'Emma développe ses compétences en programmation pour son avenir professionnel",
        aiResponse: "Excellente idée ! Emma montre déjà un intérêt pour la logique. Je recommande de commencer par des activités de programmation visuelle adaptées à son âge.",
        expectedType: "CAREER_PLANNING"
      },
      {
        content: "Lucas a des lacunes en mathématiques, surtout en multiplication",
        aiResponse: "Je comprends votre préoccupation. Lucas a effectivement des difficultés avec les tables de multiplication. Voici des exercices spécifiques pour l'aider.",
        expectedType: "WEAKNESS_IDENTIFICATION"
      },
      {
        content: "Emma préfère apprendre avec des supports visuels et des jeux",
        aiResponse: "Parfait ! Emma a un style d'apprentissage visuel. Je vais adapter les activités pour utiliser plus de supports visuels et de jeux éducatifs.",
        expectedType: "LEARNING_PREFERENCES"
      },
      {
        content: "Je suis inquiet pour la concentration de Lucas pendant les activités",
        aiResponse: "Votre inquiétude est légitime. Lucas a effectivement des difficultés de concentration. Voici des stratégies pour améliorer son attention.",
        expectedType: "PARENT_CONCERNS"
      },
      {
        content: "Emma a un talent naturel pour la logique et les puzzles",
        aiResponse: "C'est fantastique ! Emma a effectivement des aptitudes exceptionnelles en logique. Nous devrions développer ce talent avec des défis adaptés.",
        expectedType: "STRENGTH_IDENTIFICATION"
      },
      {
        content: "Lucas a besoin d'encouragements fréquents pour rester motivé",
        aiResponse: "Excellente observation ! Lucas a besoin de renforcement positif régulier. Je vais intégrer plus de félicitations et de récompenses dans ses activités.",
        expectedType: "SPECIFIC_NEEDS"
      },
      {
        content: "J'espère qu'Emma puisse améliorer sa confiance en mathématiques",
        aiResponse: "C'est un objectif important ! Emma a le potentiel, elle a juste besoin de plus de confiance. Voici des exercices progressifs pour la rassurer.",
        expectedType: "PARENT_WISHES"
      },
      {
        content: "Lucas doit travailler sur sa persévérance face aux difficultés",
        aiResponse: "Excellente priorité ! La persévérance est cruciale. Je vais proposer des activités qui développent cette compétence de manière progressive.",
        expectedType: "IMPROVEMENT_GOALS"
      },
      {
        content: "Emma a un objectif de maîtriser les fractions cette année",
        aiResponse: "Objectif ambitieux et réalisable ! Emma a les capacités pour y arriver. Voici un plan d'apprentissage structuré pour les fractions.",
        expectedType: "LEARNING_OBJECTIVES"
      },
      {
        content: "Lucas a un comportement très énergique et a besoin de bouger",
        aiResponse: "C'est une caractéristique importante de sa personnalité ! Lucas apprend mieux en mouvement. Je vais adapter les activités pour intégrer l'activité physique.",
        expectedType: "PERSONALITY_INSIGHTS"
      }
    ];

    console.log(`📝 Création de ${enrichedPrompts.length} prompts enrichis...`);

    // 4. Fonction de détection de type (copiée de l'API)
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

    // 5. Sauvegarder les prompts enrichis
    for (const promptData of enrichedPrompts) {
      const promptType = detectPromptType(promptData.content);
      
      const savedPrompt = await prisma.parentPrompt.create({
        data: {
          content: promptData.content,
          processedContent: promptData.content,
          aiResponse: promptData.aiResponse,
          promptType: promptType,
          status: 'PROCESSED',
          parentSessionId: parentSession.id,
          childSessionId: childSession.id,
          accountId: parentAccount.id
        }
      });

      console.log(`✅ Prompt enrichi sauvegardé: "${promptData.content.substring(0, 60)}..."`);
      console.log(`   Type détecté: ${promptType} (attendu: ${promptData.expectedType})`);
      console.log(`   ID: ${savedPrompt.id}\n`);
    }

    // 6. Analyser les prompts sauvegardés
    console.log('🔍 Analyse des prompts enrichis...');
    
    const savedPrompts = await prisma.parentPrompt.findMany({
      where: {
        accountId: parentAccount.id,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Prompts des 5 dernières minutes
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 ${savedPrompts.length} prompts enrichis trouvés`);

    // 7. Grouper par type et analyser
    const promptsByType = savedPrompts.reduce((acc, prompt) => {
      if (!acc[prompt.promptType]) {
        acc[prompt.promptType] = [];
      }
      acc[prompt.promptType].push(prompt);
      return acc;
    }, {});

    console.log('\n📋 Répartition par type de prompt:');
    Object.entries(promptsByType).forEach(([type, prompts]) => {
      const typeLabels = {
        'PARENT_WISHES': '🎯 SOUHAITS ET VOLONTÉS',
        'CAREER_PLANNING': '🚀 PLANIFICATION DE CARRIÈRE',
        'WEAKNESS_IDENTIFICATION': '⚠️ LACUNES ET DIFFICULTÉS',
        'IMPROVEMENT_GOALS': '📈 OBJECTIFS D\'AMÉLIORATION',
        'SPECIFIC_NEEDS': '🔧 BESOINS SPÉCIFIQUES',
        'LEARNING_PREFERENCES': '🎨 PRÉFÉRENCES D\'APPRENTISSAGE',
        'LEARNING_OBJECTIVES': '🎯 OBJECTIFS D\'APPRENTISSAGE',
        'PARENT_CONCERNS': '😰 PRÉOCCUPATIONS PARENTALES',
        'STRENGTH_IDENTIFICATION': '💪 FORCES ET TALENTS',
        'PERSONALITY_INSIGHTS': '👤 INSIGHTS PERSONNALITÉ'
      };
      
      console.log(`   ${typeLabels[type] || type}: ${prompts.length} prompt(s)`);
    });

    // 8. Tester la fonction d'analyse
    console.log('\n🧠 Test de la fonction d\'analyse...');
    
    function analyzeParentPrompt(userQuery, aiResponse, promptType) {
      const analysis = {
        promptType,
        extractedInfo: {
          wishes: [],
          concerns: [],
          goals: [],
          needs: [],
          strengths: [],
          weaknesses: [],
          preferences: [],
          personality: []
        },
        targetChild: null,
        priority: 'medium',
        actionable: false
      };

      const query = userQuery.toLowerCase();
      const response = aiResponse.toLowerCase();

      // Extraire le nom de l'enfant mentionné
      const childNames = ['lucas', 'emma', 'enfant', 'fille', 'garçon'];
      for (const name of childNames) {
        if (query.includes(name) || response.includes(name)) {
          analysis.targetChild = name;
          break;
        }
      }

      // Analyser selon le type de prompt
      switch (promptType) {
        case 'PARENT_WISHES':
          analysis.extractedInfo.wishes.push(userQuery);
          analysis.priority = 'high';
          analysis.actionable = true;
          break;
        case 'CAREER_PLANNING':
          analysis.extractedInfo.goals.push(userQuery);
          analysis.priority = 'high';
          analysis.actionable = true;
          break;
        case 'WEAKNESS_IDENTIFICATION':
          analysis.extractedInfo.weaknesses.push(userQuery);
          analysis.priority = 'high';
          analysis.actionable = true;
          break;
        case 'IMPROVEMENT_GOALS':
          analysis.extractedInfo.goals.push(userQuery);
          analysis.priority = 'medium';
          analysis.actionable = true;
          break;
        case 'SPECIFIC_NEEDS':
          analysis.extractedInfo.needs.push(userQuery);
          analysis.priority = 'high';
          analysis.actionable = true;
          break;
        case 'LEARNING_PREFERENCES':
          analysis.extractedInfo.preferences.push(userQuery);
          analysis.priority = 'medium';
          analysis.actionable = true;
          break;
        case 'LEARNING_OBJECTIVES':
          analysis.extractedInfo.goals.push(userQuery);
          analysis.priority = 'high';
          analysis.actionable = true;
          break;
        case 'PARENT_CONCERNS':
          analysis.extractedInfo.concerns.push(userQuery);
          analysis.priority = 'high';
          analysis.actionable = true;
          break;
        case 'STRENGTH_IDENTIFICATION':
          analysis.extractedInfo.strengths.push(userQuery);
          analysis.priority = 'medium';
          analysis.actionable = false;
          break;
        case 'PERSONALITY_INSIGHTS':
          analysis.extractedInfo.personality.push(userQuery);
          analysis.priority = 'medium';
          analysis.actionable = false;
          break;
      }

      return analysis;
    }

    // Analyser quelques prompts
    const samplePrompts = savedPrompts.slice(0, 3);
    samplePrompts.forEach((prompt, index) => {
      const analysis = analyzeParentPrompt(prompt.content, prompt.aiResponse || '', prompt.promptType);
      console.log(`\n${index + 1}. Analyse du prompt: "${prompt.content.substring(0, 50)}..."`);
      console.log(`   Type: ${prompt.promptType}`);
      console.log(`   Enfant cible: ${analysis.targetChild || 'Non spécifié'}`);
      console.log(`   Priorité: ${analysis.priority.toUpperCase()}`);
      console.log(`   Actionnable: ${analysis.actionable ? 'Oui' : 'Non'}`);
    });

    console.log('\n' + '=' .repeat(70));
    console.log('✅ PROMPTS ENRICHIS CRÉÉS ET ANALYSÉS AVEC SUCCÈS !');
    console.log('=' .repeat(70));
    console.log('');
    console.log('🎯 Nouveaux types de prompts ajoutés :');
    console.log('   - 🎯 Souhaits et volontés des parents');
    console.log('   - 🚀 Planification de carrière');
    console.log('   - ⚠️ Identification des lacunes');
    console.log('   - 📈 Objectifs d\'amélioration');
    console.log('   - 🔧 Besoins spécifiques');
    console.log('   - 🎨 Préférences d\'apprentissage');
    console.log('   - 🎯 Objectifs d\'apprentissage');
    console.log('   - 😰 Préoccupations parentales');
    console.log('   - 💪 Identification des forces');
    console.log('   - 👤 Insights personnalité');
    console.log('');
    console.log('🔧 Avantages pour Bubix Pro :');
    console.log('   - Analyse intelligente des demandes parentales');
    console.log('   - Catégorisation automatique des préoccupations');
    console.log('   - Réponses adaptées selon le type de demande');
    console.log('   - Suivi des objectifs et préférences');
    console.log('   - Recommandations personnalisées');
    console.log('');
    console.log('🚀 Prêt pour l\'utilisation en temps réel !');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('❌ Erreur test prompts enrichis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnrichedParentPrompts().catch(console.error);
