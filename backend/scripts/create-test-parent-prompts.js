import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Script pour créer des prompts parents de test pour le RAG
async function createTestParentPrompts() {
  console.log('🔄 Création de prompts parents de test pour le RAG...\n');

  try {
    // 1. Récupérer le compte parent et les sessions
    const parentAccount = await prisma.account.findFirst({
      where: {
        email: 'parent@katiopa.com'
      },
      include: {
        userSessions: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!parentAccount) {
      console.log('❌ Compte parent non trouvé');
      return;
    }

    const parentSession = parentAccount.userSessions.find(s => s.userType === 'PARENT');
    const childSessions = parentAccount.userSessions.filter(s => s.userType === 'CHILD');

    if (!parentSession || childSessions.length === 0) {
      console.log('❌ Sessions parent/enfant non trouvées');
      return;
    }

    console.log(`✅ Compte parent: ${parentAccount.email}`);
    console.log(`👨‍👩‍👧‍👦 Parent: ${parentSession.firstName} ${parentSession.lastName}`);
    console.log(`👶 Enfants: ${childSessions.map(c => c.firstName).join(', ')}`);

    // 2. Créer des prompts parents variés
    const testPrompts = [
      {
        content: "Emma a des difficultés avec les multiplications. Elle confond souvent les tables de 6 et 8. Pouvez-vous lui proposer des exercices spécifiques ?",
        promptType: "LEARNING_DIFFICULTY",
        childSessionId: childSessions.find(c => c.firstName === 'Emma')?.id
      },
      {
        content: "Lucas adore les jeux de logique et la programmation. Il voudrait des défis plus difficiles en coding.",
        promptType: "LEARNING_PREFERENCE",
        childSessionId: childSessions.find(c => c.firstName === 'Lucas')?.id
      },
      {
        content: "Emma a besoin de plus de temps pour comprendre les concepts mathématiques. Elle préfère les explications visuelles.",
        promptType: "LEARNING_STYLE",
        childSessionId: childSessions.find(c => c.firstName === 'Emma')?.id
      },
      {
        content: "Lucas se décourage vite quand il ne réussit pas du premier coup. Il faut l'encourager davantage.",
        promptType: "BEHAVIORAL_CONCERN",
        childSessionId: childSessions.find(c => c.firstName === 'Lucas')?.id
      },
      {
        content: "Emma a fait beaucoup de progrès en mathématiques ces dernières semaines. Elle est plus confiante.",
        promptType: "PROGRESS_UPDATE",
        childSessionId: childSessions.find(c => c.firstName === 'Emma')?.id
      },
      {
        content: "Lucas passe trop de temps sur les jeux et pas assez sur les exercices. Comment l'aider à équilibrer ?",
        promptType: "TIME_MANAGEMENT",
        childSessionId: childSessions.find(c => c.firstName === 'Lucas')?.id
      },
      {
        content: "Emma a un test de mathématiques la semaine prochaine. Pouvez-vous lui proposer des révisions ?",
        promptType: "EXAM_PREPARATION",
        childSessionId: childSessions.find(c => c.firstName === 'Emma')?.id
      },
      {
        content: "Lucas a des difficultés de concentration. Il se laisse facilement distraire pendant les activités.",
        promptType: "ATTENTION_ISSUE",
        childSessionId: childSessions.find(c => c.firstName === 'Lucas')?.id
      }
    ];

    console.log(`📝 Création de ${testPrompts.length} prompts parents...`);

    // 3. Insérer les prompts dans la base de données
    for (const promptData of testPrompts) {
      if (!promptData.childSessionId) continue;

      const processedContent = promptData.content; // Pour simplifier, on garde le contenu original
      const aiResponse = `Analyse du prompt: ${promptData.promptType}. Réponse adaptée générée.`;

      await prisma.parentPrompt.create({
        data: {
          content: promptData.content,
          processedContent: processedContent,
          aiResponse: aiResponse,
          promptType: promptData.promptType,
          status: 'PROCESSED',
          parentSessionId: parentSession.id,
          childSessionId: promptData.childSessionId,
          accountId: parentAccount.id
        }
      });

      console.log(`✅ Prompt créé: ${promptData.promptType} pour ${childSessions.find(c => c.id === promptData.childSessionId)?.firstName}`);
    }

    // 4. Mettre à jour les préférences parentales
    console.log('\n👨‍👩‍👧‍👦 Mise à jour des préférences parentales...');

         await prisma.parentPreferences.upsert({
       where: {
         userSessionId: parentSession.id
       },
       update: {
         childStrengths: ['Mathématiques', 'Logique'],
         focusAreas: ['Concentration', 'Confiance en soi'],
         learningGoals: ['Améliorer les multiplications', 'Développer la persévérance'],
         concerns: ['Concentration de Lucas', 'Confiance en soi d\'Emma'],
         preferredSchedule: { morning: true, afternoon: true, evening: false },
         studyDuration: 45,
         breakFrequency: 15,
         learningStyle: 'Mixte',
         motivationFactors: ['Jeux', 'Défis', 'Récompenses']
       },
       create: {
         userSessionId: parentSession.id,
         childStrengths: ['Mathématiques', 'Logique'],
         focusAreas: ['Concentration', 'Confiance en soi'],
         learningGoals: ['Améliorer les multiplications', 'Développer la persévérance'],
         concerns: ['Concentration de Lucas', 'Confiance en soi d\'Emma'],
         preferredSchedule: { morning: true, afternoon: true, evening: false },
         studyDuration: 45,
         breakFrequency: 15,
         learningStyle: 'Mixte',
         motivationFactors: ['Jeux', 'Défis', 'Récompenses']
       }
     });

    console.log('✅ Préférences parentales mises à jour');

    // 5. Mettre à jour les profils des enfants avec des notes parentales
    console.log('\n👶 Mise à jour des profils enfants...');

    for (const child of childSessions) {
      await prisma.userProfile.upsert({
        where: {
          userSessionId: child.id
        },
        update: {
          learningGoals: child.firstName === 'Emma' ? ['Mathématiques', 'Confiance en soi'] : ['Logique', 'Programmation'],
          preferredSubjects: child.firstName === 'Emma' ? ['Mathématiques', 'Sciences'] : ['Programmation', 'Logique'],
          learningStyle: child.firstName === 'Emma' ? 'Visuel et progressif' : 'Pratique et rapide',
          difficulty: child.firstName === 'Emma' ? 'Moyen' : 'Avancé',
          interests: child.firstName === 'Emma' ? ['Dessin', 'Animaux'] : ['Jeux vidéo', 'Technologie'],
          specialNeeds: child.firstName === 'Emma' ? ['Temps supplémentaire'] : ['Encouragement'],
          customNotes: child.firstName === 'Emma' ? 'A besoin de temps pour assimiler, mais très méticuleuse' : 'Rapide mais se décourage facilement',
          parentWishes: child.firstName === 'Emma' ? 'Qu\'elle prenne confiance en ses capacités mathématiques' : 'Qu\'il développe sa persévérance et sa concentration'
        },
        create: {
          userSessionId: child.id,
          learningGoals: child.firstName === 'Emma' ? ['Mathématiques', 'Confiance en soi'] : ['Logique', 'Programmation'],
          preferredSubjects: child.firstName === 'Emma' ? ['Mathématiques', 'Sciences'] : ['Programmation', 'Logique'],
          learningStyle: child.firstName === 'Emma' ? 'Visuel et progressif' : 'Pratique et rapide',
          difficulty: child.firstName === 'Emma' ? 'Moyen' : 'Avancé',
          interests: child.firstName === 'Emma' ? ['Dessin', 'Animaux'] : ['Jeux vidéo', 'Technologie'],
          specialNeeds: child.firstName === 'Emma' ? ['Temps supplémentaire'] : ['Encouragement'],
          customNotes: child.firstName === 'Emma' ? 'A besoin de temps pour assimiler, mais très méticuleuse' : 'Rapide mais se décourage facilement',
          parentWishes: child.firstName === 'Emma' ? 'Qu\'elle prenne confiance en ses capacités mathématiques' : 'Qu\'il développe sa persévérance et sa concentration'
        }
      });

      console.log(`✅ Profil mis à jour pour ${child.firstName}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ PROMPTS PARENTS DE TEST CRÉÉS AVEC SUCCÈS !');
    console.log('=' .repeat(60));
    console.log('');
    console.log('📝 Données créées :');
    console.log(`   - ${testPrompts.length} prompts parents variés`);
    console.log('   - Préférences parentales détaillées');
    console.log('   - Profils enfants avec notes parentales');
    console.log('');
    console.log('🎯 Types de prompts créés :');
    console.log('   - Difficultés d\'apprentissage');
    console.log('   - Préférences pédagogiques');
    console.log('   - Styles d\'apprentissage');
    console.log('   - Préoccupations comportementales');
    console.log('   - Mises à jour de progrès');
    console.log('   - Gestion du temps');
    console.log('   - Préparation aux examens');
    console.log('   - Problèmes d\'attention');
    console.log('');
    console.log('🔧 Prochaines étapes :');
    console.log('   - Tester le RAG avec ces données');
    console.log('   - Intégrer dans l\'API chat');
    console.log('   - Vérifier l\'amélioration des réponses');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Erreur création prompts parents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestParentPrompts().catch(console.error);
