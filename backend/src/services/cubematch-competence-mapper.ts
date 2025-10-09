/**
 * 🎮 CUBEMATCH COMPETENCE MAPPER SERVICE
 * 
 * Service pour mapper les performances CubeMatch vers les compétences du radar
 * Chaque partie de CubeMatch met à jour automatiquement les compétences de l'enfant
 * 
 * @author CubeAI Team
 * @date 2025-10-08
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Types des opérateurs CubeMatch
 */
type Operator = 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MIXED';

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
 * Structure de mapping opérateur → compétences
 */
interface CubeMatchCompetenceMapping {
  operator: Operator;
  competences: {
    primary: CompetenceType;      // Compétence principale (poids 1.0)
    secondary: CompetenceType[];  // Compétences secondaires (poids 0.3)
  };
}

/**
 * 🗺️ Mapping des opérateurs vers les compétences du radar (8 côtés)
 * 
 * Logique CubeMatch → Compétences Radar:
 * - Addition/Soustraction → Mathématiques + Concentration
 * - Multiplication/Division → Mathématiques + Concentration (tables de multiplication)
 * - Tous → Concentration (temps de réaction)
 * - Niveaux élevés → Résolution de problèmes
 * - Mode MIXED → Résolution de problèmes + Sens critique
 */
const OPERATOR_COMPETENCE_MAP: Record<Operator, CubeMatchCompetenceMapping> = {
  'ADD': {
    operator: 'ADD',
    competences: {
      primary: 'MATHEMATIQUES',
      secondary: ['CONCENTRATION', 'SENS_CRITIQUE']
    }
  },
  'SUB': {
    operator: 'SUB',
    competences: {
      primary: 'MATHEMATIQUES',
      secondary: ['CONCENTRATION', 'SENS_CRITIQUE']
    }
  },
  'MUL': {
    operator: 'MUL',
    competences: {
      primary: 'MATHEMATIQUES',
      secondary: ['CONCENTRATION', 'RESOLUTION_PROBLEMES']
    }
  },
  'DIV': {
    operator: 'DIV',
    competences: {
      primary: 'MATHEMATIQUES',
      secondary: ['CONCENTRATION', 'RESOLUTION_PROBLEMES']
    }
  },
  'MIXED': {
    operator: 'MIXED',
    competences: {
      primary: 'RESOLUTION_PROBLEMES',
      secondary: ['MATHEMATIQUES', 'CONCENTRATION', 'SENS_CRITIQUE']
    }
  }
};

/**
 * Interface des données de score CubeMatch
 */
interface CubeMatchScoreData {
  operator: Operator;
  score: number;
  level: number;
  accuracyRate: number;
  averageMoveTimeMs: number;
  comboMax: number;
  totalMoves: number;
  successfulMoves: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  userAge?: number; // Âge de l'utilisateur pour pondération adaptative
}

/**
 * 🎯 Mettre à jour les compétences du radar basées sur la performance CubeMatch
 * 
 * Cette fonction est appelée après chaque partie pour mettre à jour
 * automatiquement les compétences de l'enfant dans le radar.
 * 
 * @param userId - ID de la session utilisateur
 * @param scoreData - Données de performance de la partie
 */
export async function updateCubeMatchCompetences(
  userId: string,
  scoreData: CubeMatchScoreData
): Promise<void> {
  // 🔒 Transaction Prisma pour garantir la cohérence des données
  // Si une mise à jour échoue, toutes sont annulées
  return await prisma.$transaction(async (tx) => {
    try {
      console.log(`🎯 Mise à jour compétences CubeMatch pour user ${userId}`);
      console.log(`📊 Score: ${scoreData.score}, Niveau: ${scoreData.level}, Accuracy: ${scoreData.accuracyRate}%`);

      // 1. Récupérer le mapping pour l'opérateur utilisé
      const mapping = OPERATOR_COMPETENCE_MAP[scoreData.operator];
      
      if (!mapping) {
        console.warn(`⚠️ Opérateur inconnu: ${scoreData.operator}`);
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
        source: `CubeMatch ${scoreData.operator}`
      });

      // 4. Compétences secondaires (poids 30%)
      for (const competenceType of mapping.competences.secondary) {
        updates.push({
          competenceType,
          score: performanceScore,
          weight: 0.3,
          source: `CubeMatch ${scoreData.operator} (secondaire)`
        });
      }

      // 5. Bonus: Si accuracy >90%, bonus sur "vitesse"
      if (scoreData.accuracyRate > 90 && scoreData.averageMoveTimeMs < 3000) {
        updates.push({
          competenceType: 'vitesse',
          score: performanceScore,
          weight: 0.5,
          source: 'CubeMatch Vitesse bonus'
        });
        console.log('⚡ Bonus vitesse appliqué (accuracy >90% + rapide)');
      }

      // 6. Bonus: Si niveau élevé, bonus sur "problemes"
      if (scoreData.level >= 20) {
        const problemSolvingBonus = Math.min(10, performanceScore + (scoreData.level - 20) * 0.1);
        updates.push({
          competenceType: 'problemes',
          score: problemSolvingBonus,
          weight: 0.4,
          source: 'CubeMatch Niveau élevé'
        });
        console.log(`🧩 Bonus résolution de problèmes appliqué (niveau ${scoreData.level})`);
      }

      // 7. Appliquer toutes les mises à jour dans la transaction
      for (const update of updates) {
        await updateCompetenceInTransaction(
          tx,
          userId,
          update.competenceType,
          update.score,
          update.weight,
          update.source
        );
      }

      console.log('✅ Compétences mises à jour avec succès (transaction complète)');

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des compétences CubeMatch:', error);
      throw error; // Rollback automatique de la transaction
    }
  });
}

