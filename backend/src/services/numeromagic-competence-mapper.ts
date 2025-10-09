/**
 * 🔢 NUMÉROMAGIC COMPETENCE MAPPER SERVICE
 * 
 * Service pour mapper les performances NuméroMagic vers les compétences du radar
 * Chaque partie de NuméroMagic met à jour automatiquement les compétences de l'enfant
 * 
 * @author CubeAI Team
 * @date 2025-10-09
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Types des modes de jeu NuméroMagic
 */
type GameMode = 'CLASSIC' | 'TIMED' | 'CHALLENGE';

/**
 * Types des niveaux de difficulté NuméroMagic
 */
type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

/**
 * Types des compétences du radar (doivent correspondre à l'enum Prisma CompetenceType)
 * 
 * RADAR À 8 CÔTÉS - COLLABORATION et REFLEXION_LOGIQUE temporairement désactivées
 */
type CompetenceType = 
  | 'MATHEMATIQUES'           // 1. Mathématiques
  | 'PROGRAMMATION'           // 2. Programmation
  | 'CREATIVITE'              // 3. Créativité
  | 'CONCENTRATION'           // 4. Concentration
  | 'RESOLUTION_PROBLEMES'    // 5. Résolution de problèmes
  | 'COMMUNICATION'           // 6. Communication
  | 'CONNAISSANCES_GENERALES' // 7. Connaissances générales
  | 'SENS_CRITIQUE';          // 8. Sens critique

/**
 * Structure de mapping mode/difficulté → compétences
 */
interface NumeroMagicCompetenceMapping {
  mode: GameMode;
  difficulty: DifficultyLevel;
  competences: {
    primary: CompetenceType;      // Compétence principale (poids 1.0)
    secondary: CompetenceType[];  // Compétences secondaires (poids 0.3)
  };
}

/**
 * 🗺️ Mapping des modes et difficultés vers les compétences du radar (8 côtés)
 * 
 * Logique NuméroMagic → Compétences Radar:
 * - CLASSIC → Mathématiques + Résolution de problèmes
 * - TIMED → Concentration + Mathématiques (sous pression)
 * - CHALLENGE → Résolution de problèmes + Sens critique
 * - Difficulté élevée → Plus de compétences secondaires
 */
const NUMEROMAGIC_COMPETENCE_MAP: Record<string, NumeroMagicCompetenceMapping> = {
  'CLASSIC_EASY': {
    mode: 'CLASSIC',
    difficulty: 'EASY',
    competences: {
      primary: 'MATHEMATIQUES',
      secondary: ['CONCENTRATION']
    }
  },
  'CLASSIC_MEDIUM': {
    mode: 'CLASSIC',
    difficulty: 'MEDIUM',
    competences: {
      primary: 'MATHEMATIQUES',
      secondary: ['CONCENTRATION', 'RESOLUTION_PROBLEMES']
    }
  },
  'CLASSIC_HARD': {
    mode: 'CLASSIC',
    difficulty: 'HARD',
    competences: {
      primary: 'RESOLUTION_PROBLEMES',
      secondary: ['MATHEMATIQUES', 'SENS_CRITIQUE']
    }
  },
  'CLASSIC_EXPERT': {
    mode: 'CLASSIC',
    difficulty: 'EXPERT',
    competences: {
      primary: 'RESOLUTION_PROBLEMES',
      secondary: ['MATHEMATIQUES', 'SENS_CRITIQUE', 'CONCENTRATION']
    }
  },
  'TIMED_EASY': {
    mode: 'TIMED',
    difficulty: 'EASY',
    competences: {
      primary: 'CONCENTRATION',
      secondary: ['MATHEMATIQUES']
    }
  },
  'TIMED_MEDIUM': {
    mode: 'TIMED',
    difficulty: 'MEDIUM',
    competences: {
      primary: 'CONCENTRATION',
      secondary: ['MATHEMATIQUES', 'SENS_CRITIQUE']
    }
  },
  'TIMED_HARD': {
    mode: 'TIMED',
    difficulty: 'HARD',
    competences: {
      primary: 'CONCENTRATION',
      secondary: ['MATHEMATIQUES', 'SENS_CRITIQUE', 'RESOLUTION_PROBLEMES']
    }
  },
  'TIMED_EXPERT': {
    mode: 'TIMED',
    difficulty: 'EXPERT',
    competences: {
      primary: 'CONCENTRATION',
      secondary: ['MATHEMATIQUES', 'SENS_CRITIQUE', 'RESOLUTION_PROBLEMES']
    }
  },
  'CHALLENGE_EASY': {
    mode: 'CHALLENGE',
    difficulty: 'EASY',
    competences: {
      primary: 'RESOLUTION_PROBLEMES',
      secondary: ['MATHEMATIQUES']
    }
  },
  'CHALLENGE_MEDIUM': {
    mode: 'CHALLENGE',
    difficulty: 'MEDIUM',
    competences: {
      primary: 'RESOLUTION_PROBLEMES',
      secondary: ['MATHEMATIQUES', 'SENS_CRITIQUE']
    }
  },
  'CHALLENGE_HARD': {
    mode: 'CHALLENGE',
    difficulty: 'HARD',
    competences: {
      primary: 'RESOLUTION_PROBLEMES',
      secondary: ['MATHEMATIQUES', 'SENS_CRITIQUE', 'CONCENTRATION']
    }
  },
  'CHALLENGE_EXPERT': {
    mode: 'CHALLENGE',
    difficulty: 'EXPERT',
    competences: {
      primary: 'RESOLUTION_PROBLEMES',
      secondary: ['MATHEMATIQUES', 'SENS_CRITIQUE', 'CONCENTRATION']
    }
  }
};

