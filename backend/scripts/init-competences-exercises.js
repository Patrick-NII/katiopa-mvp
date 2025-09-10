import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const competences = [
  {
    type: 'MATHEMATIQUES',
    name: 'Mathématiques',
    description: 'Compétences en calcul, géométrie et résolution de problèmes mathématiques',
    icon: '🔢',
    color: '#3B82F6',
    exercises: [
      {
        title: 'Calcul Mental Rapide',
        description: 'Résolvez des opérations mathématiques de base en temps limité',
        type: 'QUIZ',
        difficulty: 2,
        estimatedTime: 5,
        instructions: {
          text: 'Résolvez le plus rapidement possible les opérations affichées',
          rules: ['Temps limité : 30 secondes par question', 'Score basé sur la rapidité et la précision']
        },
        content: {
          questions: [
            { question: '7 + 8 = ?', options: ['15', '16', '14', '13'], correct: 0 },
            { question: '12 × 3 = ?', options: ['36', '35', '37', '38'], correct: 0 },
            { question: '45 ÷ 9 = ?', options: ['5', '6', '4', '7'], correct: 0 }
          ]
        }
      },
      {
        title: 'Géométrie Spatiale',
        description: 'Reconnaissance de formes et calculs d\'aires',
        type: 'INTERACTIF',
        difficulty: 3,
        estimatedTime: 10,
        instructions: {
          text: 'Identifiez les formes et calculez leurs propriétés',
          rules: ['Cliquez sur la bonne réponse', 'Utilisez les formules géométriques']
        },
        content: {
          shapes: [
            { type: 'cercle', radius: 5, question: 'Quelle est l\'aire de ce cercle ?' },
            { type: 'rectangle', width: 8, height: 6, question: 'Quel est le périmètre ?' }
          ]
        }
      }
    ]
  },
  {
    type: 'PROGRAMMATION',
    name: 'Programmation',
    description: 'Logique algorithmique et résolution de problèmes informatiques',
    icon: '💻',
    color: '#8B5CF6',
    exercises: [
      {
        title: 'Séquence d\'Instructions',
        description: 'Organisez les instructions dans le bon ordre',
        type: 'INTERACTIF',
        difficulty: 2,
        estimatedTime: 8,
        instructions: {
          text: 'Glissez les instructions dans le bon ordre pour créer un programme',
          rules: ['Chaque instruction doit être dans l\'ordre logique', 'Testez votre programme']
        },
        content: {
          instructions: [
            'Déclarer une variable',
            'Assigner une valeur',
            'Afficher le résultat',
            'Fermer le programme'
          ]
        }
      },
      {
        title: 'Boucles et Conditions',
        description: 'Comprenez les structures de contrôle',
        type: 'QUIZ',
        difficulty: 3,
        estimatedTime: 12,
        instructions: {
          text: 'Répondez aux questions sur les boucles et conditions',
          rules: ['Une seule réponse correcte par question', 'Expliquez votre raisonnement']
        },
        content: {
          questions: [
            { question: 'Quand utilise-t-on une boucle FOR ?', options: ['Pour répéter un nombre fixe de fois', 'Pour des conditions complexes', 'Pour des calculs', 'Pour afficher du texte'], correct: 0 }
          ]
        }
      }
    ]
  },
  {
    type: 'CREATIVITE',
    name: 'Créativité',
    description: 'Expression artistique et pensée créative',
    icon: '🎨',
    color: '#EC4899',
    exercises: [
      {
        title: 'Dessin Libre',
        description: 'Créez une œuvre d\'art numérique',
        type: 'CREATIF',
        difficulty: 1,
        estimatedTime: 15,
        instructions: {
          text: 'Utilisez les outils de dessin pour créer votre œuvre',
          rules: ['Laissez libre cours à votre imagination', 'Utilisez au moins 3 couleurs différentes']
        },
        content: {
          tools: ['pinceau', 'crayon', 'gomme', 'palette'],
          canvas: { width: 400, height: 300 }
        }
      },
      {
        title: 'Histoire Interactive',
        description: 'Créez une histoire avec des choix multiples',
        type: 'CREATIF',
        difficulty: 3,
        estimatedTime: 20,
        instructions: {
          text: 'Écrivez une histoire avec des branches narratives',
          rules: ['Minimum 3 choix par étape', 'Histoire cohérente et engageante']
        },
        content: {
          template: {
            start: 'Il était une fois...',
            branches: 3,
            endings: 2
          }
        }
      }
    ]
  },
  {
    type: 'COLLABORATION',
    name: 'Collaboration',
    description: 'Travail en équipe et communication interpersonnelle',
    icon: '🤝',
    color: '#10B981',
    exercises: [
      {
        title: 'Projet en Équipe',
        description: 'Collaborez sur un projet commun',
        type: 'COLLABORATIF',
        difficulty: 4,
        estimatedTime: 25,
        instructions: {
          text: 'Travaillez ensemble pour résoudre un défi',
          rules: ['Chaque membre a un rôle spécifique', 'Communication obligatoire']
        },
        content: {
          roles: ['Chef de projet', 'Développeur', 'Designer', 'Testeur'],
          challenge: 'Créer un jeu simple en équipe'
        }
      }
    ]
  },
  {
    type: 'CONCENTRATION',
    name: 'Concentration',
    description: 'Attention soutenue et focus',
    icon: '🎯',
    color: '#F59E0B',
    exercises: [
      {
        title: 'Mémoire Visuelle',
        description: 'Mémorisez et reproduisez des séquences',
        type: 'PRATIQUE',
        difficulty: 2,
        estimatedTime: 10,
        instructions: {
          text: 'Observez la séquence puis reproduisez-la',
          rules: ['Temps limité pour l\'observation', 'Précision requise']
        },
        content: {
          sequences: [
            { colors: ['rouge', 'bleu', 'vert', 'jaune'], duration: 5 },
            { shapes: ['cercle', 'carré', 'triangle'], duration: 3 }
          ]
        }
      }
    ]
  },
  {
    type: 'RESOLUTION_PROBLEMES',
    name: 'Résolution de problèmes',
    description: 'Analyse et résolution de défis complexes',
    icon: '🧩',
    color: '#06B6D4',
    exercises: [
      {
        title: 'Énigmes Logiques',
        description: 'Résolvez des énigmes étape par étape',
        type: 'REFLEXION',
        difficulty: 3,
        estimatedTime: 15,
        instructions: {
          text: 'Analysez le problème et trouvez la solution',
          rules: ['Prenez votre temps', 'Expliquez votre raisonnement']
        },
        content: {
          puzzles: [
            {
              problem: 'Un fermier a 17 moutons. Tous sauf 9 meurent. Combien en reste-t-il ?',
              hint: 'Attention aux mots !',
              solution: '9'
            }
          ]
        }
      }
    ]
  },
  {
    type: 'COMMUNICATION',
    name: 'Communication',
    description: 'Expression orale et écrite',
    icon: '💬',
    color: '#84CC16',
    exercises: [
      {
        title: 'Présentation Orale',
        description: 'Présentez un sujet devant un public virtuel',
        type: 'PRATIQUE',
        difficulty: 3,
        estimatedTime: 12,
        instructions: {
          text: 'Préparez et présentez votre sujet',
          rules: ['Clarté et structure', 'Contact visuel avec le public']
        },
        content: {
          topics: ['Mon animal préféré', 'Mon sport favori', 'Mon livre préféré'],
          duration: 3 // minutes
        }
      }
    ]
  },
  {
    type: 'CONNAISSANCES_GENERALES',
    name: 'Connaissances générales',
    description: 'Culture générale et curiosité intellectuelle',
    icon: '📚',
    color: '#F97316',
    exercises: [
      {
        title: 'Quiz Culturel',
        description: 'Testez vos connaissances dans différents domaines',
        type: 'QUIZ',
        difficulty: 2,
        estimatedTime: 10,
        instructions: {
          text: 'Répondez aux questions de culture générale',
          rules: ['Une seule réponse par question', 'Pas de limite de temps']
        },
        content: {
          categories: ['Histoire', 'Géographie', 'Sciences', 'Arts'],
          questions: [
            { question: 'Quelle est la capitale de la France ?', options: ['Lyon', 'Paris', 'Marseille', 'Toulouse'], correct: 1 }
          ]
        }
      }
    ]
  },
  {
    type: 'SENS_CRITIQUE',
    name: 'Sens critique',
    description: 'Analyse et évaluation d\'informations',
    icon: '🔍',
    color: '#EF4444',
    exercises: [
      {
        title: 'Vrai ou Faux',
        description: 'Analysez la véracité d\'affirmations',
        type: 'REFLEXION',
        difficulty: 3,
        estimatedTime: 8,
        instructions: {
          text: 'Déterminez si les affirmations sont vraies ou fausses',
          rules: ['Justifiez votre réponse', 'Recherchez des sources']
        },
        content: {
          statements: [
            { text: 'La Terre tourne autour du Soleil', correct: true },
            { text: 'L\'eau bout à 50°C', correct: false }
          ]
        }
      }
    ]
  },
  {
    type: 'REFLEXION_LOGIQUE',
    name: 'Réflexion logique & stratégique',
    description: 'Pensée stratégique et planification',
    icon: '⚡',
    color: '#8B5CF6',
    exercises: [
      {
        title: 'Jeu de Stratégie',
        description: 'Planifiez vos mouvements dans un jeu tactique',
        type: 'REFLEXION',
        difficulty: 4,
        estimatedTime: 20,
        instructions: {
          text: 'Anticipez les mouvements adverses et planifiez votre stratégie',
          rules: ['Pensez plusieurs coups à l\'avance', 'Adaptez-vous aux changements']
        },
        content: {
          game: 'Échecs simplifiés',
          pieces: ['Pion', 'Tour', 'Fou', 'Reine'],
          objective: 'Échec et mat'
        }
      }
    ]
  }
]

async function initCompetencesAndExercises() {
  try {
    console.log('🚀 Initialisation des compétences et exercices...')

    for (const competenceData of competences) {
      const { exercises, ...competenceInfo } = competenceData

      // Créer la compétence
      const competence = await prisma.competence.upsert({
        where: { type: competenceInfo.type },
        update: competenceInfo,
        create: competenceInfo
      })

      console.log(`✅ Compétence créée : ${competence.name}`)

      // Créer les exercices pour cette compétence
      for (const exerciseData of exercises) {
        await prisma.exercise.upsert({
          where: {
            competenceId_title: {
              competenceId: competence.id,
              title: exerciseData.title
            }
          },
          update: exerciseData,
          create: {
            ...exerciseData,
            competenceId: competence.id
          }
        })

        console.log(`  📝 Exercice créé : ${exerciseData.title}`)
      }
    }

    console.log('🎉 Initialisation terminée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
initCompetencesAndExercises()