/**
 * 📊 Calculer le score de performance (0-10) basé sur les métriques
 * 
 * Formule pondérée adaptative par âge:
 * - Accuracy: Priorité constante (35-45%)
 * - Level: Progression valorisée (25-30%)
 * - Combo: Capacité à enchaîner (15-20%)
 * - Speed: Pondération évolutive par âge (5-20%)
 * 
 * @param scoreData - Données de performance
 * @param userAge - Âge de l'utilisateur (optionnel, défaut: 7)
 * @returns Score normalisé entre 0 et 10
 */
function calculatePerformanceScore(scoreData: CubeMatchScoreData, userAge: number = 7): number {
  // Facteur d'accuracy (0-1)
  const accuracyFactor = Math.min(1, scoreData.accuracyRate / 100);

  // Facteur de niveau (0-1, max niveau 50 pour normalisation)
  const levelFactor = Math.min(1, scoreData.level / 50);

  // Facteur de combo (0-1, max combo 20 pour normalisation)
  const comboFactor = Math.min(1, scoreData.comboMax / 20);

  // Facteur de vitesse (0-1) avec seuils adaptés à l'âge
  // Plus l'enfant est jeune, plus les seuils sont généreux
  const speedThresholds = getSpeedThresholdsByAge(userAge);
  let speedFactor = 0.3;
  if (scoreData.averageMoveTimeMs < speedThresholds.excellent) {
    speedFactor = 1.0;
  } else if (scoreData.averageMoveTimeMs < speedThresholds.good) {
    speedFactor = 0.8;
  } else if (scoreData.averageMoveTimeMs < speedThresholds.medium) {
    speedFactor = 0.5;
  }

  // 🎯 Pondération adaptative par âge
  const ageWeights = getAgeBasedWeights(userAge);
  
  // Score pondéré avec poids adaptatifs
  const weightedScore =
    accuracyFactor * ageWeights.accuracy +
    levelFactor * ageWeights.level +
    comboFactor * ageWeights.combo +
    speedFactor * ageWeights.speed;

  // Normaliser sur 10
  const finalScore = Math.min(10, Math.max(0, weightedScore * 10));

  console.log(`📊 Breakdown performance (âge ${userAge} ans):`, {
    accuracy: `${(accuracyFactor * 100).toFixed(0)}% (poids ${(ageWeights.accuracy * 100).toFixed(0)}%)`,
    level: `${(levelFactor * 100).toFixed(0)}% (poids ${(ageWeights.level * 100).toFixed(0)}%)`,
    combo: `${(comboFactor * 100).toFixed(0)}% (poids ${(ageWeights.combo * 100).toFixed(0)}%)`,
    speed: `${(speedFactor * 100).toFixed(0)}% (poids ${(ageWeights.speed * 100).toFixed(0)}%)`,
    finalScore: finalScore.toFixed(2)
  });

  return finalScore;
}

/**
 * 🎯 Obtenir les seuils de vitesse adaptés à l'âge
 * Plus l'enfant est jeune, plus les seuils sont généreux
 */
function getSpeedThresholdsByAge(age: number): {
  excellent: number;
  good: number;
  medium: number;
} {
  if (age <= 5) {
    return { excellent: 5000, good: 7000, medium: 10000 }; // Très généreux
  } else if (age === 6) {
    return { excellent: 4000, good: 6000, medium: 8000 };  // Généreux
  } else if (age === 7) {
    return { excellent: 3000, good: 5000, medium: 7000 };  // Standard
  } else if (age === 8) {
    return { excellent: 2500, good: 4000, medium: 6000 };  // Exigeant
  } else {
    return { excellent: 2000, good: 3000, medium: 5000 };  // Très exigeant (9+ ans)
  }
}