/**
 * Interface pour les données de score NuméroMagic
 */
interface NumeroMagicScoreData {
  score: number;
  level: number;
  gameMode: GameMode;
  difficultyLevel: DifficultyLevel;
  totalRounds: number;
  successfulRounds: number;
  accuracyRate: number;
  averageSolveTimeMs?: number;
  maxCombo: number;
  bestStreak: number;
  engagementScore: number;
  flowScore: number;
  userAge?: number; // Âge de l'utilisateur pour pondération adaptative
}

/**
 * 🧮 Calculer le score de performance (0-10) basé sur les métriques NuméroMagic
 * 
 * Facteurs pris en compte:
 * - Score total (poids 30%)
 * - Taux de précision (poids 25%)
 * - Engagement et flow (poids 20%)
 * - Combos et séries (poids 15%)
 * - Temps de résolution (poids 10%)
 * - Pondération par âge
 */
function calculatePerformanceScore(scoreData: NumeroMagicScoreData, userAge: number): number {
  // Score de base (0-10)
  let performanceScore = 0;

  // 1. Score total (poids 30%)
  // Normaliser le score sur une échelle 0-10
  // Score de 0-100 = 0-3 points, 100-500 = 3-7 points, 500+ = 7-10 points
  const scoreComponent = Math.min(10, Math.max(0, (scoreData.score / 50) * 3));
  performanceScore += scoreComponent * 0.3;

  // 2. Taux de précision (poids 25%)
  // 100% de précision = 10 points
  const accuracyComponent = (scoreData.accuracyRate / 100) * 10;
  performanceScore += accuracyComponent * 0.25;

  // 3. Engagement et flow (poids 20%)
  // Moyenne des deux scores (0-100) normalisée sur 10
  const engagementFlowComponent = ((scoreData.engagementScore + scoreData.flowScore) / 200) * 10;
  performanceScore += engagementFlowComponent * 0.2;

  // 4. Combos et séries (poids 15%)
  // Plus les combos/séries sont élevés, mieux c'est
  const comboComponent = Math.min(10, Math.max(0, (scoreData.maxCombo + scoreData.bestStreak) / 2));
  performanceScore += comboComponent * 0.15;

  // 5. Temps de résolution (poids 10%)
  // Plus rapide = meilleur score (si applicable)
  if (scoreData.averageSolveTimeMs && scoreData.averageSolveTimeMs > 0) {
    // Normaliser: 0-5s = 10 points, 5-15s = 7 points, 15-30s = 4 points, 30s+ = 1 point
    let timeComponent = 10;
    if (scoreData.averageSolveTimeMs > 5000) timeComponent = 7;
    if (scoreData.averageSolveTimeMs > 15000) timeComponent = 4;
    if (scoreData.averageSolveTimeMs > 30000) timeComponent = 1;
    performanceScore += timeComponent * 0.1;
  } else {
    performanceScore += 5 * 0.1; // Score neutre si pas de temps
  }

  // 6. Pondération par âge
  // Les enfants plus âgés ont des attentes plus élevées
  const ageMultiplier = userAge >= 10 ? 1.0 : userAge >= 8 ? 0.9 : 0.8;
  performanceScore *= ageMultiplier;

  // S'assurer que le score reste entre 0 et 10
  return Math.min(10, Math.max(0, performanceScore));
}

/**
 * 🎯 Mettre à jour les compétences du radar basées sur la performance NuméroMagic
 * 
 * Cette fonction est appelée après chaque partie pour mettre à jour
 * automatiquement les compétences de l'enfant dans le radar.
 * 
 * @param userId - ID de la session utilisateur
 * @param scoreData - Données de performance de la partie
 */
