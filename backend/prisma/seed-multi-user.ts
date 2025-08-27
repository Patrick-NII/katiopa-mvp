import { PrismaClient, SubscriptionType, Gender, UserType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding de la base de données multi-utilisateurs...')

  // Date de référence : 31 mai 2025
  const referenceDate = new Date('2025-05-31T10:00:00Z')
  
  // Nettoyer la base de données
  await prisma.activity.deleteMany()
  await prisma.userProfile.deleteMany()
  await prisma.userSession.deleteMany()
  await prisma.billingRecord.deleteMany()
  await prisma.account.deleteMany()

  console.log('🧹 Base de données nettoyée')

  // 1. Créer un compte PRO_PLUS avec 4 sessions
  const proPlusAccount = await prisma.account.create({
    data: {
      email: 'famille.dubois@email.com',
      subscriptionType: SubscriptionType.PRO_PLUS,
      maxSessions: 4,
      createdAt: referenceDate,
      totalAccountConnectionDurationMs: BigInt(0)
    }
  })

  console.log('✅ Compte PRO_PLUS créé:', proPlusAccount.email)

  // 2. Créer 4 sessions pour ce compte
  const proPlusSessions = await Promise.all([
    // Enfant 1 - Lucas (8 ans)
    prisma.userSession.create({
      data: {
        accountId: proPlusAccount.id,
        sessionId: 'LUCAS_001',
        password: 'lucas123',
        firstName: 'Lucas',
        lastName: 'Dubois',
        gender: Gender.MALE,
        userType: UserType.CHILD,
        age: 8,
        grade: 'CE2',
        country: 'France',
        timezone: 'Europe/Paris',
        preferences: {
          learningStyle: 'visual',
          preferredSubjects: ['maths', 'sciences'],
          interests: ['dinosaures', 'espace', 'jeux vidéo']
        },
        createdAt: referenceDate,
        totalConnectionDurationMs: BigInt(0),
        currentSessionStartTime: null
      }
    }),

    // Enfant 2 - Emma (6 ans)
    prisma.userSession.create({
      data: {
        accountId: proPlusAccount.id,
        sessionId: 'EMMA_002',
        password: 'emma123',
        firstName: 'Emma',
        lastName: 'Dubois',
        gender: Gender.FEMALE,
        userType: UserType.CHILD,
        age: 6,
        grade: 'CP',
        country: 'France',
        timezone: 'Europe/Paris',
        preferences: {
          learningStyle: 'kinesthetic',
          preferredSubjects: ['français', 'arts'],
          interests: ['dessin', 'danse', 'histoires']
        },
        createdAt: referenceDate,
        totalConnectionDurationMs: BigInt(0),
        currentSessionStartTime: null
      }
    }),

    // Parent 1 - Marie (mère)
    prisma.userSession.create({
      data: {
        accountId: proPlusAccount.id,
        sessionId: 'MARIE_003',
        password: 'marie123',
        firstName: 'Marie',
        lastName: 'Dubois',
        gender: Gender.FEMALE,
        userType: UserType.PARENT,
        age: 35,
        country: 'France',
        timezone: 'Europe/Paris',
        preferences: {
          learningGoals: 'Suivre la progression des enfants',
          interests: ['éducation', 'psychologie enfantine']
        },
        createdAt: referenceDate,
        totalConnectionDurationMs: BigInt(0),
        currentSessionStartTime: null
      }
    }),

    // Parent 2 - Thomas (père)
    prisma.userSession.create({
      data: {
        accountId: proPlusAccount.id,
        sessionId: 'THOMAS_004',
        password: 'thomas123',
        firstName: 'Thomas',
        lastName: 'Dubois',
        gender: Gender.MALE,
        userType: UserType.PARENT,
        age: 37,
        country: 'France',
        timezone: 'Europe/Paris',
        preferences: {
          learningGoals: 'Encourager la curiosité scientifique',
          interests: ['sciences', 'technologie', 'sport']
        },
        createdAt: referenceDate,
        totalConnectionDurationMs: BigInt(0),
        currentSessionStartTime: null
      }
    })
  ])

  console.log('✅ 4 sessions PRO_PLUS créées')

  // 3. Créer un compte FREE avec 2 sessions
  const freeAccount = await prisma.account.create({
    data: {
      email: 'test.gratuit@email.com',
      subscriptionType: SubscriptionType.FREE,
      maxSessions: 2,
      createdAt: referenceDate,
      totalAccountConnectionDurationMs: BigInt(0)
    }
  })

  console.log('✅ Compte FREE créé:', freeAccount.email)

  // 4. Créer 2 sessions pour ce compte
  const freeSessions = await Promise.all([
    // Enfant - Léo (7 ans)
    prisma.userSession.create({
      data: {
        accountId: freeAccount.id,
        sessionId: 'LEO_005',
        password: 'leo123',
        firstName: 'Léo',
        lastName: 'Martin',
        gender: Gender.MALE,
        userType: UserType.CHILD,
        age: 7,
        grade: 'CE1',
        country: 'France',
        timezone: 'Europe/Paris',
        preferences: {
          learningStyle: 'auditory',
          preferredSubjects: ['français', 'musique'],
          interests: ['musique', 'lecture', 'nature']
        },
        createdAt: referenceDate,
        totalConnectionDurationMs: BigInt(0),
        currentSessionStartTime: null
      }
    }),

    // Parent - Sophie (mère)
    prisma.userSession.create({
      data: {
        accountId: freeAccount.id,
        sessionId: 'SOPHIE_006',
        password: 'sophie123',
        firstName: 'Sophie',
        lastName: 'Martin',
        gender: Gender.FEMALE,
        userType: UserType.PARENT,
        age: 32,
        country: 'France',
        timezone: 'Europe/Paris',
        preferences: {
          learningGoals: 'Découvrir la plateforme',
          interests: ['éducation alternative', 'développement personnel']
        },
        createdAt: referenceDate,
        totalConnectionDurationMs: BigInt(0),
        currentSessionStartTime: null
      }
    })
  ])

  console.log('✅ 2 sessions FREE créées')

  // 5. Créer des profils utilisateur détaillés
  for (const session of [...proPlusSessions, ...freeSessions]) {
    if (session.userType === UserType.CHILD) {
      await prisma.userProfile.create({
        data: {
          userSessionId: session.id,
          learningGoals: [
            'Améliorer les compétences en mathématiques',
            'Développer la créativité',
            'Renforcer la confiance en soi'
          ],
          preferredSubjects: ['maths', 'français', 'sciences'],
          learningStyle: 'mixed',
          difficulty: 'adaptative',
          sessionPreferences: {
            sessionDuration: 30,
            breakFrequency: 10,
            rewardSystem: true
          },
          interests: ['apprentissage', 'découverte', 'jeux éducatifs'],
          specialNeeds: [],
          customNotes: 'Enfant curieux et motivé',
          parentWishes: 'Encourager l\'autonomie et la persévérance'
        }
      })
    }
  }

  console.log('✅ Profils utilisateur créés')

  // 6. Créer des activités d'apprentissage pour les enfants
  const childSessions = [...proPlusSessions, ...freeSessions].filter(s => s.userType === UserType.CHILD)
  
  for (const session of childSessions) {
    // Activités en mathématiques
    await prisma.activity.createMany({
      data: [
        {
          userSessionId: session.id,
          domain: 'maths',
          nodeKey: 'addition_simple',
          score: 85,
          attempts: 2,
          durationMs: 120000 // 2 minutes
        },
        {
          userSessionId: session.id,
          domain: 'maths',
          nodeKey: 'soustraction_simple',
          score: 92,
          attempts: 1,
          durationMs: 90000 // 1.5 minutes
        },
        {
          userSessionId: session.id,
          domain: 'français',
          nodeKey: 'lecture_mots',
          score: 78,
          attempts: 3,
          durationMs: 180000 // 3 minutes
        },
        {
          userSessionId: session.id,
          domain: 'sciences',
          nodeKey: 'animaux_domestiques',
          score: 95,
          attempts: 1,
          durationMs: 150000 // 2.5 minutes
        }
      ]
    })
  }

  console.log('✅ Activités d\'apprentissage créées')

  // 7. Créer des enregistrements de facturation pour le compte PRO_PLUS
  await prisma.billingRecord.create({
    data: {
      accountId: proPlusAccount.id,
      amount: 29.99,
      currency: 'EUR',
      description: 'Abonnement PRO_PLUS - Mai 2025',
      status: 'PAID',
      billingDate: referenceDate,
      dueDate: referenceDate,
      paidAt: referenceDate
    }
  })

  console.log('✅ Enregistrements de facturation créés')

  // 8. Créer un compte de test pour patrick@niip.me
  const patrickAccount = await prisma.account.create({
    data: {
      email: 'patrick@niip.me',
      subscriptionType: SubscriptionType.FREE,
      maxSessions: 2,
      createdAt: referenceDate,
      totalAccountConnectionDurationMs: BigInt(0)
    }
  })

  console.log('✅ Compte PATRICK créé:', patrickAccount.email)

  // 9. Créer 2 sessions pour ce compte
  const patrickSessions = await Promise.all([
    // Patrick (Parent, 36 ans)
    prisma.userSession.create({
      data: {
        accountId: patrickAccount.id,
        sessionId: 'PATRICK_007',
        password: 'patrick123',
        firstName: 'patrick',
        lastName: 'isangu',
        gender: Gender.MALE,
        userType: UserType.PARENT,
        age: 36,
        country: 'France',
        timezone: 'Europe/Paris',
        preferences: {
          learningGoals: 'Suivre la progression de l\'enfant',
          interests: ['éducation', 'développement personnel']
        },
        createdAt: referenceDate,
        totalConnectionDurationMs: BigInt(0),
        currentSessionStartTime: null
      }
    }),

    // Aylon (Enfant, 6 ans)
    prisma.userSession.create({
      data: {
        accountId: patrickAccount.id,
        sessionId: 'AYLON_008',
        password: 'aylon123',
        firstName: 'Aylon',
        lastName: 'Isangu',
        gender: Gender.MALE,
        userType: UserType.CHILD,
        age: 6,
        grade: 'CP',
        country: 'France',
        timezone: 'Europe/Paris',
        preferences: {
          learningStyle: 'kinesthetic',
          preferredSubjects: ['maths', 'français', 'sciences'],
          interests: ['jeux', 'dessin', 'histoires']
        },
        createdAt: referenceDate,
        totalConnectionDurationMs: BigInt(0),
        currentSessionStartTime: null
      }
    })
  ])

  console.log('✅ 2 sessions PATRICK créées')

  // 10. Créer un profil pour Aylon
  await prisma.userProfile.create({
    data: {
      userSessionId: patrickSessions[1].id, // Aylon
      learningGoals: [
        'Apprendre à lire et écrire',
        'Développer les compétences en mathématiques',
        'Découvrir le monde qui nous entoure'
      ],
      preferredSubjects: ['maths', 'français', 'sciences'],
      learningStyle: 'kinesthetic',
      difficulty: 'débutant',
      sessionPreferences: {
        sessionDuration: 20,
        breakFrequency: 5,
        rewardSystem: true
      },
      interests: ['jeux éducatifs', 'histoires', 'dessin'],
      specialNeeds: [],
      customNotes: 'Enfant curieux et motivé',
      parentWishes: 'Encourager l\'autonomie et la confiance en soi'
    }
  })

  console.log('✅ Profil utilisateur créé pour Aylon')

  // 11. Créer des activités d'apprentissage pour Aylon
  await prisma.activity.createMany({
    data: [
      {
        userSessionId: patrickSessions[1].id, // Aylon
        domain: 'maths',
        nodeKey: 'compter_jusqua_10',
        score: 85,
        attempts: 2,
        durationMs: 90000 // 1.5 minutes
      },
      {
        userSessionId: patrickSessions[1].id, // Aylon
        domain: 'français',
        nodeKey: 'alphabet',
        score: 92,
        attempts: 1,
        durationMs: 120000 // 2 minutes
      },
      {
        userSessionId: patrickSessions[1].id, // Aylon
        domain: 'sciences',
        nodeKey: 'animaux_familiers',
        score: 78,
        attempts: 3,
        durationMs: 150000 // 2.5 minutes
      }
    ]
  })

  console.log('✅ Activités d\'apprentissage créées pour Aylon')

  console.log('\n🎉 Seeding terminé avec succès !')
  console.log('\n📋 Comptes de test créés :')
  console.log('\n🔐 Compte PRO_PLUS (4 sessions) :')
  console.log('   Email: famille.dubois@email.com')
  console.log('   Sessions:')
  console.log('     - LUCAS_001 / lucas123 (Enfant, 8 ans)')
  console.log('     - EMMA_002 / emma123 (Enfant, 6 ans)')
  console.log('     - MARIE_003 / marie123 (Parent, 35 ans)')
  console.log('     - THOMAS_004 / thomas123 (Parent, 37 ans)')
  
  console.log('\n🔐 Compte FREE (2 sessions) :')
  console.log('   Email: test.gratuit@email.com')
  console.log('   Sessions:')
  console.log('     - LEO_005 / leo123 (Enfant, 7 ans)')
  console.log('     - SOPHIE_006 / sophie123 (Parent, 32 ans)')

  console.log('\n🔐 Compte PATRICK (2 sessions) :')
  console.log('   Email: patrick@niip.me')
  console.log('   Sessions:')
  console.log('     - PATRICK_007 / patrick123 (Parent, 36 ans)')
  console.log('     - AYLON_008 / aylon123 (Enfant, 6 ans, CP)')
  
  console.log('\n💡 Pour tester :')
  console.log('   1. Connectez-vous avec n\'importe quelle session')
  console.log('   2. Vérifiez que les données s\'affichent correctement')
  console.log('   3. Testez la navigation entre les onglets')
  console.log('   4. Vérifiez que le LLM reçoit toutes les informations')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 