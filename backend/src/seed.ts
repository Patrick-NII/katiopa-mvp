import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding de la base de données...')
  
  try {
    // Supprimer toutes les données existantes
    console.log('⚠️ Des données existent déjà dans la base. Suppression...')
    await prisma.activity.deleteMany()
    await prisma.userProfile.deleteMany()
    await prisma.userSession.deleteMany()
    await prisma.account.deleteMany()
    
    // Créer les comptes de test
    const testAccounts = [
      {
        email: 'demo@katiopa.com',
        subscriptionType: 'FREE',
        maxSessions: 2,
        totalAccountConnectionDurationMs: BigInt(0)
      },
      {
        email: 'pro@katiopa.com',
        subscriptionType: 'PRO',
        maxSessions: 4,
        totalAccountConnectionDurationMs: BigInt(0)
      },
      {
        email: 'premium@katiopa.com',
        subscriptionType: 'PRO_PLUS',
        maxSessions: 6,
        totalAccountConnectionDurationMs: BigInt(0)
      }
    ]

    const createdAccounts = await Promise.all(
      testAccounts.map(account => prisma.account.create({ data: account }))
    )
    console.log('✅ Comptes de test créés:', createdAccounts.length)

    // Créer les sessions utilisateur
    const testSessions = await Promise.all([
      // Compte FREE - Famille Dupont
      prisma.userSession.create({
        data: {
          accountId: createdAccounts[0].id,
          sessionId: 'MARIE_DUPONT',
          password: 'password123',
          firstName: 'Marie',
          lastName: 'Dupont',
          gender: 'FEMALE',
          userType: 'PARENT',
          age: 32,
          grade: 'N/A',
          country: 'France',
          timezone: 'Europe/Paris',
          isActive: true,
          totalConnectionDurationMs: BigInt(1800000), // 30 minutes
          lastLoginAt: new Date()
        }
      }),
      prisma.userSession.create({
        data: {
          accountId: createdAccounts[0].id,
          sessionId: 'LUCAS_005',
          password: 'password123',
          firstName: 'Lucas',
          lastName: 'Dupont',
          gender: 'MALE',
          userType: 'CHILD',
          age: 5,
          grade: 'GS',
          country: 'France',
          timezone: 'Europe/Paris',
          isActive: true,
          totalConnectionDurationMs: BigInt(3600000), // 1 heure
          lastLoginAt: new Date()
        }
      }),

      // Compte PRO - Famille Martin
      prisma.userSession.create({
        data: {
          accountId: createdAccounts[1].id,
          sessionId: 'PATRICK_MARTIN',
          password: 'password123',
          firstName: 'Patrick',
          lastName: 'Martin',
          gender: 'MALE',
          userType: 'PARENT',
          age: 35,
          grade: 'N/A',
          country: 'France',
          timezone: 'Europe/Paris',
          isActive: true,
          totalConnectionDurationMs: BigInt(2400000), // 40 minutes
          lastLoginAt: new Date()
        }
      }),
      prisma.userSession.create({
        data: {
          accountId: createdAccounts[1].id,
          sessionId: 'EMMA_006',
          password: 'password123',
          firstName: 'Emma',
          lastName: 'Martin',
          gender: 'FEMALE',
          userType: 'CHILD',
          age: 6,
          grade: 'CP',
          country: 'France',
          timezone: 'Europe/Paris',
          isActive: true,
          totalConnectionDurationMs: BigInt(5400000), // 1h30
          lastLoginAt: new Date()
        }
      }),
      prisma.userSession.create({
        data: {
          accountId: createdAccounts[1].id,
          sessionId: 'THOMAS_007',
          password: 'password123',
          firstName: 'Thomas',
          lastName: 'Martin',
          gender: 'MALE',
          userType: 'CHILD',
          age: 7,
          grade: 'CE1',
          country: 'France',
          timezone: 'Europe/Paris',
          isActive: true,
          totalConnectionDurationMs: BigInt(4800000), // 1h20
          lastLoginAt: new Date()
        }
      }),

      // Compte PRO_PLUS - Famille Bernard
      prisma.userSession.create({
        data: {
          accountId: createdAccounts[2].id,
          sessionId: 'SOPHIE_BERNARD',
          password: 'password123',
          firstName: 'Sophie',
          lastName: 'Bernard',
          gender: 'FEMALE',
          userType: 'PARENT',
          age: 38,
          grade: 'N/A',
          country: 'France',
          timezone: 'Europe/Paris',
          isActive: true,
          totalConnectionDurationMs: BigInt(3000000), // 50 minutes
          lastLoginAt: new Date()
        }
      }),
      prisma.userSession.create({
        data: {
          accountId: createdAccounts[2].id,
          sessionId: 'JULIA_004',
          password: 'password123',
          firstName: 'Julia',
          lastName: 'Bernard',
          gender: 'FEMALE',
          userType: 'CHILD',
          age: 4,
          grade: 'MS',
          country: 'France',
          timezone: 'Europe/Paris',
          isActive: true,
          totalConnectionDurationMs: BigInt(2400000), // 40 minutes
          lastLoginAt: new Date()
        }
      }),
      prisma.userSession.create({
        data: {
          accountId: createdAccounts[2].id,
          sessionId: 'ALEX_008',
          password: 'password123',
          firstName: 'Alex',
          lastName: 'Bernard',
          gender: 'MALE',
          userType: 'CHILD',
          age: 8,
          grade: 'CE2',
          country: 'France',
          timezone: 'Europe/Paris',
          isActive: true,
          totalConnectionDurationMs: BigInt(6000000), // 2 heures
          lastLoginAt: new Date()
        }
      })
    ])
    console.log('✅ Sessions utilisateur créées:', testSessions.length)

    // Mettre à jour les temps totaux des comptes
    await Promise.all(createdAccounts.map(async (account, index) => {
      const accountSessions = testSessions.filter(s => s.accountId === account.id)
      const totalTime = accountSessions.reduce((sum, session) => sum + Number(session.totalConnectionDurationMs), 0)
      
      await prisma.account.update({
        where: { id: account.id },
        data: { totalAccountConnectionDurationMs: BigInt(totalTime) }
      })
    }))

    // Créer des profils utilisateur pour les enfants
    const childSessions = testSessions.filter(s => s.userType === 'CHILD')
    await Promise.all([
      prisma.userProfile.create({
        data: {
          userSessionId: childSessions[0].id, // Lucas (5 ans)
          learningGoals: ['Reconnaître les lettres', 'Compter jusqu\'à 10'],
          preferredSubjects: ['Français', 'Mathématiques'],
          learningStyle: 'Visuel',
          difficulty: 'Débutant',
          interests: ['Animaux', 'Couleurs', 'Musique'],
          specialNeeds: [],
          customNotes: 'Lucas aime les histoires avec des animaux',
          parentWishes: 'Développer la curiosité'
        }
      }),
      prisma.userProfile.create({
        data: {
          userSessionId: childSessions[1].id, // Emma (6 ans)
          learningGoals: ['Maîtriser les additions', 'Lire des mots simples'],
          preferredSubjects: ['Mathématiques', 'Français'],
          learningStyle: 'Auditif',
          difficulty: 'Débutant',
          interests: ['Nature', 'Dessin', 'Danse'],
          specialNeeds: [],
          customNotes: 'Emma adore les activités créatives',
          parentWishes: 'Renforcer la confiance en soi'
        }
      }),
      prisma.userProfile.create({
        data: {
          userSessionId: childSessions[2].id, // Thomas (7 ans)
          learningGoals: ['Tables de multiplication', 'Compréhension de lecture'],
          preferredSubjects: ['Mathématiques', 'Sciences'],
          learningStyle: 'Kinesthésique',
          difficulty: 'Intermédiaire',
          interests: ['Espace', 'Dinosaures', 'Construction'],
          specialNeeds: [],
          customNotes: 'Thomas aime les défis et les énigmes',
          parentWishes: 'Développer la logique'
        }
      }),
      prisma.userProfile.create({
        data: {
          userSessionId: childSessions[3].id, // Julia (4 ans)
          learningGoals: ['Reconnaître les formes', 'Compter jusqu\'à 5'],
          preferredSubjects: ['Mathématiques', 'Arts'],
          learningStyle: 'Visuel',
          difficulty: 'Très débutant',
          interests: ['Poupées', 'Peinture', 'Chansons'],
          specialNeeds: [],
          customNotes: 'Julia a une grande imagination',
          parentWishes: 'Encourager la créativité'
        }
      }),
      prisma.userProfile.create({
        data: {
          userSessionId: childSessions[4].id, // Alex (8 ans)
          learningGoals: ['Division simple', 'Rédaction de textes'],
          preferredSubjects: ['Mathématiques', 'Histoire'],
          learningStyle: 'Logique',
          difficulty: 'Avancé',
          interests: ['Moyen Âge', 'Chess', 'Astronomie'],
          specialNeeds: [],
          customNotes: 'Alex est très curieux et pose beaucoup de questions',
          parentWishes: 'Nourrir sa curiosité intellectuelle'
        }
      })
    ])
    console.log('✅ Profils utilisateur créés')

    // Créer des activités d'apprentissage variées avec des scores et durées réalistes
    const activitiesData = [
      // Lucas (5 ans) - Niveau débutant
      { userSessionId: childSessions[0].id, domain: 'maths', nodeKey: 'maths.counting.1to10', score: 80, attempts: 2, durationMs: 15000 },
      { userSessionId: childSessions[0].id, domain: 'francais', nodeKey: 'francais.letters.vowels', score: 75, attempts: 3, durationMs: 20000 },
      
      // Emma (6 ans) - Niveau débutant
      { userSessionId: childSessions[1].id, domain: 'maths', nodeKey: 'maths.addition.1digit', score: 85, attempts: 2, durationMs: 18000 },
      { userSessionId: childSessions[1].id, domain: 'francais', nodeKey: 'francais.reading.simple_words', score: 90, attempts: 1, durationMs: 12000 },
      { userSessionId: childSessions[1].id, domain: 'sciences', nodeKey: 'sciences.nature.animals', score: 88, attempts: 2, durationMs: 16000 },
      
      // Thomas (7 ans) - Niveau intermédiaire
      { userSessionId: childSessions[2].id, domain: 'maths', nodeKey: 'maths.multiplication.table2', score: 92, attempts: 1, durationMs: 14000 },
      { userSessionId: childSessions[2].id, domain: 'maths', nodeKey: 'maths.subtraction.2digit', score: 78, attempts: 3, durationMs: 22000 },
      { userSessionId: childSessions[2].id, domain: 'sciences', nodeKey: 'sciences.space.planets', score: 95, attempts: 1, durationMs: 10000 },
      
      // Julia (4 ans) - Niveau très débutant
      { userSessionId: childSessions[3].id, domain: 'maths', nodeKey: 'maths.shapes.basic', score: 70, attempts: 4, durationMs: 25000 },
      { userSessionId: childSessions[3].id, domain: 'arts', nodeKey: 'arts.colors.primary', score: 85, attempts: 2, durationMs: 18000 },
      
      // Alex (8 ans) - Niveau avancé
      { userSessionId: childSessions[4].id, domain: 'maths', nodeKey: 'maths.division.simple', score: 88, attempts: 2, durationMs: 16000 },
      { userSessionId: childSessions[4].id, domain: 'history', nodeKey: 'history.medieval.knights', score: 96, attempts: 1, durationMs: 8000 },
      { userSessionId: childSessions[4].id, domain: 'coding', nodeKey: 'coding.logic.sequences', score: 82, attempts: 3, durationMs: 20000 }
    ]

    await prisma.activity.createMany({ data: activitiesData })
    console.log('✅ Activités d\'apprentissage créées:', activitiesData.length)

    // Seed des plan seats (V2 minimal, désormais supporté par schema.prisma)
    console.log('🔄 Création des plan seats pour la v2...')
    const { seedPlanSeats } = await import('./db/seedPlanSeats')
    await seedPlanSeats()
    console.log('✅ Plan seats créés/mis à jour avec succès')

    console.log('🎉 Seeding terminé avec succès!')
    console.log('\n📋 Comptes de test disponibles:')
    console.log('\n🆓 Compte FREE (demo@katiopa.com):')
    console.log('  👨‍👩‍👦 Session: MARIE_DUPONT / password123 (Parent)')
    console.log('  👦 Session: LUCAS_005 / password123 (Enfant, 5 ans)')
    
    console.log('\n⭐ Compte PRO (pro@katiopa.com):')
    console.log('  👨 Session: PATRICK_MARTIN / password123 (Parent)')
    console.log('  👧 Session: EMMA_006 / password123 (Enfant, 6 ans)')
    console.log('  👦 Session: THOMAS_007 / password123 (Enfant, 7 ans)')
    
    console.log('\n💎 Compte PRO_PLUS (premium@katiopa.com):')
    console.log('  👩 Session: SOPHIE_BERNARD / password123 (Parent)')
    console.log('  👧 Session: JULIA_004 / password123 (Enfant, 4 ans)')
    console.log('  👦 Session: ALEX_008 / password123 (Enfant, 8 ans)')

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