export async function updateNumeroMagicCompetences(
  userId: string,
  scoreData: NumeroMagicScoreData
): Promise<void> {
  // 🔒 Transaction Prisma pour garantir la cohérence des données
  // Si une mise à jour échoue, toutes sont annulées
  return await prisma.$transaction(async (tx) => {
    try {
      console.log(`🔢 Mise à jour compétences NuméroMagic pour user ${userId}`);
      console.log(`📊 Score: ${scoreData.score}, Mode: ${scoreData.gameMode}, Difficulté: ${scoreData.difficultyLevel}, Accuracy: ${scoreData.accuracyRate}%`);

      // 1. Récupérer le mapping pour le mode et la difficulté
      const mappingKey = `${scoreData.gameMode}_${scoreData.difficultyLevel}`;
      const mapping = NUMEROMAGIC_COMPETENCE_MAP[mappingKey];
      
      if (!mapping) {
        console.warn(`⚠️ Mode/difficulté inconnu: ${mappingKey}`);
        return;
      }

      // 2. Calculer le score de performance (0-10) avec pondération par âge
      const userAge = scoreData.userAge || 7; // Défaut: 7 ans
      const performanceScore = calculatePerformanceScore(scoreData, userAge);
      console.log(`📈 Score de performance calculé: ${performanceScore.toFixed(2)}/10 (âge: ${userAge} ans)`);

      // Préparer toutes les mises à jour dans un tableau
      const updates: Array<{
        competenceType: CompetenceType;
        score: number;
        weight: number;
        source: string;
      }> = [];

      // 3. Compétence principale (poids 100%)
      updates.push({
        competenceType: mapping.competences.primary,
        score: performanceScore,
        weight: 1.0,
        source: `NuméroMagic ${scoreData.gameMode} ${scoreData.difficultyLevel}`
      });

      // 4. Compétences secondaires (poids 30%)
      for (const competence of mapping.competences.secondary) {
        updates.push({
          competenceType: competence,
          score: performanceScore * 0.8, // Score légèrement réduit pour les secondaires
          weight: 0.3,
          source: `NuméroMagic ${scoreData.gameMode} ${scoreData.difficultyLevel} (secondaire)`
        });
      }

      console.log(`🔄 Mise à jour de ${updates.length} compétences`);

      // 5. Exécuter toutes les mises à jour
      for (const update of updates) {
        // Récupérer ou créer la compétence
        const competence = await tx.competence.upsert({
          where: { type: update.competenceType },
          update: {},
          create: {
            type: update.competenceType,
            name: update.competenceType.charAt(0).toUpperCase() + update.competenceType.slice(1),
            icon: '🧠', // Icône par défaut
            color: '#7E66FF' // Couleur par défaut
          }
        });

        // Récupérer l'évaluation existante ou en créer une nouvelle
        const existingAssessment = await tx.competenceAssessment.findFirst({
          where: {
            userSessionId: userId,
            competenceId: competence.id
          }
        });

        if (existingAssessment) {
          // Mise à jour de l'évaluation existante avec moyenne pondérée
          const currentScore = existingAssessment.score;
          const currentWeight = existingAssessment.weight || 1.0;
          
          // Calculer la nouvelle moyenne pondérée
          const totalWeight = currentWeight + update.weight;
          const newScore = ((currentScore * currentWeight) + (update.score * update.weight)) / totalWeight;
          const newLevel = Math.floor(newScore) + 1; // Niveau = score entier + 1
          const newProgress = ((newScore % 1) * 100); // Progression = partie décimale * 100

          await tx.competenceAssessment.update({
            where: { id: existingAssessment.id },
            data: {
              score: newScore,
              level: newLevel,
              progress: newProgress,
              weight: totalWeight,
              lastUpdated: new Date(),
              metadata: {
                ...existingAssessment.metadata as any,
                lastGame: 'NuméroMagic',
                lastUpdate: new Date().toISOString(),
                gameMode: scoreData.gameMode,
                difficultyLevel: scoreData.difficultyLevel,
                gameScore: scoreData.score,
                accuracyRate: scoreData.accuracyRate
              }
            }
          });

          console.log(`✅ Compétence ${update.competenceType} mise à jour: ${currentScore.toFixed(2)} → ${newScore.toFixed(2)} (niveau ${newLevel})`);
        } else {
          // Création d'une nouvelle évaluation
          const newLevel = Math.floor(update.score) + 1;
          const newProgress = ((update.score % 1) * 100);

          await tx.competenceAssessment.create({
            data: {
              userSessionId: userId,
              competenceId: competence.id,
              score: update.score,
              level: newLevel,
              progress: newProgress,
              weight: update.weight,
              lastUpdated: new Date(),
              metadata: {
                firstGame: 'NuméroMagic',
                gameMode: scoreData.gameMode,
                difficultyLevel: scoreData.difficultyLevel,
                gameScore: scoreData.score,
                accuracyRate: scoreData.accuracyRate,
                totalRounds: scoreData.totalRounds,
                successfulRounds: scoreData.successfulRounds
              }
            }
          });

          console.log(`🆕 Nouvelle compétence ${update.competenceType} créée: ${update.score.toFixed(2)} (niveau ${newLevel})`);
        }
      }

      console.log(`✅ Mise à jour des compétences NuméroMagic terminée pour user ${userId}`);
    } catch (error) {
      console.error(`❌ Erreur mise à jour compétences NuméroMagic:`, error);
      throw error; // Re-throw pour que la transaction soit annulée
    }
  });
}