/**
 * 🎯 Obtenir les poids adaptatifs selon l'âge
 * 
 * Principe:
 * - Jeunes (5-6 ans): Vitesse compte peu, accuracy + niveau comptent plus
 * - Standard (7-8 ans): Équilibre
 * - Avancés (9+ ans): Vitesse et combo plus importants
 */
function getAgeBasedWeights(age: number): {
  accuracy: number;
  level: number;
  combo: number;
  speed: number;
} {
  if (age <= 5) {
    return {
      accuracy: 0.45,  // 45% - Priorité à la précision
      level: 0.30,     // 30% - Progression valorisée
      combo: 0.20,     // 20% - Enchaînements encouragés
      speed: 0.05      // 5% - Vitesse peu importante
    };
  } else if (age === 6) {
    return {
      accuracy: 0.42,
      level: 0.30,
      combo: 0.18,
      speed: 0.10
    };
  } else if (age === 7) {
    return {
      accuracy: 0.40,
      level: 0.28,
      combo: 0.18,
      speed: 0.14
    };
  } else if (age === 8) {
    return {
      accuracy: 0.38,
      level: 0.27,
      combo: 0.18,
      speed: 0.17
    };
  } else {
    return {
      accuracy: 0.35,  // 35% - Accuracy toujours importante
      level: 0.25,     // 25% - Niveau
      combo: 0.20,     // 20% - Combo
      speed: 0.20      // 20% - Vitesse importante pour 9+ ans
    };
  }
}

/**
 * 🔄 Mettre à jour une compétence spécifique dans une transaction
 * 
 * Version transactionnelle pour garantir la cohérence
 * 
 * @param tx - Transaction Prisma
 * @param userId - ID de la session utilisateur
 * @param competenceType - Type de compétence à mettre à jour
 * @param score - Nouveau score (0-10)
 * @param weight - Poids de la mise à jour (0-1)
 * @param source - Source de la mise à jour (pour logs)
 */
