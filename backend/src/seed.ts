import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  try {
    // Nettoyage de la base de données
    console.log('🧹 Nettoyage de la base de données...');
    await prisma.conversation.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.planSeat.deleteMany();
    await prisma.billingRecord.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.account.deleteMany();

    // Création d'un compte de test
    console.log('👤 Création du compte de test...');
    const testAccount = await prisma.account.create({
      data: {
        email: 'test@katiopa.com',
        subscriptionType: 'PRO',
        maxSessions: 2,
        isActive: true
      }
    });

    // Création du plan de sièges
    await prisma.planSeat.create({
      data: {
        accountId: testAccount.id,
        maxChildren: 2
      }
    });

    // Création de la session parent
    const hashedPassword = await bcrypt.hash('password123', 12);
    const parentSession = await prisma.userSession.create({
      data: {
        accountId: testAccount.id,
        sessionId: 'parent_test',
        password: hashedPassword,
        firstName: 'Parent',
        lastName: 'Test',
        userType: 'PARENT',
        isActive: true
      }
    });

    // Création du profil parent
    await prisma.userProfile.create({
      data: {
        userSessionId: parentSession.id,
        learningGoals: ['Accompagner mon enfant', 'Suivre ses progrès'],
        preferredSubjects: ['Mathématiques', 'Sciences'],
        interests: ['Éducation', 'Développement personnel'],
        specialNeeds: []
      }
    });

    // Création de la session enfant
    const childSession = await prisma.userSession.create({
      data: {
        accountId: testAccount.id,
        sessionId: 'enfant_test',
        password: hashedPassword,
        firstName: 'Enfant',
        lastName: 'Test',
        age: 8,
        grade: 'CE2',
        gender: 'UNKNOWN',
        userType: 'CHILD',
        isActive: true
      }
    });

    // Création du profil enfant
    await prisma.userProfile.create({
      data: {
        userSessionId: childSession.id,
        learningGoals: ['Apprendre les mathématiques', 'Développer la logique'],
        preferredSubjects: ['Mathématiques', 'Programmation'],
        learningStyle: 'visuel',
        difficulty: 'débutant',
        sessionPreferences: { sessionDuration: 30, breakFrequency: 10 },
        interests: ['Jeux', 'Puzzles', 'Dessin'],
        specialNeeds: []
      }
    });

    // Création de quelques activités de test
    console.log('📚 Création des activités de test...');
    await prisma.activity.createMany({
      data: [
        {
          userSessionId: childSession.id,
          domain: 'Mathématiques',
          nodeKey: 'addition_simple',
          score: 85,
          attempts: 3,
          durationMs: 180000 // 3 minutes
        },
        {
          userSessionId: childSession.id,
          domain: 'Programmation',
          nodeKey: 'sequences_basiques',
          score: 92,
          attempts: 2,
          durationMs: 240000 // 4 minutes
        }
      ]
    });

    // Création de quelques conversations de test
    console.log('💬 Création des conversations de test...');
    await prisma.conversation.createMany({
      data: [
        {
          userSessionId: childSession.id,
          accountId: testAccount.id,
          message: 'Bonjour ! Comment ça va ?',
          response: 'Bonjour ! Je vais très bien, merci ! Comment puis-je t\'aider aujourd\'hui ?',
          focus: 'Général',
          context: {
            userType: 'CHILD',
            subscriptionType: 'PRO',
            timestamp: new Date().toISOString(),
            model: 'gpt-4o-mini',
            focus: 'Général'
          },
          metadata: {
            messageLength: 20,
            responseLength: 65,
            estimatedTokens: 21,
            processingTime: new Date().toISOString()
          }
        },
        {
          userSessionId: parentSession.id,
          accountId: testAccount.id,
          message: 'Comment mon enfant progresse-t-il ?',
          response: 'Votre enfant progresse très bien ! Il a obtenu 85% en mathématiques et 92% en programmation. Je recommande de continuer avec des exercices de logique.',
          focus: 'Suivi des progrès',
          context: {
            userType: 'PARENT',
            subscriptionType: 'PRO',
            timestamp: new Date().toISOString(),
            model: 'gpt-4o-mini',
            focus: 'Suivi des progrès'
          },
          metadata: {
            messageLength: 35,
            responseLength: 120,
            estimatedTokens: 39,
            processingTime: new Date().toISOString()
          }
        }
      ]
    });

    console.log('✅ Seeding terminé avec succès !');
    console.log('📊 Données créées :');
    console.log(`   - 1 compte (${testAccount.email})`);
    console.log(`   - 2 sessions utilisateur (1 parent, 1 enfant)`);
    console.log(`   - 2 profils utilisateur`);
    console.log(`   - 2 activités d'apprentissage`);
    console.log(`   - 2 conversations de test`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du seeding
main()
  .catch((error) => {
    console.error('❌ Erreur fatale lors du seeding:', error);
    process.exit(1);
  });
