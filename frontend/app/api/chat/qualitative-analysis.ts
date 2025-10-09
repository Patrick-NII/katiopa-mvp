/**
 * 🎯 SYSTÈME D'ANALYSE QUALITATIVE
 * 
 * Traduit les données quantitatives (scores, niveaux) en langage naturel
 * compréhensible par les parents, sans jargon technique.
 * 
 * @author CubeAI Team
 * @date 2025-10-09
 */

/**
 * Analyser le niveau CubeMatch de façon qualitative
 */
export function analyzeCubeMatchLevel(level: number, age: number): string {
  // Normaliser selon l'âge (attentes différentes)
  const ageAdjustedLevel = level / (age >= 10 ? 1 : age >= 8 ? 0.8 : 0.6);
  
  if (ageAdjustedLevel < 3) {
    return "découvre le jeu et apprend les bases";
  } else if (ageAdjustedLevel < 7) {
    return "maîtrise bien les opérations simples";
  } else if (ageAdjustedLevel < 12) {
    return "montre une excellente maîtrise des calculs";
  } else if (ageAdjustedLevel < 18) {
    return "excelle dans les calculs rapides et complexes";
  } else {
    return "atteint un niveau exceptionnel, bien au-delà de son âge";
  }
}

/**
 * Analyser le score CubeMatch de façon qualitative
 */
export function analyzeCubeMatchScore(score: number, level: number): string {
  const scorePerLevel = score / Math.max(level, 1);
  
  if (scorePerLevel < 50) {
    return "progresse à son rythme";
  } else if (scorePerLevel < 100) {
    return "obtient de bons résultats";
  } else if (scorePerLevel < 150) {
    return "réalise d'excellentes performances";
  } else {
    return "affiche des scores impressionnants";
  }
}

/**
 * Analyser les performances NuméroMagic de façon qualitative
 */
export function analyzeNumeroMagicPerformance(data: {
  bestScore: number;
  totalGames: number;
  averageScore: number;
  accuracyRate: number;
  favoriteMode: string;
  difficultyLevel: string;
  age: number;
}): string {
  const { bestScore, totalGames, accuracyRate, favoriteMode, difficultyLevel, age } = data;
  
  let analysis = "";
  
  // Analyse du score
  if (bestScore < 100) {
    analysis = "découvre le jeu et s'habitue aux mécaniques";
  } else if (bestScore < 300) {
    analysis = "commence à bien comprendre les stratégies";
  } else if (bestScore < 500) {
    analysis = "montre une bonne maîtrise du calcul mental";
  } else if (bestScore < 800) {
    analysis = "excelle dans la résolution de problèmes numériques";
  } else {
    analysis = "atteint un niveau exceptionnel de calcul mental";
  }
  
  // Ajout du contexte de difficulté
  if (difficultyLevel === 'EASY') {
    analysis += " en mode découverte";
  } else if (difficultyLevel === 'MEDIUM') {
    analysis += " avec des défis intermédiaires";
  } else if (difficultyLevel === 'HARD' || difficultyLevel === 'EXPERT') {
    analysis += " sur des défis avancés";
  }
  
  // Ajout du contexte de mode
  if (favoriteMode === 'TIMED') {
    analysis += ". Il aime particulièrement les défis chronométrés, ce qui développe sa concentration";
  } else if (favoriteMode === 'CHALLENGE') {
    analysis += ". Il préfère les défis complexes, ce qui renforce sa résolution de problèmes";
  }
  
  // Précision
  if (accuracyRate >= 90) {
    analysis += " avec une très grande précision";
  } else if (accuracyRate >= 70) {
    analysis += " avec une bonne précision";
  }
  
  return analysis;
}

/**
 * Analyser la progression globale en mathématiques
 */
export function analyzeMathProgression(data: {
  cubeMatchData?: any;
  numeroMagicData?: any;
  childName: string;
  age: number;
}): string {
  const { cubeMatchData, numeroMagicData, childName, age } = data;
  
  if (!cubeMatchData && !numeroMagicData) {
    return `${childName} n'a pas encore exploré les jeux mathématiques. Ce serait une excellente opportunité de découvrir CubeMatch ou NuméroMagic pour développer ses compétences en calcul.`;
  }
  
  let analysis = `${childName} `;
  
  // Analyse CubeMatch
  if (cubeMatchData) {
    const levelAnalysis = analyzeCubeMatchLevel(cubeMatchData.currentLevel || 1, age);
    const scoreAnalysis = analyzeCubeMatchScore(cubeMatchData.bestScore || 0, cubeMatchData.currentLevel || 1);
    
    analysis += `${levelAnalysis} dans CubeMatch et ${scoreAnalysis}`;
    
    if (cubeMatchData.favoriteOperator) {
      const opNames: Record<string, string> = {
        'ADD': 'les additions',
        'SUB': 'les soustractions',
        'MUL': 'les multiplications',
        'DIV': 'les divisions'
      };
      const opName = opNames[cubeMatchData.favoriteOperator] || 'les calculs';
      analysis += `. Il montre une préférence pour ${opName}`;
    }
  }
  
  // Analyse NuméroMagic
  if (numeroMagicData) {
    const nmAnalysis = analyzeNumeroMagicPerformance({
      bestScore: numeroMagicData.bestScore || 0,
      totalGames: numeroMagicData.totalGames || 0,
      averageScore: numeroMagicData.averageScore || 0,
      accuracyRate: numeroMagicData.recentScores?.[0]?.accuracyRate || 100,
      favoriteMode: numeroMagicData.favoriteMode || 'CLASSIC',
      difficultyLevel: numeroMagicData.preferredDifficulty || 'EASY',
      age
    });
    
    if (cubeMatchData) {
      analysis += `. Dans NuméroMagic, il ${nmAnalysis}`;
    } else {
      analysis += nmAnalysis;
    }
  }
  
  return analysis + ".";
}

/**
 * Traduire un niveau de compétence (0-10) en description qualitative
 */
export function describeCompetenceLevel(score: number, competenceName: string): string {
  if (score < 3) {
    return `découvre ${competenceName} et pose les premières bases`;
  } else if (score < 5) {
    return `progresse bien en ${competenceName}`;
  } else if (score < 7) {
    return `maîtrise correctement ${competenceName}`;
  } else if (score < 9) {
    return `excelle en ${competenceName}`;
  } else {
    return `atteint un niveau exceptionnel en ${competenceName}`;
  }
}

/**
 * Générer une analyse complète d'un enfant (qualitative)
 */
export function generateChildQualitativeAnalysis(child: any): string {
  let analysis = "";
  
  // Analyse mathématiques (basée sur les jeux)
  const mathAnalysis = analyzeMathProgression({
    cubeMatchData: child.cubeMatchData,
    numeroMagicData: child.numeroMagicData,
    childName: child.firstName,
    age: child.age || 8
  });
  
  analysis += mathAnalysis;
  
  // Suggestions basées sur les performances
  if (child.cubeMatchData && child.cubeMatchData.currentLevel > 10) {
    analysis += ` Il serait intéressant d'explorer des défis plus complexes pour continuer à stimuler ses capacités.`;
  }
  
  if (child.numeroMagicData && child.numeroMagicData.preferredDifficulty === 'EASY') {
    analysis += ` Il pourrait être prêt pour passer au niveau moyen dans NuméroMagic.`;
  }
  
  return analysis;
}