async function updateCompetenceInTransaction(
  tx: any, // Prisma transaction
  userId: string,
  competenceType: CompetenceType,
  score: number,
  weight: number = 1.0,
  source: string = 'CubeMatch'
): Promise<void> {
  try {
    // 1. Trouver la compétence par type
    const competence = await tx.competence.findFirst({
      where: { 
        type: {
          equals: competenceType,
          mode: 'insensitive'
        }
      }
    });

    if (!competence) {
      console.warn(`⚠️ Compétence non trouvée: ${competenceType}`);
      return;
    }

    // 2. Récupérer l'assessment actuel
    const currentAssessment = await tx.competenceAssessment.findUnique({
      where: {
        competenceId_userSessionId: {
          competenceId: competence.id,
          userSessionId: userId
        }
      }
    });

    // 3. Calculer le nouveau score (moyenne pondérée)
    const currentScore = currentAssessment?.score || 0;
    const weightedNewScore = score * weight;
    
    // Formule: 70% ancien score + 30% nouveau score (avec poids appliqué)
    const newScore = currentScore * 0.7 + weightedNewScore * 0.3;
    
    // Limiter entre 0 et 10
    const finalScore = Math.min(10, Math.max(0, newScore));

    // 4. Déterminer le niveau textuel
    const level = getLevelFromScore(finalScore);
    
    // 5. Calculer la progression (0-100%)
    const progress = (finalScore / 10) * 100;

    console.log(`🔄 Mise à jour ${competenceType}:`, {
      source,
      oldScore: currentScore.toFixed(2),
      newScore: weightedNewScore.toFixed(2),
      finalScore: finalScore.toFixed(2),
      level,
      weight
    });

    // 6. Upsert dans la transaction
    await tx.competenceAssessment.upsert({
      where: {
        competenceId_userSessionId: {
          competenceId: competence.id,
          userSessionId: userId
        }
      },
      update: {
        score: finalScore,
        level,
        progress,
        lastUpdated: new Date()
      },
      create: {
        competenceId: competence.id,
        userSessionId: userId,
        score: finalScore,
        level,
        progress,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error(`❌ Erreur mise à jour compétence ${competenceType}:`, error);
    throw error; // Propage pour rollback de la transaction
  }
}

/**
 * 🔄 Mettre à jour une compétence spécifique dans le radar (version legacy)
 * 
 * Utilise une moyenne pondérée pour lisser les variations:
 * - 70% score actuel (pour stabilité)
 * - 30% nouveau score (pour progression)
 * 
 * @deprecated Utiliser updateCompetenceInTransaction pour la cohérence
 * @param userId - ID de la session utilisateur
 * @param competenceType - Type de compétence à mettre à jour
 * @param score - Nouveau score (0-10)
 * @param weight - Poids de la mise à jour (0-1)
 * @param source - Source de la mise à jour (pour logs)
 */
async function updateCompetence(
  userId: string,
  competenceType: CompetenceType,
  score: number,
  weight: number = 1.0,
  source: string = 'CubeMatch'
): Promise<void> {
  try {
    // 1. Trouver la compétence par type
    const competence = await prisma.competence.findFirst({
      where: { 
        type: {
          equals: competenceType,
          mode: 'insensitive'
        }
      }
    });

    if (!competence) {
      console.warn(`⚠️ Compétence non trouvée: ${competenceType}`);
      return;
    }

    // 2. Récupérer l'assessment actuel
    const currentAssessment = await prisma.competenceAssessment.findUnique({
      where: {
        competenceId_userSessionId: {
          competenceId: competence.id,
          userSessionId: userId
        }
      }
    });

    // 3. Calculer le nouveau score (moyenne pondérée)
    const currentScore = currentAssessment?.score || 0;
    const weightedNewScore = score * weight;
    
    // Formule: 70% ancien score + 30% nouveau score (avec poids appliqué)
    const newScore = currentScore * 0.7 + weightedNewScore * 0.3;
    
    // Limiter entre 0 et 10
    const finalScore = Math.min(10, Math.max(0, newScore));

    // 4. Déterminer le niveau textuel
    const level = getLevelFromScore(finalScore);
    
    // 5. Calculer la progression (0-100%)
    const progress = (finalScore / 10) * 100;

    console.log(`🔄 Mise à jour ${competenceType}:`, {
      source,
      oldScore: currentScore.toFixed(2),
      newScore: weightedNewScore.toFixed(2),
      finalScore: finalScore.toFixed(2),
      level,
      weight
    });

    // 6. Upsert dans la base de données
    await prisma.competenceAssessment.upsert({
      where: {
        competenceId_userSessionId: {
          competenceId: competence.id,
          userSessionId: userId
        }
      },
      update: {
        score: finalScore,
        level,
        progress,
        lastUpdated: new Date()
      },
      create: {
        competenceId: competence.id,
        userSessionId: userId,
        score: finalScore,
        level,
        progress,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error(`❌ Erreur mise à jour compétence ${competenceType}:`, error);
    // Ne pas throw pour ne pas bloquer les autres mises à jour
  }
}

/**
 * 📊 Déterminer le niveau textuel basé sur le score
 * 
 * @param score - Score de 0 à 10
 * @returns Niveau textuel
 */
function getLevelFromScore(score: number): string {
  if (score >= 9) return 'Maître';
  if (score >= 7.5) return 'Avancé';
  if (score >= 6) return 'Confirmé';
  if (score >= 4) return 'Intermédiaire';
  if (score >= 2) return 'Apprenti';
  return 'Débutant';
}

/**
 * 🧪 Fonction de test pour vérifier le mapping
 * 
 * @param userId - ID utilisateur pour le test
 */
export async function testCubeMatchCompetenceMapping(userId: string): Promise<void> {
  console.log('🧪 Test du mapping CubeMatch → Compétences');
  
  const testScoreData: CubeMatchScoreData = {
    operator: 'MUL',
    score: 15000,
    level: 25,
    accuracyRate: 92,
    averageMoveTimeMs: 2500,
    comboMax: 15,
    totalMoves: 50,
    successfulMoves: 46,
    difficulty: 'HARD'
  };
  
  console.log('📝 Données de test:', testScoreData);
  
  await updateCubeMatchCompetences(userId, testScoreData);
  
  console.log('✅ Test terminé - Vérifiez le radar pour voir les changements');
}

/**
 * 📊 Obtenir un résumé de l'impact CubeMatch sur les compétences
 * 
 * @param userId - ID utilisateur
 * @returns Résumé de l'impact
 */
export async function getCubeMatchCompetenceImpact(userId: string): Promise<{
  competence: string;
  currentScore: number;
  level: string;
  source: string;
}[]> {
  const competences = await prisma.competenceAssessment.findMany({
    where: { userSessionId: userId },
    include: { competence: true },
    orderBy: { score: 'desc' }
  });

  return competences.map(assessment => ({
    competence: assessment.competence.type,
    currentScore: Number(assessment.score),
    level: assessment.level,
    source: 'Évaluation globale (incluant CubeMatch)'
  }));
}

export default {
  updateCubeMatchCompetences,
  testCubeMatchCompetenceMapping,
  getCubeMatchCompetenceImpact
};

