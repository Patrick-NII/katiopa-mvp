import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function generateAnalysis(analysisData) {
  const { user, competence, assessment, recentAttempts, previousAnalyses } = analysisData

  // Construire le prompt pour l'IA
  const prompt = buildAnalysisPrompt(user, competence, assessment, recentAttempts, previousAnalyses)

  try {
    // Ici vous pouvez intégrer avec OpenAI ou votre service IA préféré
    // Pour l'instant, nous générons une analyse basée sur des règles
    
    const analysis = generateRuleBasedAnalysis(user, competence, assessment, recentAttempts)
    
    return {
      text: analysis.text,
      recommendations: analysis.recommendations
    }
  } catch (error) {
    console.error('Erreur lors de la génération de l\'analyse:', error)
    
    // Fallback avec une analyse générique
    return {
      text: generateFallbackAnalysis(user, competence, assessment),
      recommendations: generateFallbackRecommendations(competence, assessment)
    }
  }
}

function buildAnalysisPrompt(user, competence, assessment, recentAttempts, previousAnalyses) {
  return `
Analyse pédagogique pour ${user.firstName} ${user.lastName} (${user.age} ans, ${user.grade || 'N/A'})

Compétence: ${competence.name}
Description: ${competence.description}

Score actuel: ${assessment?.score || 0}/10
Niveau: ${assessment?.level || 'Débutant'}
Progression: ${assessment?.progress || 0}%

Tentatives récentes (7 derniers jours):
${recentAttempts.map(attempt => 
  `- ${attempt.exercise.title} (${attempt.exercise.type}, difficulté ${attempt.exercise.difficulty}/5): ${attempt.score}%`
).join('\n')}

Analyses précédentes:
${previousAnalyses.map(analysis => 
  `- ${analysis.date.toISOString().split('T')[0]}: ${analysis.analysis.substring(0, 100)}...`
).join('\n')}

Générez une analyse personnalisée et des recommandations adaptées.
`
}

function generateRuleBasedAnalysis(user, competence, assessment, recentAttempts) {
  const score = assessment?.score || 0
  const level = assessment?.level || 'Débutant'
  const attemptsCount = recentAttempts.length
  const averageScore = attemptsCount > 0 
    ? recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / attemptsCount 
    : 0

  // Analyse basée sur les règles
  let analysis = `Analyse de ${competence.name} pour ${user.firstName}:\n\n`
  
  if (score >= 8) {
    analysis += `${user.firstName} excelle dans ${competence.name.toLowerCase()} ! Son niveau "${level}" témoigne d'une maîtrise solide. `
    if (averageScore >= 80) {
      analysis += `Ses performances récentes sont excellentes avec une moyenne de ${Math.round(averageScore)}%. `
    }
    analysis += `Il est prêt pour des défis plus avancés et pourrait même aider ses camarades.`
  } else if (score >= 6) {
    analysis += `${user.firstName} montre de bonnes compétences en ${competence.name.toLowerCase()}. Son niveau "${level}" indique une progression constante. `
    if (averageScore >= 60) {
      analysis += `Ses tentatives récentes montrent une amélioration avec ${attemptsCount} exercices complétés. `
    }
    analysis += `Avec de la pratique régulière, il peut facilement atteindre le niveau supérieur.`
  } else if (score >= 4) {
    analysis += `${user.firstName} développe ses compétences en ${competence.name.toLowerCase()}. Son niveau "${level}" montre qu'il progresse bien. `
    if (attemptsCount > 0) {
      analysis += `Il a fait ${attemptsCount} exercices récemment, ce qui est encourageant. `
    }
    analysis += `Il faut continuer à pratiquer pour consolider ses acquis.`
  } else {
    analysis += `${user.firstName} commence son apprentissage en ${competence.name.toLowerCase()}. `
    if (attemptsCount === 0) {
      analysis += `Il serait bénéfique de commencer par des exercices de base pour construire ses fondations. `
    } else {
      analysis += `Ses ${attemptsCount} tentatives récentes montrent sa motivation à apprendre. `
    }
    analysis += `Avec de la patience et de la pratique, il va progresser rapidement.`
  }

  // Recommandations
  const recommendations = generateRecommendations(competence, score, level, attemptsCount, averageScore)

  return {
    text: analysis,
    recommendations
  }
}

function generateRecommendations(competence, score, level, attemptsCount, averageScore) {
  const recommendations = []

  if (score >= 8) {
    recommendations.push({
      type: 'advanced',
      title: 'Défis avancés',
      description: `Proposer des exercices de difficulté 4-5 pour maintenir l'engagement`,
      priority: 'high'
    })
    recommendations.push({
      type: 'mentoring',
      title: 'Aide aux pairs',
      description: `Encourager ${competence.name.toLowerCase()} à aider d'autres enfants`,
      priority: 'medium'
    })
  } else if (score >= 6) {
    recommendations.push({
      type: 'practice',
      title: 'Pratique régulière',
      description: `Continuer avec des exercices de difficulté 2-3 pour consolider`,
      priority: 'high'
    })
    recommendations.push({
      type: 'variety',
      title: 'Variété d\'exercices',
      description: `Proposer différents types d'exercices pour maintenir l'intérêt`,
      priority: 'medium'
    })
  } else if (score >= 4) {
    recommendations.push({
      type: 'foundation',
      title: 'Renforcement des bases',
      description: `Se concentrer sur des exercices de difficulté 1-2`,
      priority: 'high'
    })
    recommendations.push({
      type: 'frequency',
      title: 'Fréquence d\'entraînement',
      description: `Augmenter la fréquence des exercices (3-4 par semaine)`,
      priority: 'high'
    })
  } else {
    recommendations.push({
      type: 'basics',
      title: 'Apprentissage des fondamentaux',
      description: `Commencer par des exercices très simples (difficulté 1)`,
      priority: 'high'
    })
    recommendations.push({
      type: 'motivation',
      title: 'Encouragement',
      description: `Célébrer chaque petit progrès pour maintenir la motivation`,
      priority: 'high'
    })
  }

  if (attemptsCount === 0) {
    recommendations.push({
      type: 'engagement',
      title: 'Premier exercice',
      description: `Proposer un premier exercice simple pour démarrer`,
      priority: 'critical'
    })
  }

  if (averageScore < 50 && attemptsCount > 3) {
    recommendations.push({
      type: 'support',
      title: 'Soutien supplémentaire',
      description: `Considérer un accompagnement personnalisé`,
      priority: 'medium'
    })
  }

  return recommendations
}

function generateFallbackAnalysis(user, competence, assessment) {
  const score = assessment?.score || 0
  const level = assessment?.level || 'Débutant'
  
  return `${user.firstName} travaille actuellement sur ${competence.name.toLowerCase()}. 
Son niveau actuel est "${level}" avec un score de ${score}/10. 
Continuez à pratiquer régulièrement pour améliorer ses compétences dans cette matière.`
}

function generateFallbackRecommendations(competence, assessment) {
  const score = assessment?.score || 0
  
  if (score >= 6) {
    return [{
      type: 'practice',
      title: 'Pratique continue',
      description: `Continuer à pratiquer ${competence.name.toLowerCase()} régulièrement`,
      priority: 'medium'
    }]
  } else {
    return [{
      type: 'basics',
      title: 'Renforcement des bases',
      description: `Se concentrer sur les exercices de base en ${competence.name.toLowerCase()}`,
      priority: 'high'
    }]
  }
}
